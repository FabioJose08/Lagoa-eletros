import { useMemo, useState } from 'react';
import { Copy, ImageOff, Pencil, Plus, Power, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { AdminPageHead } from '@/components/admin/AdminPageHead';
import { FormAlert } from '@/components/common/FormField';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { EmptyState } from '@/components/common/PageState';
import { ProductStatusBadge, StockBadge } from '@/components/common/StatusBadges';
import { Icon } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/components/ui/sonner';
import { firebaseErrorMessage } from '@/firebase/firestore';
import { useSubscription } from '@/hooks/useSubscription';
import { subscribeAllBrands } from '@/services/brandService';
import { subscribeAllCategories } from '@/services/categoryService';
import { deleteProduct, duplicateProduct, setProductActive, subscribeAllProducts } from '@/services/productService';
import type { Brand, Category, Product, ProductStatus } from '@/types';
import { formatBRL } from '@/utils/format';
import { CONDITION_LABEL } from '@/utils/labels';
import { getPriceInfo } from '@/utils/pricing';
import { normalizeText } from '@/utils/search';
import { getProductStatus, getStockState } from '@/utils/stock';

export function ProductsAdminPage(): JSX.Element {
  const navigate = useNavigate();
  const { data: products, loading, error } = useSubscription<Product[]>(subscribeAllProducts, []);
  const { data: categories } = useSubscription<Category[]>(subscribeAllCategories, []);
  const { data: brands } = useSubscription<Brand[]>(subscribeAllBrands, []);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'all' | ProductStatus>('all');
  const [categoryId, setCategoryId] = useState('');
  const [toDelete, setToDelete] = useState<Product | null>(null);
  const [busy, setBusy] = useState(false);

  const catName = (id: string): string => categories.find((c) => c.id === id)?.name ?? '—';
  const brandName = (id: string | null): string => brands.find((b) => b.id === id)?.name ?? '—';

  const rows = useMemo(() => {
    const nq = normalizeText(q);
    return products
      .filter((p) => (status === 'all' ? true : getProductStatus(p) === status))
      .filter((p) => (categoryId ? p.categoryId === categoryId : true))
      .filter((p) => !nq || normalizeText(`${p.name} ${p.sku}`).includes(nq))
      .sort((a, b) => (b.updatedAt?.getTime() ?? Date.now()) - (a.updatedAt?.getTime() ?? Date.now()));
  }, [products, q, status, categoryId]);

  const run = async (fn: () => Promise<unknown>, ok: string): Promise<void> => {
    try { await fn(); toast.success(ok); } catch (e) { toast.error(firebaseErrorMessage(e)); }
  };

  const confirmDelete = async (): Promise<void> => {
    if (!toDelete) return;
    setBusy(true);
    await run(() => deleteProduct(toDelete), `“${toDelete.name}” foi excluído.`);
    setBusy(false);
    setToDelete(null);
  };

  return (
    <>
      <AdminPageHead
        title="Produtos"
        lead="Tudo o que você cadastra aqui aparece na loja (quando o produto está ativo)."
        actions={<Button asChild><Link to="/admin/products/new"><Icon as={Plus} size={18} />Novo produto</Link></Button>}
      />
      <div className="admin-toolbar">
        <Input aria-label="Buscar por nome ou SKU" type="search" placeholder="Buscar por nome ou SKU" value={q} onChange={(e) => setQ(e.target.value)} />
        <NativeSelect aria-label="Filtrar por status" value={status} onChange={(e) => setStatus(e.target.value as 'all' | ProductStatus)}>
          <option value="all">Todos os status</option>
          <option value="active">Ativos</option>
          <option value="inactive">Inativos</option>
          <option value="out_of_stock">Sem estoque</option>
        </NativeSelect>
        <NativeSelect aria-label="Filtrar por categoria" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">Todas as categorias</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </NativeSelect>
      </div>

      {error ? <FormAlert>{error}</FormAlert> : null}
      {loading ? <LoadingScreen label="Carregando produtos…" /> : null}
      {!loading && !error && products.length === 0 ? (
        <EmptyState title="Nenhum produto cadastrado." text="Cadastre o primeiro produto ou carregue os dados de demonstração no Dashboard."
          actions={<Button asChild><Link to="/admin/products/new">Cadastrar produto</Link></Button>} />
      ) : null}
      {!loading && products.length > 0 ? (
        <Table aria-label="Lista de produtos">
          <TableHeader>
            <TableRow>
              <TableHead>Imagem</TableHead><TableHead>Produto</TableHead><TableHead>Categoria</TableHead><TableHead>Marca</TableHead>
              <TableHead className="data-table__num">Preço</TableHead><TableHead>Estoque</TableHead><TableHead>Condição</TableHead>
              <TableHead>Status</TableHead><TableHead>Promoção</TableHead><TableHead><span className="sr-only">Ações</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((p) => {
              const price = getPriceInfo(p);
              return (
                <TableRow key={p.id}>
                  <TableCell>
                    <span className="thumb">{p.thumbUrl || p.imageUrl ? <img src={p.thumbUrl || p.imageUrl} alt="" width={48} height={48} loading="lazy" /> : <Icon as={ImageOff} size={20} />}</span>
                  </TableCell>
                  <TableCell>
                    <div className="cell-product__name">{p.name}</div>
                    <div className="data-table__muted">SKU {p.sku || '—'}{p.demo ? ' · DEMO' : ''}</div>
                  </TableCell>
                  <TableCell>{catName(p.categoryId)}</TableCell>
                  <TableCell>{brandName(p.brandId)}</TableCell>
                  <TableCell className="data-table__num">
                    <span className="data-table__strong">{formatBRL(price.current)}</span>
                    {price.previous !== null ? <div className="data-table__muted"><s>{formatBRL(price.previous)}</s></div> : null}
                  </TableCell>
                  <TableCell>
                    <div>{p.availableStock} de {p.stock}</div>
                    <StockBadge state={getStockState(p)} />
                  </TableCell>
                  <TableCell>{CONDITION_LABEL[p.condition]}</TableCell>
                  <TableCell><ProductStatusBadge status={getProductStatus(p)} /></TableCell>
                  <TableCell>{price.isPromo ? <Badge variant="oferta">-{price.discountPercent}%</Badge> : p.onSale ? <Badge variant="neutral">Agendada</Badge> : '—'}</TableCell>
                  <TableCell>
                    <div className="data-table__actions">
                      <Button variant="ghost" size="icon" aria-label={`Editar ${p.name}`} onClick={() => navigate(`/admin/products/${p.id}/edit`)}><Icon as={Pencil} size={18} /></Button>
                      <Button variant="ghost" size="icon" aria-label={`Duplicar ${p.name}`} onClick={() => void run(() => duplicateProduct(p), 'Cópia criada (inativa, sem imagens).')}><Icon as={Copy} size={18} /></Button>
                      <Button variant="ghost" size="icon" aria-label={p.active ? `Desativar ${p.name}` : `Ativar ${p.name}`} aria-pressed={p.active} onClick={() => void run(() => setProductActive(p.id, !p.active), p.active ? 'Produto desativado.' : 'Produto ativado.')}><Icon as={Power} size={18} /></Button>
                      <Button variant="ghost" size="icon" aria-label={`Excluir ${p.name}`} onClick={() => setToDelete(p)}><Icon as={Trash2} size={18} /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      ) : null}
      {!loading && products.length > 0 && rows.length === 0 ? <p className="form-hint" style={{ marginTop: 12 }}>Nenhum produto com esses filtros.</p> : null}

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(v) => { if (!v) setToDelete(null); }}
        title="Excluir produto?"
        description={`“${toDelete?.name ?? ''}” será excluído da loja e suas imagens serão apagadas. Esta ação não pode ser desfeita. Se preferir só esconder, use "Desativar".`}
        confirmLabel="Excluir" destructive loading={busy} onConfirm={() => void confirmDelete()}
      />
    </>
  );
}
