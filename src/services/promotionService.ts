import { collection, doc, getDoc, onSnapshot, serverTimestamp, writeBatch, type Unsubscribe } from 'firebase/firestore';
import { COL, getDb } from '@/firebase/firestore';
import type { Product, Promotion } from '@/types';
import { calcDiscountPercent } from '@/utils/pricing';
import { productFromDoc, promotionFromDoc } from './mappers';

type OnError = (err: Error) => void;

/** Painel: todas as promoções (a coleção só é legível por administradores). */
export function subscribePromotions(cb: (list: Promotion[]) => void, onError: OnError): Unsubscribe {
  return onSnapshot(collection(getDb(), COL.promotions), (s) => cb(s.docs.map((d) => promotionFromDoc(d.id, d.data()))), onError);
}

export interface PromotionInput {
  product: Product;
  promoPrice: number;
  startsAt: Date | null;
  endsAt: Date | null;
  active: boolean;
}

/**
 * Salva a promoção e copia o preço promocional para o produto NA MESMA operação (atômica).
 * Assim o site público lê tudo em uma consulta só, e nunca há promoção "solta" desconectada do produto.
 * Uma promoção por produto: o id do documento é o id do produto.
 */
export async function savePromotion(input: PromotionInput): Promise<void> {
  const db = getDb();
  const { product } = input;
  const discountPercentage = calcDiscountPercent(product.price, input.promoPrice);
  const batch = writeBatch(db);
  batch.set(
    doc(db, COL.promotions, product.id),
    {
      productId: product.id,
      productName: product.name,
      regularPrice: product.price,
      promoPrice: input.promoPrice,
      discountPercentage,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      active: input.active,
      demo: product.demo,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
  batch.update(doc(db, COL.products, product.id), {
    onSale: input.active,
    discountPercentage,
    promotion: { promoPrice: input.promoPrice, startsAt: input.startsAt, endsAt: input.endsAt, active: input.active },
    updatedAt: serverTimestamp(),
  });
  await batch.commit();
}

export async function setPromotionActive(promo: Promotion, active: boolean): Promise<void> {
  const db = getDb();
  const batch = writeBatch(db);
  batch.update(doc(db, COL.promotions, promo.id), { active, updatedAt: serverTimestamp() });
  batch.update(doc(db, COL.products, promo.productId), {
    onSale: active,
    'promotion.active': active,
    updatedAt: serverTimestamp(),
  });
  await batch.commit();
}

/** Remove a promoção e devolve o produto ao preço normal. */
export async function removePromotion(promo: Promotion): Promise<void> {
  const db = getDb();
  const snap = await getDoc(doc(db, COL.products, promo.productId));
  const batch = writeBatch(db);
  batch.delete(doc(db, COL.promotions, promo.id));
  if (snap.exists()) {
    const p = productFromDoc(snap.id, snap.data());
    batch.update(doc(db, COL.products, promo.productId), {
      onSale: false,
      promotion: null,
      discountPercentage: p.oldPrice ? calcDiscountPercent(p.oldPrice, p.price) : 0,
      updatedAt: serverTimestamp(),
    });
  }
  await batch.commit();
}
