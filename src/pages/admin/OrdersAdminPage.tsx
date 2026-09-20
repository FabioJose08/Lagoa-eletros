import { useEffect, useMemo, useState } from 'react';
import { Eye } from 'lucide-react';
import { AdminPageHead } from '@/components/admin/AdminPageHead';
import { FormAlert, FormField } from '@/components/common/FormField';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { EmptyState } from '@/components/common/PageState';
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/common/StatusBadges';
import { Icon, WhatsAppIcon } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { NativeSelect } from '@/components/ui/native-select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/components/ui/sonner';
import { firebaseErrorMessage } from '@/firebase/firestore';
import { useSubscription } from '@/hooks/useSubscription';
import { subscribeAllOrders, updateOrderStatus } from '@/services/orderService';
import type { Order, OrderStatus, PaymentStatus } from '@/types';
import { formatBRL, formatDateTime, formatOrderCode, onlyDigits } from '@/utils/format';
import { ORDER_STATUSES, ORDER_STATUS_LABEL, PAYMENT_METHOD_LABEL, PAYMENT_STATUSES, PAYMENT_STATUS_LABEL } from '@/utils/labels';
import { InsufficientStockError } from '@/utils/stock';
import { waLinkTo } from '@/utils/whatsapp';

const STOCK_NOTE: Record<OrderStatus, string> = {
  pending: 'Pendente: nenhum estoque reservado.',
  confirmed: 'Confirmado: o estoque dos itens é RESERVADO.',
  processing: 'Em preparo: o estoque continua reservado.',
  shipped: 'Enviado: o estoque continua reservado.',
  completed: 'Concluído: o estoque é BAIXADO (sai do estoque).',
  cancelled: 'Cancelado: o estoque reservado (ou baixado) é DEVOLVIDO.',
};

function OrderDialog({ order, onClose }: { order: Order | null; onClose: () => void }): JSX.Element {
  const [orderStatus, setOrderStatus] = useState<OrderStatus>('pending');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('pending');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (order) { setOrderStatus(order.orderStatus); setPaymentStatus(order.paymentStatus); setError(null); }
  }, [order]);

  const save = async (): Promise<void> => {
    if (!order) return;
    setBusy(true);
    setError(null);
    try {
      await updateOrderStatus(order.id, { orderStatus, paymentStatus });
      toast.success(`Pedido ${formatOrderCode(order.id)} atualizado.`);
      onClose();
    } catch (e) {
      setError(e instanceof InsufficientStockError ? `${e.message} O status não foi alterado.` : firebaseErrorMessage(e, 'Não foi possível atualizar o pedido.'));
    } finally { setBusy(false); }
  };

  const hasPhone = order ? onlyDigits(order.customer.phone).length >= 10 : false;
  return (
    <Dialog
      open={order !== null}
      onOpenChange={(v) => { if (!v) onClose(); }}
      title={order ? `Pedido ${formatOrderCode(order.id)}` : 'Pedido'}
      description={order ? `Feito em ${formatDateTime(order.createdAt)}` : undefined}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>Fechar</Button>
          <Button onClick={() => void save()} loading={busy}>Salvar status</Button>
        </>
      }
    >
      {order ? (
        <div className="order-detail">
          {error ? <FormAlert>{error}</FormAlert> : null}
          <div>
            <h3 className="ui-card__title">Cliente</h3>
            <p>{order.customer.name || '—'} · {order.customer.email || '—'}</p>
            <p className="data-table__muted">{order.customer.phone || 'Sem telefone cadastrado'}</p>
            {order && hasPhone ? (
              <a className="btn btn--whatsapp btn--sm" style={{ marginTop: 8 }} href={waLinkTo(order.customer.phone)} target="_blank" rel="noopener noreferrer"><WhatsAppIcon size={16} />Chamar cliente</a>
            ) : null}
          </div>
          <div>
            <h3 className="ui-card__title">Itens</h3>
            <div className="order-detail__items">
              {order.items.map((i) => (
                <div className="order-detail__item" key={i.productId}>
                  <span className="thumb">{i.imageUrl ? <img src={i.imageUrl} alt="" width={48} height={48} /> : null}</span>
                  <span><strong>{i.name}</strong><br /><span className="data-table__muted">{i.quantity} × {formatBRL(i.price)} {i.sku ? `· SKU ${i.sku}` : ''}</span></span>
                  <strong>{formatBRL(i.price * i.quantity)}</strong>
                </div>
              ))}
            </div>
          </div>
          <div className="summary">
            <div className="summary__row summary__row--muted"><span>Subtotal</span><span>{formatBRL(order.subtotal)}</span></div>
            <div className="summary__row summary__row--muted"><span>Desconto</span><span>- {formatBRL(order.discount)}</span></div>
            <div className="summary__row summary__row--muted"><span>Frete</span><span>{order.shipping ? formatBRL(order.shipping) : 'A combinar'}</span></div>
            <div className="summary__row summary__total"><span>Total</span><span>{formatBRL(order.total)}</span></div>
            <p className="data-table__muted">Pagamento: {PAYMENT_METHOD_LABEL[order.paymentMethod]}</p>
            {order.notes ? <p className="data-table__muted">Observações do cliente: {order.notes}</p> : null}
          </div>
          <div className="form-grid form-grid--2">
            <FormField id="od-status" label="Status do pedido">
              <NativeSelect id="od-status" value={orderStatus} onChange={(e) => setOrderStatus(e.target.value as OrderStatus)}>
                {ORDER_STATUSES.map((s) => <option key={s} value={s}>{ORDER_STATUS_LABEL[s]}</option>)}
              </NativeSelect>
            </FormField>
            <FormField id="od-payment" label="Status do pagamento">
              <NativeSelect id="od-payment" value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}>
                {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{PAYMENT_STATUS_LABEL[s]}</option>)}
              </NativeSelect>
            </FormField>
            <p className="form-hint form-span">{STOCK_NOTE[orderStatus]}</p>
          </div>
        </div>
      ) : null}
    </Dialog>
  );
}

