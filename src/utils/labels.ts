import type { OrderStatus, PaymentMethod, PaymentStatus, ProductCondition, UserRole } from '@/types';

export const CONDITION_LABEL: Record<ProductCondition, string> = {
  new: 'Novo',
  used: 'Usado',
  refurbished: 'Recondicionado',
};

/** Texto padrão sobre a condição. Não promete garantia nem estado que a loja não informou. */
export const CONDITION_TEXT: Record<ProductCondition, string> = {
  new: 'Produto novo.',
  used: 'Produto usado. A loja informa o estado do item (marcas de uso, acessórios inclusos) em cada anúncio.',
  refurbished: 'Produto recondicionado. O que foi feito no equipamento é informado pela loja em cada anúncio.',
};

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Pendente',
  confirmed: 'Confirmado',
  processing: 'Em preparo',
  shipped: 'Enviado',
  completed: 'Concluído',
  cancelled: 'Cancelado',
};
export const ORDER_STATUSES: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'completed', 'cancelled'];

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  pending: 'Pagamento pendente',
  paid: 'Pago',
  cancelled: 'Cancelado',
};
export const PAYMENT_STATUSES: PaymentStatus[] = ['pending', 'paid', 'cancelled'];

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  arrange_whatsapp: 'Combinar pelo WhatsApp',
  pay_on_pickup: 'Pagar na retirada',
  pix: 'Pix',
  card: 'Cartão',
  mercado_pago: 'Mercado Pago',
  stripe: 'Stripe',
};

export const ROLE_LABEL: Record<UserRole, string> = { customer: 'Cliente', admin: 'Administrador' };
