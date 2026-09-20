import { Timestamp, type DocumentData } from 'firebase/firestore';
import type {
  Brand, Category, Order, OrderItem, PaymentMethod, PaymentStatus, OrderStatus, Product, ProductCondition,
  ProductPromotion, Promotion, StockApplied, StoredImage, UserProfile, UserRole,
} from '@/types';
import { computeAvailable } from '@/utils/stock';

/* Converte o que vem do Firestore (dados soltos) em objetos tipados e SEGUROS:
   campos ausentes ganham valor padrão, então o site não quebra com documentos incompletos. */

const str = (v: unknown, d = ''): string => (typeof v === 'string' ? v : d);
const num = (v: unknown, d = 0): number => (typeof v === 'number' && Number.isFinite(v) ? v : d);
const numOrNull = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const bool = (v: unknown, d = false): boolean => (typeof v === 'boolean' ? v : d);

export const toDate = (v: unknown): Date | null => {
  if (v instanceof Timestamp) return v.toDate();
  if (v instanceof Date) return v;
  return null;
};

const CONDITIONS: ProductCondition[] = ['new', 'used', 'refurbished'];
const ORDER_STATUSES: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'completed', 'cancelled'];
const PAYMENT_STATUSES: PaymentStatus[] = ['pending', 'paid', 'cancelled'];
const PAYMENT_METHODS: PaymentMethod[] = ['arrange_whatsapp', 'pay_on_pickup', 'pix', 'card', 'mercado_pago', 'stripe'];
const STOCK_APPLIED: StockApplied[] = ['none', 'reserved', 'deducted'];

function oneOf<T extends string>(v: unknown, list: readonly T[], d: T): T {
  return typeof v === 'string' && (list as readonly string[]).includes(v) ? (v as T) : d;
}

function storedImage(v: unknown): StoredImage | null {
  if (typeof v !== 'object' || v === null) return null;
  const o = v as Record<string, unknown>;
  const url = str(o.url);
  if (!url) return null;
  return { url, path: str(o.path), thumbUrl: str(o.thumbUrl) || undefined, thumbPath: str(o.thumbPath) || undefined };
}

function promotion(v: unknown): ProductPromotion | null {
  if (typeof v !== 'object' || v === null) return null;
  const o = v as Record<string, unknown>;
  const promoPrice = num(o.promoPrice);
  if (promoPrice <= 0) return null;
  return { promoPrice, startsAt: toDate(o.startsAt), endsAt: toDate(o.endsAt), active: bool(o.active, true) };
}

export function productFromDoc(id: string, d: DocumentData): Product {
  const stock = Math.max(0, Math.trunc(num(d.stock)));
  const reservedStock = Math.max(0, Math.trunc(num(d.reservedStock)));
  return {
    id,
    name: str(d.name, 'Produto'),
    slug: str(d.slug, id),
    description: str(d.description),
    shortDescription: str(d.shortDescription),
    price: num(d.price),
    oldPrice: numOrNull(d.oldPrice),
    costPrice: numOrNull(d.costPrice),
    discountPercentage: num(d.discountPercentage),
    brandId: str(d.brandId) || null,
    categoryId: str(d.categoryId),
    condition: oneOf(d.condition, CONDITIONS, 'new'),
    stock,
    reservedStock,
    availableStock: typeof d.availableStock === 'number' ? Math.max(0, d.availableStock) : computeAvailable(stock, reservedStock),
    sku: str(d.sku),
    featured: bool(d.featured),
    onSale: bool(d.onSale),
    active: bool(d.active),
    imageUrl: str(d.imageUrl),
    imagePath: str(d.imagePath),
    thumbUrl: str(d.thumbUrl),
    thumbPath: str(d.thumbPath),
    additionalImages: Array.isArray(d.additionalImages)
      ? d.additionalImages.map(storedImage).filter((x): x is StoredImage => x !== null)
      : [],
    promotion: promotion(d.promotion),
    demo: bool(d.demo),
    createdAt: toDate(d.createdAt),
    updatedAt: toDate(d.updatedAt),
  };
}

export function categoryFromDoc(id: string, d: DocumentData): Category {
  return {
    id,
    name: str(d.name, id),
    slug: str(d.slug, id),
    description: str(d.description),
    imageUrl: str(d.imageUrl),
    imagePath: str(d.imagePath),
    icon: str(d.icon, 'zap'),
    active: bool(d.active),
    demo: bool(d.demo),
    createdAt: toDate(d.createdAt),
    updatedAt: toDate(d.updatedAt),
  };
}

export function brandFromDoc(id: string, d: DocumentData): Brand {
  return {
    id,
    name: str(d.name, id),
    logoUrl: str(d.logoUrl),
    logoPath: str(d.logoPath),
    active: bool(d.active),
    demo: bool(d.demo),
    createdAt: toDate(d.createdAt),
    updatedAt: toDate(d.updatedAt),
  };
}

export function promotionFromDoc(id: string, d: DocumentData): Promotion {
  return {
    id,
    productId: str(d.productId, id),
    productName: str(d.productName),
    regularPrice: num(d.regularPrice),
    promoPrice: num(d.promoPrice),
    discountPercentage: num(d.discountPercentage),
    startsAt: toDate(d.startsAt),
    endsAt: toDate(d.endsAt),
    active: bool(d.active),
    demo: bool(d.demo),
    createdAt: toDate(d.createdAt),
    updatedAt: toDate(d.updatedAt),
  };
}

export function userFromDoc(uid: string, d: DocumentData): UserProfile {
  return {
    uid,
    name: str(d.name),
    email: str(d.email),
    phone: str(d.phone),
    photoURL: str(d.photoURL),
    role: oneOf<UserRole>(d.role, ['customer', 'admin'], 'customer'),
    createdAt: toDate(d.createdAt),
    updatedAt: toDate(d.updatedAt),
  };
}

function orderItem(v: unknown): OrderItem | null {
  if (typeof v !== 'object' || v === null) return null;
  const o = v as Record<string, unknown>;
  const productId = str(o.productId);
  if (!productId) return null;
  const price = num(o.price);
  return {
    productId,
    name: str(o.name, 'Produto'),
    price,
    originalPrice: num(o.originalPrice, price),
    quantity: Math.max(1, Math.trunc(num(o.quantity, 1))),
    imageUrl: str(o.imageUrl),
    sku: str(o.sku),
  };
}

export function orderFromDoc(id: string, d: DocumentData): Order {
  const c = typeof d.customer === 'object' && d.customer !== null ? (d.customer as Record<string, unknown>) : {};
  return {
    id,
    userId: str(d.userId),
    customer: { name: str(c.name), email: str(c.email), phone: str(c.phone) },
    items: Array.isArray(d.items) ? d.items.map(orderItem).filter((x): x is OrderItem => x !== null) : [],
    subtotal: num(d.subtotal),
    discount: num(d.discount),
    shipping: num(d.shipping),
    total: num(d.total),
    paymentMethod: oneOf(d.paymentMethod, PAYMENT_METHODS, 'arrange_whatsapp'),
    paymentStatus: oneOf(d.paymentStatus, PAYMENT_STATUSES, 'pending'),
    orderStatus: oneOf(d.orderStatus, ORDER_STATUSES, 'pending'),
    stockApplied: oneOf(d.stockApplied, STOCK_APPLIED, 'none'),
    notes: str(d.notes),
    demo: bool(d.demo),
    createdAt: toDate(d.createdAt),
    updatedAt: toDate(d.updatedAt),
  };
}
