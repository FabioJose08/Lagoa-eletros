import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { EmptyState, LoadingGrid } from '@/components/common/PageState';
import { ProductGrid } from '@/components/store/ProductCard';
import { Button } from '@/components/ui/button';
import { useCatalog } from '@/hooks/useCatalog';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { useFavorites } from '@/hooks/useFavorites';

export function FavoritesPage(): JSX.Element {
  useDocumentMeta({ title: 'Favoritos', noindex: true });
  const { products, status } = useCatalog();
  const { ids } = useFavorites();
  const list = products.filter((p) => ids.includes(p.id));
  return (
    <>
      <div className="container page-head">
        <Breadcrumbs items={[{ label: 'Início', to: '/' }, { label: 'Favoritos' }]} />
        <h1 className="page-title" tabIndex={-1}>Favoritos</h1>
        <p className="page-lead">Produtos que você salvou neste aparelho.</p>
      </div>
      <div className="container section section--tight">
        {status === 'loading' ? <LoadingGrid count={4} /> : list.length ? <ProductGrid products={list} /> : (
          <EmptyState icon={Heart} title="Você ainda não tem favoritos." text="Toque no coração de um produto para salvá-lo aqui."
            actions={<Button asChild><Link to="/products">Ver produtos</Link></Button>} />
        )}
      </div>
    </>
  );
}
