import { Package, RefreshCw, Sparkles, Tag, type LucideIcon } from 'lucide-react';
import { Icon } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import type { Product, ProductCondition } from '@/types';
import { CONDITION_LABEL } from '@/utils/labels';
import { getPriceInfo } from '@/utils/pricing';

const CONDITION_BADGE: Record<ProductCondition, { variant: 'novo' | 'usado' | 'recondicionado'; icon: LucideIcon }> = {
  new: { variant: 'novo', icon: Sparkles },
  used: { variant: 'usado', icon: Package },
  refurbished: { variant: 'recondicionado', icon: RefreshCw },
};

/** Selos: condição (sempre com texto, não só cor), Oferta e Sem estoque. */
export function ProductBadges({ product }: { product: Product }): JSX.Element {
  const c = CONDITION_BADGE[product.condition];
  const promo = getPriceInfo(product).isPromo;
  return (
    <div className="badges">
      <Badge variant={c.variant}><Icon as={c.icon} size={12} />{CONDITION_LABEL[product.condition]}</Badge>
      {promo ? <Badge variant="oferta"><Icon as={Tag} size={12} />Oferta</Badge> : null}
      {product.availableStock <= 0 ? <Badge variant="estoque">Sem estoque</Badge> : null}
    </div>
  );
}
