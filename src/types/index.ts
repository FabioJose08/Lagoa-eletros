/* =====================================================================
   TIPOS DO DOMÍNIO — Lagoa Eletros
   Datas: no Firestore ficam como Timestamp; nos tipos abaixo já vêm
   convertidas para Date (ou null quando ainda não gravadas pelo servidor).
   ===================================================================== */

export type ProductCondition = 'new' | 'used' | 'refurbished';
export type ProductStatus = 'active' | 'inactive' | 'out_of_stock';
export type StockState = 'in_stock' | 'low_stock' | 'out_of_stock';

export type UserRole = 'customer' | 'admin';

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'completed' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'cancelled';
/** Métodos habilitados hoje: 'arrange_whatsapp' e 'pay_on_pickup'. Os demais são reservados para gateways futuros. */
export type PaymentMethod = 'arrange_whatsapp' | 'pay_on_pickup' | 'pix' | 'card' | 'mercado_pago' | 'stripe';
/** Situação do estoque em relação ao pedido (evita aplicar/estornar duas vezes). */
export type StockApplied = 'none' | 'reserved' | 'deducted';

/** Imagem guardada no Cloud Storage (a URL é o que o site usa; o path serve para excluir). */
export interface StoredImage {
  url: string;
  path: string;
  thumbUrl?: string;
  thumbPath?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  imagePath: string;
  /** Chave do ícone (ver components/common/CategoryIcon). */
  icon: string;
  active: boolean;
  demo: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface Brand {
  id: string;
  name: string;
  logoUrl: string;
  logoPath: string;
  active: boolean;
  demo: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
}

/** Promoção embutida no produto (cópia da coleção "promotions", para o site ler em uma consulta só). */
export interface ProductPromotion {
  promoPrice: number;
  startsAt: Date | null;
  endsAt: Date | null;
  active: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: number;
  oldPrice: number | null;
  costPrice: number | null;
  discountPercentage: number;
  brandId: string | null;
  categoryId: string;
  condition: ProductCondition;
  stock: number;
  reservedStock: number;
  availableStock: number;
  sku: string;
  featured: boolean;
  onSale: boolean;
  active: boolean;
  imageUrl: string;
  imagePath: string;
  thumbUrl: string;
  thumbPath: string;
  additionalImages: StoredImage[];
  promotion: ProductPromotion | null;
  demo: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
}

/** Registro administrativo de promoção (documento promotions/{productId}). */
export interface Promotion {
  id: string;
  productId: string;
  productName: string;
  regularPrice: number;
  promoPrice: number;
  discountPercentage: number;
  startsAt: Date | null;
  endsAt: Date | null;
  active: boolean;
  demo: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
}

/** Usuário autenticado (Firebase Authentication), já com a informação de admin. */
export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  isAdmin: boolean;
}

/** Perfil salvo no Firestore: users/{uid}. */
export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phone: string;
  photoURL: string;
  role: UserRole;
  createdAt: Date | null;
  updatedAt: Date | null;
}

/** Item do carrinho guardado no aparelho: só o essencial. Preço e estoque vêm sempre do Firestore. */
export interface CartItem {
  productId: string;
  quantity: number;
}

/** Linha do carrinho já combinada com o produto atual do catálogo. */
export interface CartLine {
  item: CartItem;
  product: Product | null;
  unitPrice: number;
  unitOriginalPrice: number;
  lineTotal: number;
  /** Máximo que pode comprar agora (estoque disponível). */
  maxQuantity: number;
  /** null = pode comprar; caso contrário, o motivo. */
  problem: 'unavailable' | 'out_of_stock' | 'insufficient_stock' | null;
}

/** Foto instantânea do produto no momento da compra (não muda se o produto mudar depois). */
export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  originalPrice: number;
  quantity: number;
  imageUrl: string;
  sku: string;
}

export interface OrderCustomer {
  name: string;
  email: string;
  phone: string;
}

export interface Order {
  id: string;
  userId: string;
  customer: OrderCustomer;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  stockApplied: StockApplied;
  notes: string;
  demo: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
}

/* ---------- Formulários do painel ---------- */

/** Rascunho de imagem no formulário: já existente no Storage ou recém-escolhida. */
export interface ImageDraft {
  id: string;
  kind: 'existing' | 'new';
  /** URL para exibir o preview (URL do Storage ou blob local). */
  previewUrl: string;
  existing?: StoredImage;
  /** Arquivos já comprimidos, prontos para enviar. */
  mainBlob?: Blob;
  thumbBlob?: Blob;
  fileName?: string;
  sizeBytes?: number;
}

export interface ProductFormValues {
  name: string;
  sku: string;
  shortDescription: string;
  description: string;
  categoryId: string;
  brandId: string;
  price: string;
  oldPrice: string;
  costPrice: string;
  stock: string;
  reservedStock: string;
  condition: ProductCondition;
  featured: boolean;
  active: boolean;
  onSale: boolean;
  promoPrice: string;
  promoStartsAt: string;
  promoEndsAt: string;
}

export type FormErrors<T> = Partial<Record<keyof T, string>>;

export interface ProductFilters {
  query: string;
  categoryIds: string[];
  brandIds: string[];
  conditions: ProductCondition[];
  minPrice: string;
  maxPrice: string;
  onSaleOnly: boolean;
  inStockOnly: boolean;
  sort: 'relevance' | 'price_asc' | 'price_desc' | 'name' | 'newest';
}
