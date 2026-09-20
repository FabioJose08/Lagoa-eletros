import { useState } from 'react';
import { Boxes, CircleCheck, ClipboardList, Clock, PackageX, Percent, ShoppingBag, TriangleAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AdminPageHead } from '@/components/admin/AdminPageHead';
import { StatCard } from '@/components/admin/StatCard';
import { FormAlert } from '@/components/common/FormField';
import { OrderStatusBadge, StockBadge } from '@/components/common/StatusBadges';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/dialog';
import { toast } from '@/components/ui/sonner';
import { firebaseErrorMessage } from '@/firebase/firestore';
import { useSubscription } from '@/hooks/useSubscription';
import { subscribeAllOrders } from '@/services/orderService';
import { subscribeAllProducts } from '@/services/productService';
import { removeDemoData, seedDemoData } from '@/services/seedService';
import type { Order, Product } from '@/types';
import { formatBRL, formatDateTime, formatOrderCode } from '@/utils/format';
import { getPriceInfo } from '@/utils/pricing';
import { getStockState } from '@/utils/stock';

/** Todos os números vêm do Firestore (nada inventado). */
export function DashboardPage(): JSX.Element {
  const { data: products, error: pErr } = useSubscription<Product[]>(subscribeAllProducts, []);
  const { data: orders, error: oErr } = useSubscription<Order[]>(subscribeAllOrders, []);
  const [busy, setBusy] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const now = new Date();
  const active = products.filter((p) => p.active);
  const lowStock = products.filter((p) => p.active && getStockState(p) !== 'in_stock').sort((a, b) => a.availableStock - b.availableStock);
  const hasDemo = products.some((p) => p.demo) || orders.some((o) => o.demo);
  const errorMsg = pErr ?? oErr;

  const seed = async (): Promise<void> => {
    setBusy(true);
    try { await seedDemoData(); toast.success('Dados DEMO carregados. Veja a loja!'); } catch (e) { toast.error(firebaseErrorMessage(e)); } finally { setBusy(false); }
  };
  const removeDemo = async (): Promise<void> => {
    setBusy(true);
    try { await removeDemoData(); toast.success('Dados DEMO removidos.'); } catch (e) { toast.error(firebaseErrorMessage(e)); } finally { setBusy(false); setConfirmRemove(false); }
  };

  return (
    <>
      <AdminPageHead title="Dashboard" lead="Visão geral da loja." actions={<Button asChild><Link to="/admin/products/new">Novo produto</Link></Button>} />
      {errorMsg ? <div style={{ marginBottom: 16 }}><FormAlert>{errorMsg}</FormAlert></div> : null}

      {products.length === 0 || hasDemo ? (
        <div className="admin-demo">
          <p>{products.length === 0
            ? <><strong>Sua loja ainda está vazia.</strong> Cadastre seus produtos ou carregue dados de demonstração (claramente marcados como DEMO) para testar o site.</>
            : <><strong>Há dados DEMO na loja.</strong> Quando terminar os testes, remova-os. Seus produtos reais não são afetados.</>}</p>
          {products.length === 0 ? <Button loading={busy} onClick={() => void seed()}>Carregar dados DEMO</Button> : <Button variant="outline" onClick={() => setConfirmRemove(true)}>Remover dados DEMO</Button>}
        </div>
      ) : null}

      <div className="stat-grid">
        <StatCard label="Total de produtos" value={products.length} icon={Boxes} />
        <StatCard label="Produtos ativos" value={active.length} icon={CircleCheck} />
        <StatCard label="Sem estoque" value={products.filter((p) => p.active && p.availableStock <= 0).length} icon={PackageX} alert={products.some((p) => p.active && p.availableStock <= 0)} />
        <StatCard label="Em promoção" value={products.filter((p) => p.active && getPriceInfo(p, now).isPromo).length} icon={Percent} />
        <StatCard label="Total de pedidos" value={orders.length} icon={ClipboardList} />
        <StatCard label="Pedidos pendentes" value={orders.filter((o) => o.orderStatus === 'pending').length} icon={Clock} hint="Aguardando confirmação" />
        <StatCard label="Pedidos concluídos" value={orders.filter((o) => o.orderStatus === 'completed').length} icon={ShoppingBag} />
        <StatCard label="Estoque baixo" value={lowStock.filter((p) => p.availableStock > 0).length} icon={TriangleAlert} />
      </div>

      <div className="dash-grid">
        <Card>
          <CardHeader><CardTitle>Pedidos recentes</CardTitle><CardDescription>Os 5 mais novos.</CardDescription></CardHeader>
          <CardContent>
            {orders.length === 0 ? <p className="form-hint">Nenhum pedido ainda.</p> : (
              <div className="activity">
                {orders.slice(0, 5).map((o) => (
                  <div className="activity__row" key={o.id}>
                    <div><Link to="/admin/orders">{formatOrderCode(o.id)} · {o.customer.name || 'Cliente'}</Link><div className="activity__meta">{formatDateTime(o.createdAt)} · {formatBRL(o.total)}</div></div>
                    <OrderStatusBadge status={o.orderStatus} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Atenção ao estoque</CardTitle><CardDescription>Produtos ativos com pouco ou nenhum estoque.</CardDescription></CardHeader>
          <CardContent>
            {lowStock.length === 0 ? <p className="form-hint">Nenhum produto com estoque baixo.</p> : (
              <div className="activity">
                {lowStock.slice(0, 6).map((p) => (
                  <div className="activity__row" key={p.id}>
                    <div><Link to={`/admin/products/${p.id}/edit`}>{p.name}</Link><div className="activity__meta">{p.availableStock} disponível(is)</div></div>
                    <StockBadge state={getStockState(p)} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <ConfirmDialog open={confirmRemove} onOpenChange={setConfirmRemove} title="Remover dados DEMO?" description="Todos os produtos, categorias, marcas, promoções e pedidos marcados como DEMO serão apagados. Dados reais não são afetados." confirmLabel="Remover dados DEMO" destructive loading={busy} onConfirm={() => void removeDemo()} />
    </>
  );
}
