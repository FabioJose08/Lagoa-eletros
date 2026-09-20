import type { CartItem, CartLine, Product } from '@/types';
import { getPriceInfo } from './pricing';

/** Junta o carrinho (só ids e quantidades) com os produtos ATUAIS do catálogo: preço e estoque sempre em dia. */
export function buildCartLines(items: CartItem[], products: Product[], now: Date = new Date()): CartLine[] {
  const byId = new Map(products.map((p) => [p.id, p]));
  return items.map((item): CartLine => {
    const product = byId.get(item.productId) ?? null;
    if (!product) {
      return { item, product: null, unitPrice: 0, unitOriginalPrice: 0, lineTotal: 0, maxQuantity: 0, problem: 'unavailable' };
    }
    const price = getPriceInfo(product, now);
    const max = product.active ? product.availableStock : 0;
    const problem: CartLine['problem'] =
      !product.active ? 'unavailable' : max <= 0 ? 'out_of_stock' : item.quantity > max ? 'insufficient_stock' : null;
    return {
      item,
      product,
      unitPrice: price.current,
      unitOriginalPrice: price.previous ?? price.current,
      lineTotal: problem ? 0 : price.current * item.quantity,
      maxQuantity: max,
      problem,
    };
  });
}

export interface CartTotals {
  count: number;
  subtotal: number;
  discount: number;
  total: number;
  hasProblems: boolean;
}

/** Totais consideram só as linhas que podem ser compradas agora. */
export function cartTotals(lines: CartLine[]): CartTotals {
  let subtotal = 0;
  let total = 0;
  let count = 0;
  let hasProblems = false;
  for (const l of lines) {
    if (l.problem) {
      hasProblems = true;
      continue;
    }
    count += l.item.quantity;
    subtotal += l.unitOriginalPrice * l.item.quantity;
    total += l.lineTotal;
  }
  const round = (n: number): number => Math.round(n * 100) / 100;
  return { count, subtotal: round(subtotal), discount: round(subtotal - total), total: round(total), hasProblems };
}

export function addToCart(items: CartItem[], productId: string, quantity: number, max?: number): CartItem[] {
  const qty = Math.max(1, Math.trunc(quantity));
  const existing = items.find((i) => i.productId === productId);
  const cap = (n: number): number => (max !== undefined && max > 0 ? Math.min(n, max) : n);
  if (existing) return items.map((i) => (i.productId === productId ? { ...i, quantity: cap(i.quantity + qty) } : i));
  return [...items, { productId, quantity: cap(qty) }];
}

export function setCartQuantity(items: CartItem[], productId: string, quantity: number): CartItem[] {
  if (quantity <= 0) return items.filter((i) => i.productId !== productId);
  return items.map((i) => (i.productId === productId ? { ...i, quantity: Math.trunc(quantity) } : i));
}

/** Lê o carrinho salvo no aparelho, descartando qualquer coisa inválida. */
export function sanitizeCart(raw: unknown): CartItem[] {
  if (!Array.isArray(raw)) return [];
  const out: CartItem[] = [];
  for (const r of raw) {
    if (typeof r !== 'object' || r === null) continue;
    const o = r as Record<string, unknown>;
    if (typeof o.productId === 'string' && o.productId && typeof o.quantity === 'number' && o.quantity >= 1) {
      if (!out.some((x) => x.productId === o.productId)) out.push({ productId: o.productId, quantity: Math.min(99, Math.trunc(o.quantity)) });
    }
  }
  return out;
}
