import {
  collection, deleteDoc, doc, getDoc, getDocs, limit, onSnapshot, query, serverTimestamp, setDoc, updateDoc, where,
  type Unsubscribe,
} from 'firebase/firestore';
import { COL, getDb } from '@/firebase/firestore';
import { deleteFile, uploadBlob } from '@/firebase/storage';
import { hasStorageConfigured } from '@/firebase/config';
import type { Brand } from '@/types';
import { extensionFor, processImage } from '@/utils/image';
import { slugify } from '@/utils/slug';
import { brandFromDoc } from './mappers';

type OnError = (err: Error) => void;

export function subscribeActiveBrands(cb: (list: Brand[]) => void, onError: OnError): Unsubscribe {
  const q = query(collection(getDb(), COL.brands), where('active', '==', true));
  return onSnapshot(q, (s) => cb(s.docs.map((d) => brandFromDoc(d.id, d.data()))), onError);
}

export function subscribeAllBrands(cb: (list: Brand[]) => void, onError: OnError): Unsubscribe {
  return onSnapshot(collection(getDb(), COL.brands), (s) => cb(s.docs.map((d) => brandFromDoc(d.id, d.data()))), onError);
}

export interface BrandInput {
  name: string;
  active: boolean;
}

export interface BrandSaveOptions {
  existing: Brand | null;
  logoFile?: File | null;
  removeLogo?: boolean;
}

async function freeId(base: string): Promise<string> {
  let id = base || 'marca';
  for (let i = 2; (await getDoc(doc(getDb(), COL.brands, id))).exists(); i++) id = `${base}-${i}`;
  return id;
}

export async function saveBrand(input: BrandInput, opts: BrandSaveOptions): Promise<string> {
  const db = getDb();
  const id = opts.existing?.id ?? (await freeId(slugify(input.name)));
  let logoUrl = opts.existing?.logoUrl ?? '';
  let logoPath = opts.existing?.logoPath ?? '';
  const oldPath = logoPath;

  if (opts.logoFile) {
    if (hasStorageConfigured()) {
      const img = await processImage(opts.logoFile);
      const up = await uploadBlob(`brand-images/${id}/${Date.now()}.${extensionFor(img.main.type)}`, img.main);
      logoUrl = up.url;
      logoPath = up.path;
    } else {
      logoUrl = '/brand/logo-mark.webp';
      logoPath = '';
    }
  } else if (opts.removeLogo) {
    logoUrl = '/brand/logo-mark.webp';
    logoPath = '';
  }

  const data = { name: input.name.trim(), logoUrl, logoPath, active: input.active, demo: opts.existing?.demo ?? false, updatedAt: serverTimestamp() };
  if (opts.existing) await updateDoc(doc(db, COL.brands, id), data);
  else await setDoc(doc(db, COL.brands, id), { ...data, createdAt: serverTimestamp() });

  if (oldPath && oldPath !== logoPath) void deleteFile(oldPath);
  return id;
}

export async function setBrandActive(id: string, active: boolean): Promise<void> {
  await updateDoc(doc(getDb(), COL.brands, id), { active, updatedAt: serverTimestamp() });
}

export async function deleteBrand(brand: Brand): Promise<void> {
  const inUse = await getDocs(query(collection(getDb(), COL.products), where('brandId', '==', brand.id), limit(1)));
  if (!inUse.empty) {
    throw new Error('Esta marca ainda tem produtos. Troque a marca desses produtos ou apenas desative a marca.');
  }
  await deleteDoc(doc(getDb(), COL.brands, brand.id));
  await deleteFile(brand.logoPath);
}
