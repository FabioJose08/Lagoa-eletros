import { useState } from 'react';
import { ClipboardList } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { FormAlert } from '@/components/common/FormField';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { EmptyState } from '@/components/common/PageState';
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/common/StatusBadges';
import { WhatsAppButton } from '@/components/store/WhatsAppButton';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/dialog';
import { toast } from '@/components/ui/sonner';
import { firebaseErrorMessage } from '@/firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { useSubscription } from '@/hooks/useSubscription';
import { cancelOwnOrder, subscribeUserOrders } from '@/services/orderService';
import type { Order } from '@/types';
import { formatBRL, formatDateTime, formatOrderCode } from '@/utils/format';
import { PAYMENT_METHOD_LABEL } from '@/utils/labels';
import { WA_MESSAGES } from '@/utils/whatsapp';

export function OrdersPage(): JSX.Element {
  useDocumentMeta({ title: 'Meus pedidos', noindex: true });
  const { user } = useAuth();
  const uid = user?.uid ?? '';
  const { data: orders, loading, error } = useSubscription<Order[]>((cb, onErr) => subscribeUserOrders(uid, cb, onErr), [], [uid]);
  const [toCancel, setToCancel] = useState<Order | null>(null);
  const [busy, setBusy] = useState(false);

  const confirmCancel = async (): Promise<void> => {
    if (!toCancel) return;
    setBusy(true);
    try { await cancelOwnOrder(toCancel); toast.success(`Pedido ${formatOrderCode(toCancel.id)} cancelado.`); setToCancel(null); }
    catch (e) { toast.error(firebaseErrorMessage(e, 'Não foi possível cancelar o pedido.')); } finally { setBusy(false); }
  };

  return (
    <>
      <div className="container page-head">
        <Breadcrumbs items={[{ label: 'Início', to: '/' }, { label: 'Minha conta', to: '/account' }, { label: 'Pedidos' }]} />
        <h1 className="page-title" tabIndex={-1}>Meus pedidos</h1>
        <p className="page-lead">Acompanhe o status de cada pedido.</p>
      </div>
      <div className="container section section--tight">
        {loading ? <LoadingScreen label="Carregando pedidos…" /> : null}
        {error ? <FormAlert>{error}</FormAlert> : null}
        {!loading && !error && orders.length === 0 ? (
          <EmptyState icon={ClipboardList} title="Você ainda não fez nenhum pedido." actions={<Button asChild><Link to="/products">Ver produtos</Link></Button>} />
        ) : null}
        <div className="order-list">
          {orders.map((o) => (
            <article className="order-card" key={o.id} aria-label={`Pedido ${formatOrderCode(o.id)}`}>
              <div className="order-card__head">
                <div>
                  <p className="order-card__code">Pedido {formatOrderCode(o.id)}</p>
                  <p className="ui-card__desc">{formatDateTime(o.createdAt)} · {PAYMENT_METHOD_LABEL[o.paymentMethod]}</p>
                </div>
                <div className="badges"><OrderStatusBadge status={o.orderStatus} /><PaymentStatusBadge status={o.paymentStatus} /></div>
              </div>
              <ul className="order-card__items">
                {o.items.map((i) => <li className="order-card__item" key={i.productId}><span>{i.quantity} × {i.name}</span><span>{formatBRL(i.price * i.quantity)}</span></li>)}
              </ul>
              <div className="order-card__foot">
                <strong>Total: {formatBRL(o.total)}</strong>
                <div className="admin-actions">
                  <WhatsAppButton message={WA_MESSAGES.order(formatOrderCode(o.id), formatBRL(o.total))} label="Falar sobre este pedido" />
                  {o.orderStatus === 'pending' ? <Button variant="outline" onClick={() => setToCancel(o)}>Cancelar pedido</Button> : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
      <ConfirmDialog open={toCancel !== null} onOpenChange={(v) => { if (!v) setToCancel(null); }} title="Cancelar este pedido?"
        description="O pedido será cancelado e o estoque não será reservado. Você pode fazer um novo pedido quando quiser."
        confirmLabel="Cancelar pedido" cancelLabel="Voltar" destructive loading={busy} onConfirm={() => void confirmCancel()} />
    </>
  );
}