export function OrdersAdminPage(): JSX.Element {
  const { data: orders, loading, error } = useSubscription<Order[]>(subscribeAllOrders, []);
  const [filter, setFilter] = useState<'all' | OrderStatus>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const rows = useMemo(() => orders.filter((o) => filter === 'all' || o.orderStatus === filter), [orders, filter]);
  const selected = orders.find((o) => o.id === selectedId) ?? null;

  return (
    <>
      <AdminPageHead title="Pedidos" lead="Veja os pedidos dos clientes e altere o status. O estoque acompanha o status do pedido." />
      <div className="admin-toolbar">
        <NativeSelect aria-label="Filtrar por status" value={filter} onChange={(e) => setFilter(e.target.value as 'all' | OrderStatus)}>
          <option value="all">Todos os status</option>
          {ORDER_STATUSES.map((s) => <option key={s} value={s}>{ORDER_STATUS_LABEL[s]}</option>)}
        </NativeSelect>
      </div>
      {error ? <FormAlert>{error}</FormAlert> : null}
      {loading ? <LoadingScreen label="Carregando pedidos…" /> : null}
      {!loading && !error && orders.length === 0 ? <EmptyState title="Nenhum pedido ainda." text="Quando um cliente finalizar uma compra, o pedido aparece aqui." /> : null}
      {!loading && rows.length > 0 ? (
        <Table aria-label="Lista de pedidos">
          <TableHeader>
            <TableRow>
              <TableHead>Pedido</TableHead><TableHead>Cliente</TableHead><TableHead>Data</TableHead><TableHead className="data-table__num">Itens</TableHead>
              <TableHead className="data-table__num">Total</TableHead><TableHead>Status</TableHead><TableHead>Pagamento</TableHead><TableHead><span className="sr-only">Ações</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((o) => (
              <TableRow key={o.id}>
                <TableCell><span className="data-table__strong">{formatOrderCode(o.id)}</span>{o.demo ? <> <Badge variant="neutral">DEMO</Badge></> : null}</TableCell>
                <TableCell>{o.customer.name || '—'}<div className="data-table__muted">{o.customer.email}</div></TableCell>
                <TableCell>{formatDateTime(o.createdAt)}</TableCell>
                <TableCell className="data-table__num">{o.items.reduce((s, i) => s + i.quantity, 0)}</TableCell>
                <TableCell className="data-table__num data-table__strong">{formatBRL(o.total)}</TableCell>
                <TableCell><OrderStatusBadge status={o.orderStatus} /></TableCell>
                <TableCell><PaymentStatusBadge status={o.paymentStatus} /></TableCell>
                <TableCell><div className="data-table__actions"><Button variant="outline" size="sm" onClick={() => setSelectedId(o.id)} aria-label={`Ver pedido ${formatOrderCode(o.id)}`}><Icon as={Eye} size={16} />Ver</Button></div></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : null}
      <OrderDialog order={selected} onClose={() => setSelectedId(null)} />
    </>
  );
}
