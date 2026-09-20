import { getFirestore, type Firestore } from 'firebase/firestore';
import { getFirebaseApp } from './config';

export const getDb = (): Firestore => getFirestore(getFirebaseApp());

/** Nomes das coleções (um único lugar para não errar digitação). */
export const COL = {
  users: 'users',
  products: 'products',
  categories: 'categories',
  brands: 'brands',
  promotions: 'promotions',
  orders: 'orders',
} as const;

/** Mensagem amigável para erros comuns do Firestore/Storage. */
export function firebaseErrorMessage(err: unknown, fallback = 'Não foi possível concluir. Tente novamente.'): string {
  const code = typeof err === 'object' && err !== null && 'code' in err ? String((err as { code: unknown }).code) : '';
  if (code.includes('permission-denied') || code === 'storage/unauthorized') {
    return 'Sem permissão para esta ação. Verifique se você está logado como administrador e se as Security Rules foram publicadas.';
  }
  if (code.includes('unavailable') || code === 'storage/retry-limit-exceeded') return 'Sem conexão com o servidor. Tente novamente.';
  if (code === 'storage/quota-exceeded') return 'A cota do Firebase Storage foi atingida.';
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}
