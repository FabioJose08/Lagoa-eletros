import {
  collection, doc, getDoc, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc, type Unsubscribe,
} from 'firebase/firestore';
import { COL, getDb } from '@/firebase/firestore';
import type { FirebaseUser } from '@/firebase/auth';
import { uploadBlob } from '@/firebase/storage';
import { hasStorageConfigured } from '@/firebase/config';
import type { UserProfile } from '@/types';
import { extensionFor, processImage } from '@/utils/image';
import { userFromDoc } from './mappers';

type OnError = (err: Error) => void;

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(getDb(), COL.users, uid));
  return snap.exists() ? userFromDoc(snap.id, snap.data()) : null;
}

/**
 * Garante que existe users/{uid}. Todo perfil nasce como "customer": as Security Rules
 * recusam qualquer tentativa de criar um perfil com outra role a partir do site.
 */
export async function ensureUserProfile(user: FirebaseUser, extras: { name?: string; phone?: string } = {}): Promise<UserProfile> {
  const existing = await getUserProfile(user.uid);
  if (existing) return existing;
  const data = {
    uid: user.uid,
    name: (extras.name ?? user.displayName ?? '').trim(),
    email: user.email ?? '',
    phone: (extras.phone ?? '').trim(),
    photoURL: user.photoURL ?? '',
    role: 'customer' as const,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(doc(getDb(), COL.users, user.uid), data);
  const created = await getUserProfile(user.uid);
  return created ?? userFromDoc(user.uid, { ...data, createdAt: null, updatedAt: null });
}

export interface ProfilePatch {
  name: string;
  phone: string;
  photoURL?: string;
}

/** O cliente só pode alterar nome, telefone e foto (as Security Rules garantem isso no servidor). */
export async function updateUserProfile(uid: string, patch: ProfilePatch): Promise<void> {
  const data: Record<string, unknown> = { name: patch.name.trim(), phone: patch.phone.trim(), updatedAt: serverTimestamp() };
  if (patch.photoURL !== undefined) data.photoURL = patch.photoURL;
  await updateDoc(doc(getDb(), COL.users, uid), data);
}

export async function uploadProfilePhoto(uid: string, file: File): Promise<string> {
  if (!hasStorageConfigured()) return '/brand/logo-mark.webp';
  const img = await processImage(file);
  const up = await uploadBlob(`profile-images/${uid}/avatar-${Date.now()}.${extensionFor(img.thumb.type)}`, img.thumb);
  return up.url;
}

/** Painel (somente leitura): lista de usuários cadastrados. */
export function subscribeUsers(cb: (list: UserProfile[]) => void, onError: OnError): Unsubscribe {
  const q = query(collection(getDb(), COL.users), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (s) => cb(s.docs.map((d) => userFromDoc(d.id, d.data()))), onError);
}
