import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useCatalog } from '@/hooks/useCatalog';
import type { Product } from '@/types';
import { isPurchasable } from '@/utils/stock';
import { WA_MESSAGES } from '@/utils/whatsapp';
import { FavoriteButton } from './FavoriteButton';
import { PriceDisplay } from './PriceDisplay';
import { ProductBadges } from './ProductBadges';
import { ProductImage } from './ProductImage';
import { WhatsAppButton } from './WhatsAppButton';

export function ProductCard({ product, priority }: { product: Product; priority?: boolean }): JSX.Element {
  const { categoryById } = useCatalog();
  const purchasable = isPurchasable(product);
  const to = `/products/${product.slug}`;
  return (
    <article className="pcard">
      <div className="pcard__media">
        <ProductImage product={product} priority={priority} />
        <FavoriteButton product={product} className="pcard__fav" />
      </div>
      <div className="pcard__body">
        <ProductBadges product={product} />
        <p className="pcard__cat">{categoryById(product.categoryId)?.name ?? ''}</p>
        <h3 className="pcard__name"><Link className="pcard__link" to={to}>{product.name}</Link></h3>
        <PriceDisplay product={product} />
      </div>
      <div className="pcard__actions">
        <WhatsAppButton
          message={purchasable ? WA_MESSAGES.interest(product.name, product.demo) : WA_MESSAGES.availability(product.name, product.demo)}
          label={purchasable ? 'Tenho interesse' : 'Consultar disponibilidade'}
          ariaLabel={`${purchasable ? 'Tenho interesse em' : 'Consultar disponibilidade de'} ${product.name}, abre o WhatsApp`}
        />
        <Button asChild variant="outline">
          <Link to={to} aria-label={`Ver detalhes de ${product.name}`}>Detalhes</Link>
        </Button>
      </div>
    </article>
  );
}

export function ProductGrid({ products, className = '' }: { products: Product[]; className?: string }): JSX.Element {
  return (
    <div className={`product-grid ${className}`}>
      {products.map((p) => <ProductCard key={p.id} product={p} />)}
    </div>
  );
}
