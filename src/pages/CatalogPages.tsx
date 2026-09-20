import { useParams } from 'react-router-dom';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { EmptyState } from '@/components/common/PageState';
import { CategoryGrid } from '@/components/store/CategoryGrid';
import { CatalogView } from '@/components/store/CatalogView';
import { Button } from '@/components/ui/button';
import { useCatalog } from '@/hooks/useCatalog';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { Link, useSearchParams } from 'react-router-dom';
import { NotFoundPage } from './NotFoundPage';

const REUSE_LEAD =
  'Opções para quem busca economia sem abrir mão de equipamentos selecionados. Consulte as condições de garantia de cada produto antes da compra.';

export function ProductsPage(): JSX.Element {
  const [params] = useSearchParams();
  const cond = (params.get('cond') ?? '').split(',').filter(Boolean).sort().join(',');
  const q = params.get('q');
  let title = 'Produtos';
  let lead: string | undefined;
  if (!q) {
    if (cond === 'used') { title = 'Produtos usados'; lead = REUSE_LEAD; }
    else if (cond === 'refurbished') { title = 'Produtos recondicionados'; lead = REUSE_LEAD; }
    else if (cond === 'refurbished,used') { title = 'Usados e recondicionados'; lead = REUSE_LEAD; }
  }
  useDocumentMeta({ title, description: `${title} na Lagoa Eletros, em Lagoa do Carro - PE.` });
  return <CatalogView title={title} lead={lead} crumbs={[{ label: 'Início', to: '/' }, { label: 'Produtos' }]} />;
}

export function CategoryPage(): JSX.Element {
  const { slug = '' } = useParams();
  const { categoryById, status } = useCatalog();
  const cat = categoryById(slug);
  useDocumentMeta({ title: cat?.name, description: cat ? `${cat.name} na Lagoa Eletros: produtos novos, usados e recondicionados em Lagoa do Carro - PE.` : undefined });
  if (status === 'ready' && !cat) return <NotFoundPage />;
  return (
    <CatalogView
      key={slug}
      title={cat?.name ?? 'Categoria'}
      lead={cat?.description || undefined}
      lockCategoryId={slug}
      crumbs={[{ label: 'Início', to: '/' }, { label: 'Categorias', to: '/categories' }, { label: cat?.name ?? '…' }]}
    />
  );
}

export function OffersPage(): JSX.Element {
  useDocumentMeta({ title: 'Ofertas da Lagoa', description: 'Produtos com preço reduzido na Lagoa Eletros, em Lagoa do Carro - PE.' });
  return (
    <CatalogView title="Ofertas da Lagoa" lead="Produtos com preço reduzido." onSaleOnly crumbs={[{ label: 'Início', to: '/' }, { label: 'Ofertas' }]} />
  );
}

export function CategoriesPage(): JSX.Element {
  useDocumentMeta({ title: 'Categorias' });
  const { categories, status } = useCatalog();
  return (
    <>
      <div className="container page-head">
        <Breadcrumbs items={[{ label: 'Início', to: '/' }, { label: 'Categorias' }]} />
        <h1 className="page-title" tabIndex={-1}>Categorias</h1>
        <p className="page-lead">Escolha uma categoria para ver os produtos.</p>
      </div>
      <div className="container section section--tight">
        {status === 'ready' && categories.length === 0 ? (
          <EmptyState title="Nenhuma categoria cadastrada." actions={<Button asChild><Link to="/products">Ver produtos</Link></Button>} />
        ) : (
          <CategoryGrid />
        )}
      </div>
    </>
  );
}
