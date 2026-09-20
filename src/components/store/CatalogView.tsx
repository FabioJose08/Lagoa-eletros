import { useMemo, useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { Breadcrumbs, type Crumb } from '@/components/common/Breadcrumbs';
import { Drawer } from '@/components/common/Drawer';
import { EmptyState, LoadingGrid } from '@/components/common/PageState';
import { Icon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { NativeSelect } from '@/components/ui/native-select';
import { useCatalog } from '@/hooks/useCatalog';
import type { Product, ProductFilters as Filters } from '@/types';
import { formatBRL, parseMoney } from '@/utils/format';
import { CONDITION_LABEL } from '@/utils/labels';
import { filterProducts, filtersFromParams, filtersToParams } from '@/utils/search';
import { WA_MESSAGES } from '@/utils/whatsapp';
import { ProductFilters } from './ProductFilters';
import { ProductGrid } from './ProductCard';
import { SearchBar } from './SearchBar';
import { WhatsAppButton } from './WhatsAppButton';

export interface CatalogViewProps {
  title: string;
  lead?: string;
  crumbs: Crumb[];
  /** Página de uma categoria: a categoria fica fixa. */
  lockCategoryId?: string;
  /** Página de ofertas: só produtos com promoção válida agora. */
  onSaleOnly?: boolean;
}

const SORTS: Array<{ value: Filters['sort']; label: string }> = [
  { value: 'relevance', label: 'Relevância' },
  { value: 'price_asc', label: 'Menor preço' },
  { value: 'price_desc', label: 'Maior preço' },
  { value: 'name', label: 'Nome (A a Z)' },
  { value: 'newest', label: 'Mais recentes' },
];

/**
 * Catálogo completo (Produtos, Categoria e Ofertas): busca, filtros, ordenação e chips.
 * Os filtros ficam na URL (?q=iphone&cond=used), então qualquer busca pode ser compartilhada.
 */
export function CatalogView({ title, lead, crumbs, lockCategoryId, onSaleOnly }: CatalogViewProps): JSX.Element {
  const { status, error, products, categories, brands, lookup, categoryById, brandById } = useCatalog();
  const [params, setParams] = useSearchParams();
  const [sheetOpen, setSheetOpen] = useState(false);

  const filters = useMemo<Filters>(() => {
    const f = filtersFromParams(params);
    return { ...f, categoryIds: lockCategoryId ? [lockCategoryId] : f.categoryIds, onSaleOnly: onSaleOnly ? true : f.onSaleOnly };
  }, [params, lockCategoryId, onSaleOnly]);

  const update = (patch: Partial<Filters>): void => setParams(filtersToParams({ ...filters, ...patch }), { replace: true });
  const clearAll = (): void => setParams(filtersToParams({ ...filters, query: '', categoryIds: [], brandIds: [], conditions: [], minPrice: '', maxPrice: '', onSaleOnly: false, inStockOnly: false }), { replace: true });

  const results: Product[] = useMemo(() => filterProducts(products, filters, lookup), [products, filters, lookup]);
  const usedBrands = useMemo(() => brands.filter((b) => products.some((p) => p.brandId === b.id)), [brands, products]);

  const chips: Array<{ key: string; label: string; remove: () => void }> = [];
  if (filters.query) chips.push({ key: 'q', label: `Busca: “${filters.query}”`, remove: () => update({ query: '' }) });
  if (!lockCategoryId) filters.categoryIds.forEach((id) => chips.push({ key: `c-${id}`, label: categoryById(id)?.name ?? id, remove: () => update({ categoryIds: filters.categoryIds.filter((x) => x !== id) }) }));
  filters.brandIds.forEach((id) => chips.push({ key: `b-${id}`, label: brandById(id)?.name ?? id, remove: () => update({ brandIds: filters.brandIds.filter((x) => x !== id) }) }));
  filters.conditions.forEach((c) => chips.push({ key: `k-${c}`, label: CONDITION_LABEL[c], remove: () => update({ conditions: filters.conditions.filter((x) => x !== c) }) }));
  if (filters.minPrice || filters.maxPrice) {
    const a = parseMoney(filters.minPrice);
    const b = parseMoney(filters.maxPrice);
    chips.push({ key: 'price', label: `Preço: ${a !== null ? formatBRL(a) : 'R$ 0'} a ${b !== null ? formatBRL(b) : 'sem limite'}`, remove: () => update({ minPrice: '', maxPrice: '' }) });
  }
  if (filters.onSaleOnly && !onSaleOnly) chips.push({ key: 'sale', label: 'Em promoção', remove: () => update({ onSaleOnly: false }) });
  if (filters.inStockOnly) chips.push({ key: 'stock', label: 'Com estoque', remove: () => update({ inStockOnly: false }) });

  const activeGroups =
    (lockCategoryId ? 0 : filters.categoryIds.length ? 1 : 0) + (filters.brandIds.length ? 1 : 0) + (filters.conditions.length ? 1 : 0) +
    (filters.minPrice || filters.maxPrice ? 1 : 0) + (filters.inStockOnly ? 1 : 0) + (filters.onSaleOnly && !onSaleOnly ? 1 : 0);

  const filterForm = (prefix: string): JSX.Element => (
    <ProductFilters prefix={prefix} filters={filters} onChange={update} categories={categories} brands={usedBrands} hideCategories={Boolean(lockCategoryId)} hideOnSale={onSaleOnly} />
  );

  return (
    <>
      <div className="container page-head">
        <Breadcrumbs items={crumbs} />
        <h1 className="page-title" tabIndex={-1}>{title}</h1>
        {lead ? <p className="page-lead">{lead}</p> : null}
      </div>
      <div className="container catalog">
        <aside className="catalog__filters" aria-label="Filtros">
          <div className="filters-panel">
            <div className="filters-panel__head">
              <h2 className="filters-panel__title">Filtros</h2>
              <Button variant="ghost" onClick={clearAll}>Limpar</Button>
            </div>
            {filterForm('fd')}
          </div>
        </aside>
        <section className="catalog__main" aria-label="Lista de produtos">
          <div className="toolbar">
            <div className="toolbar__search">
              <SearchBar id="cs" variant="page" placeholder="Buscar nesta lista" live={{ value: filters.query, onChange: (v) => update({ query: v }) }} />
            </div>
            <Button variant="outline" className="toolbar__filter-btn" onClick={() => setSheetOpen(true)} aria-haspopup="dialog">
              <Icon as={SlidersHorizontal} size={18} /><span>Filtros</span>{activeGroups ? <span>({activeGroups})</span> : null}
            </Button>
            <label className="toolbar__sort">
              <span>Ordenar</span>
              <NativeSelect className="select" value={filters.sort} onChange={(e) => update({ sort: e.target.value as Filters['sort'] })}>
                {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </NativeSelect>
            </label>
          </div>
          <div className="results-meta">
            <p className="results-status" role="status">
              {status === 'ready' ? `${results.length} ${results.length === 1 ? 'produto encontrado' : 'produtos encontrados'}` : ''}
            </p>
            <div className="chips" aria-label="Filtros ativos">
              {chips.map((c) => (
                <button type="button" className="chip" key={c.key} onClick={c.remove} aria-label={`Remover filtro: ${c.label}`}>
                  {c.label}<Icon as={X} size={16} />
                </button>
              ))}
              {chips.length > 1 ? <button type="button" className="chip chip--clear" onClick={clearAll}>Limpar tudo</button> : null}
            </div>
          </div>

          {status === 'loading' ? <LoadingGrid count={8} /> : null}
          {status === 'error' ? (
            <EmptyState error title="Não foi possível carregar os produtos." text={error ?? 'Verifique sua conexão e tente de novo.'}
              actions={<Button onClick={() => window.location.reload()}>Tentar de novo</Button>} />
          ) : null}
          {status === 'ready' && results.length === 0 ? (
            <EmptyState
              title="Nenhum produto encontrado."
              text={products.length === 0 ? 'Ainda não há produtos cadastrados na loja.' : 'Experimente buscar por outro nome ou categoria.'}
              actions={
                <>
                  {chips.length > 0 ? <Button variant="outline" onClick={clearAll}>Limpar filtros</Button> : null}
                  <WhatsAppButton message={WA_MESSAGES.generic} label="Perguntar no WhatsApp" />
                </>
              }
            />
          ) : null}
          {status === 'ready' && results.length > 0 ? <div className="fade-in"><ProductGrid products={results} className="product-grid--cols3" /></div> : null}
        </section>
      </div>

      <Drawer open={sheetOpen} onClose={() => setSheetOpen(false)} variant="sheet" label="Filtros">
        <div className="drawer__head">
          <h2 className="drawer__title">Filtros</h2>
          <button type="button" className="icon-btn" onClick={() => setSheetOpen(false)} aria-label="Fechar filtros"><Icon as={X} size={24} /></button>
        </div>
        <div className="drawer__body">{filterForm('fm')}</div>
        <div className="drawer__foot">
          <Button variant="outline" onClick={clearAll}>Limpar</Button>
          <Button onClick={() => setSheetOpen(false)}>
            {results.length ? `Ver ${results.length} ${results.length === 1 ? 'produto' : 'produtos'}` : 'Nenhum produto'}
          </Button>
        </div>
      </Drawer>
    </>
  );
}
