import { LOW_STOCK_THRESHOLD } from '@/lib/constants';
import type { OrderStatus, Product, ProductStatus, StockApplied, StockState } from '@/types';

export const STOCK_LABEL: Record<StockState, string> = {
  in_stock: 'Em estoque',
  low_stock: 'Estoque baixo',
  out_of_stock: 'Sem estoque',
};

export const PRODUCT_STATUS_LABEL: Record<ProductStatus, string> = {
  active: 'Ativo',
  inactive: 'Inativo',
  out_of_stock: 'Sem estoque',
};

export const computeAvailable = (stock: number, reserved: number): number => Math.max(0, stock - reserved);

export function getStockState(p: Pick<Product, 'availableStock'>): StockState {
  if (p.availableStock <= 0) return 'out_of_stock';
  if (p.availableStock <= LOW_STOCK_THRESHOLD) return 'low_stock';
  return 'in_stock';
}

export function getProductStatus(p: Pick<Product, 'active' | 'availableStock'>): ProductStatus {
  if (!p.active) return 'inactive';
  if (p.availableStock <= 0) return 'out_of_stock';
  return 'active';
}

/** Produto sem estoque (ou inativo) NÃO pode ser comprado. */
export const isPurchasable = (p: Pick<Product, 'active' | 'availableStock'>): boolean =>
  p.active && p.availableStock > 0;

/* ---------------------------------------------------------------------
   Estoque x pedidos
   O estoque só muda quando o ADMIN muda o status do pedido (o cliente nunca
   escreve no estoque). Regra:
     pendente ............ nada reservado
     confirmado/em preparo/enviado ... RESERVA (reservedStock += qtd)
     concluído ........... BAIXA (stock -= qtd)
     cancelado ........... devolve (libera a reserva ou repõe a baixa)
   --------------------------------------------------------------------- */
export function targetStockApplied(status: OrderStatus): StockApplied {
  switch (status) {
    case 'confirmed':
    case 'processing':
    case 'shipped':
      return 'reserved';
    case 'completed':
      return 'deducted';
    default:
      return 'none'; // pending, cancelled
  }
}

export interface StockDelta {
  stock: number;
  reserved: number;
}

const vec = (state: StockApplied, qty: number): StockDelta => {
  if (state === 'reserved') return { stock: 0, reserved: qty };
  if (state === 'deducted') return { stock: -qty, reserved: 0 };
  return { stock: 0, reserved: 0 };
};

/** Quanto somar em stock/reservedStock ao passar de um estado para outro. */
export function stockDeltaFor(from: StockApplied, to: StockApplied, qty: number): StockDelta {
  const a = vec(from, qty);
  const b = vec(to, qty);
  return { stock: b.stock - a.stock, reserved: b.reserved - a.reserved };
}

export class InsufficientStockError extends Error {
  readonly productName: string;
  constructor(productName: string) {
    super(`Estoque insuficiente para "${productName}".`);
    this.name = 'InsufficientStockError';
    this.productName = productName;
  }
}

export interface StockValues {
  stock: number;
  reservedStock: number;
  availableStock: number;
}

/** Aplica o delta e recalcula o disponível. Lança InsufficientStockError se faltar estoque. */
export function applyStockDelta(
  product: { name: string; stock: number; reservedStock: number },
  delta: StockDelta,
): StockValues {
  const stock = product.stock + delta.stock;
  const reservedStock = product.reservedStock + delta.reserved;
  const committing = delta.stock < 0 || delta.reserved > 0;
  if (committing && (stock < 0 || reservedStock < 0 || stock - reservedStock < 0)) {
    throw new InsufficientStockError(product.name);
  }
  const s = Math.max(0, stock);
  const r = Math.max(0, reservedStock);
  return { stock: s, reservedStock: r, availableStock: computeAvailable(s, r) };
}
