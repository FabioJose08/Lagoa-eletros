import { Package, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CategoryIcon, Icon } from '@/components/icons';
import { useCatalog } from '@/hooks/useCatalog';
import type { Category } from '@/types';

function CategoryCard({ category }: { category: Category }): JSX.Element {
  return (
    <Link className="cat-card" to={`/categories/${category.slug}`}>
      <span className="cat-card__icon">
        {category.imageUrl ? <img src={category.imageUrl} alt="" loading="lazy" width={52} height={52} /> : <CategoryIcon name={category.icon} size={26} />}
      </span>
      <span className="cat-card__label">{category.name}</span>
    </Link>
  );
}

/** Categorias (vindas do Firestore) + atalhos para Usados e Recondicionados. */
export function CategoryGrid(): JSX.Element {
  const { categories } = useCatalog();
  return (
    <div className="cat-grid">
      {categories.map((c) => <CategoryCard key={c.id} category={c} />)}
      <Link className="cat-card cat-card--cond" to="/products?cond=used">
        <span className="cat-card__icon"><Icon as={Package} size={26} /></span>
        <span className="cat-card__label">Produtos usados</span>
      </Link>
      <Link className="cat-card cat-card--cond" to="/products?cond=refurbished">
        <span className="cat-card__icon"><Icon as={RefreshCw} size={26} /></span>
        <span className="cat-card__label">Produtos recondicionados</span>
      </Link>
    </div>
  );
}
