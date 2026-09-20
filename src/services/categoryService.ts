import {
  collection, doc, getDoc, getDocs, limit, onSnapshot, query, serverTimestamp, setDoc, updateDoc, where, deleteDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import { COL, getDb } from '@/firebase/firestore';
import { deleteFile, uploadBlob } from '@/firebase/storage';
import { hasStorageConfigured } from '@/firebase/config';
import type { Category } from '@/types';
import { extensionFor, processImage } from '@/utils/image';
import { slugify } from '@/utils/slug';
import { categoryFromDoc } from './mappers';

type OnError = (err: Error) => void;

export function subscribeActiveCategories(cb: (list: Category[]) => void, onError: OnError): Unsubscribe {
  const q = query(collection(getDb(), COL.categories), where('active', '==', true));
  return onSnapshot(q, (s) => cb(s.docs.map((d) => categoryFromDoc(d.id, d.data()))), onError);
}

export function subscribeAllCategories(cb: (list: Category[]) => void, onError: OnError): Unsubscribe {
  return onSnapshot(collection(getDb(), COL.categories), (s) => cb(s.docs.map((d) => categoryFromDoc(d.id, d.data()))), onError);
}

export interface CategoryInput {
  name: string;
  description: string;
  icon: string;
  active: boolean;
}

export interface CategorySaveOptions {
  existing: Category | null;
  /** Nova imagem escolhida (será otimizada e enviada). */
  imageFile?: File | null;
  removeImage?: boolean;
}

/** O id da categoria é o próprio slug (ex.: "celulares"), o que deixa as URLs legíveis: /categories/celulares. */
async function freeId(base: string): Promise<string> {
  let id = base || 'categoria';
  for (let i = 2; (await getDoc(doc(getDb(), COL.categories, id))).exists(); i++) id = `${base}-${i}`;
  return id;
}

export async function saveCategory(input: CategoryInput, opts: CategorySaveOptions): Promise<string> {
  const db = getDb();
  const id = opts.existing?.id ?? (await freeId(slugify(input.name)));
  let imageUrl = opts.existing?.imageUrl ?? '';
  let imagePath = opts.existing?.imagePath ?? '';
  const oldPath = imagePath;

  if (opts.imageFile) {
    if (hasStorageConfigured()) {
      const img = await processImage(opts.imageFile);
      const up = await uploadBlob(`category-images/${id}/${Date.now()}.${extensionFor(img.main.type)}`, img.main);
      imageUrl = up.url;
      imagePath = up.path;
    } else {
      imageUrl = '/brand/logo-mark.webp';
      imagePath = '';
    }
  } else if (opts.removeImage) {
    imageUrl = '/brand/logo-mark.webp';
    imagePath = '';
  }

  const data = {
    name: input.name.trim(),
    slug: id,
    description: input.description.trim(),
    icon: input.icon,
    active: input.active,
    imageUrl,
    imagePath,
    demo: opts.existing?.demo ?? false,
    updatedAt: serverTimestamp(),
  };
  if (opts.existing) await updateDoc(doc(db, COL.categories, id), data);
  else await setDoc(doc(db, COL.categories, id), { ...data, createdAt: serverTimestamp() });

  if (oldPath && oldPath !== imagePath) void deleteFile(oldPath);
  return id;
}

export async function setCategoryActive(id: string, active: boolean): Promise<void> {
  await updateDoc(doc(getDb(), COL.categories, id), { active, updatedAt: serverTimestamp() });
}

/** Não permite excluir categoria que ainda tem produtos (o admin deve mover os produtos ou desativar a categoria). */
export async function deleteCategory(cat: Category): Promise<void> {
  const inUse = await getDocs(query(collection(getDb(), COL.products), where('categoryId', '==', cat.id), limit(1)));
  if (!inUse.empty) {
    throw new Error('Esta categoria ainda tem produtos. Mova os produtos para outra categoria ou apenas desative a categoria.');
  }
  await deleteDoc(doc(getDb(), COL.categories, cat.id));
  await deleteFile(cat.imagePath);
}
