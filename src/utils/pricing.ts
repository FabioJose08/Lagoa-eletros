import type { Product, ProductPromotion } from '@/types';

export interface PriceInfo {
  /** Preço que o cliente paga agora. */
  current: number;
  /** Preço "de" (riscado), quando existir. */
  previous: number | null;
  discountPercent: number;
  /** true somente quando há promoção ATIVA e dentro do período. */
  isPromo: boolean;
}

export function calcDiscountPercent(previous: number, current: number): number {
  if (previous <= 0 || current >= previous) return 0;
  return Math.round((1 - current / previous) * 100);
}

/** Promoção vale agora? (ativa + dentro do período de início/fim + preço válido). */
export function isPromotionActive(promo: ProductPromotion | null | undefined, now: Date = new Date()): boolean {
  if (!promo || !promo.active || !(promo.promoPrice > 0)) return false;
  if (promo.startsAt && now < promo.startsAt) return false;
  if (promo.endsAt && now > promo.endsAt) return false;
  return true;
}

/**
 * Regra única de preço usada em TODO o site (catálogo, produto, carrinho e pedido):
 * 1) promoção ativa e válida  -> paga o preço promocional; "de" = preço normal
 * 2) senão, se há "preço anterior" maior que o preço -> mostra o preço anterior riscado
 * 3) senão, só o preço.
 */
export function getPriceInfo(
  p: Pick<Product, 'price' | 'oldPrice' | 'onSale' | 'promotion'>,
  now: Date = new Date(),
): PriceInfo {
  if (p.onSale && isPromotionActive(p.promotion, now) && p.promotion && p.promotion.promoPrice < p.price) {
    const current = p.promotion.promoPrice;
    return { current, previous: p.price, discountPercent: calcDiscountPercent(p.price, current), isPromo: true };
  }
  const previous = p.oldPrice !== null && p.oldPrice > p.price ? p.oldPrice : null;
  return {
    current: p.price,
    previous,
    discountPercent: previous !== null ? calcDiscountPercent(previous, p.price) : 0,
    isPromo: false,
  };
}
