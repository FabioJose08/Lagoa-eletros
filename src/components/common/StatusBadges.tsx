import { Badge, type BadgeProps } from '@/components/ui/badge';
import type { OrderStatus, PaymentStatus, ProductStatus, StockState } from '@/types';
import { ORDER_STATUS_LABEL, PAYMENT_STATUS_LABEL } from '@/utils/labels';
import { PRODUCT_STATUS_LABEL, STOCK_LABEL } from '@/utils/stock';

/* Sempre texto + cor (a cor sozinha nunca comunica o estado). */
const ORDER_VARIANT: Record<OrderStatus, BadgeProps['variant']> = {
  pending: 'warning', confirmed: 'info', processing: 'info', shipped: 'info', completed: 'success', cancelled: 'danger',
};
const PAYMENT_VARIANT: Record<PaymentStatus, BadgeProps['variant']> = { pending: 'warning', paid: 'success', cancelled: 'danger' };
const STOCK_VARIANT: Record<StockState, BadgeProps['variant']> = { in_stock: 'success', low_stock: 'warning', out_of_stock: 'danger' };
const PRODUCT_VARIANT: Record<ProductStatus, BadgeProps['variant']> = { active: 'success', inactive: 'neutral', out_of_stock: 'danger' };

export const OrderStatusBadge = ({ status }: { status: OrderStatus }): JSX.Element => <Badge variant={ORDER_VARIANT[status]}>{ORDER_STATUS_LABEL[status]}</Badge>;
export const PaymentStatusBadge = ({ status }: { status: PaymentStatus }): JSX.Element => <Badge variant={PAYMENT_VARIANT[status]}>{PAYMENT_STATUS_LABEL[status]}</Badge>;
export const StockBadge = ({ state }: { state: StockState }): JSX.Element => <Badge variant={STOCK_VARIANT[state]}>{STOCK_LABEL[state]}</Badge>;
export const ProductStatusBadge = ({ status }: { status: ProductStatus }): JSX.Element => <Badge variant={PRODUCT_VARIANT[status]}>{PRODUCT_STATUS_LABEL[status]}</Badge>;
