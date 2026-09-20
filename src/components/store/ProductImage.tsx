import { CategoryIcon } from '@/components/icons';
import { useCatalog } from '@/hooks/useCatalog';
import type { Product } from '@/types';
import { cn } from '@/lib/utils';
import { resolveLocalImageUrl } from '@/utils/localImages';

const GREEN_ICONS = new Set(['gamepad', 'joystick', 'headphones', 'settings', 'cpu', 'speaker', 'watch']);

export interface ProductImageProps {
  product: Product;
  large?: boolean;
  /** Força uma URL específica (usado na galeria). */
  src?: string;
  /** Imagem da primeira dobra: carrega já (as demais carregam sob demanda). */
  priority?: boolean;
}

/**
 * Imagem do produto. Cards usam a MINIATURA (leve); a página do produto usa a imagem grande.
 * O quadro tem proporção fixa (aspect-ratio), então nada "pula" quando a imagem carrega.
 * Sem foto cadastrada: mostra o ícone da categoria (nunca uma foto inventada).
 */
export function ProductImage({ product, large, src, priority }: ProductImageProps): JSX.Element {
  const { categoryById } = useCatalog();
  const icon = categoryById(product.categoryId)?.icon ?? 'zap';
  const fallback = src ?? (large ? product.imageUrl : product.thumbUrl || product.imageUrl);
  const url = resolveLocalImageUrl(product.id, large ? 'main' : 'thumb', fallback);
  const cls = cn('pimg', large && 'pimg--lg', GREEN_ICONS.has(icon) && 'pimg--green');
  if (url) {
    return (
      <div className={cls}>
        <img
          className="pimg__photo"
          src={url}
          alt={product.name}
          width={800}
          height={600}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
        />
        {product.demo ? <span className="pimg__tag">Produto demo</span> : null}
      </div>
    );
  }
  return (
    <div className={cls} role="img" aria-label={`Imagem ilustrativa de ${product.name}`}>
      <span className="pimg__art"><CategoryIcon name={icon} size={96} /></span>
      {product.demo ? <span className="pimg__tag">Produto demo</span> : null}
    </div>
  );
}
