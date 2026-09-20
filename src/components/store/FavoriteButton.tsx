import { Heart } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { Icon } from '@/components/icons';
import { useFavorites } from '@/hooks/useFavorites';
import { cn } from '@/lib/utils';
import type { Product } from '@/types';

export function FavoriteButton({ product, inline, className }: { product: Product; inline?: boolean; className?: string }): JSX.Element {
  const { isFavorite, toggle } = useFavorites();
  const on = isFavorite(product.id);
  return (
    <button
      type="button"
      className={cn('fav-btn', inline && 'fav-btn--inline', className)}
      aria-pressed={on}
      aria-label={`Favoritar ${product.name}`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toast(toggle(product.id) ? 'Adicionado aos favoritos' : 'Removido dos favoritos');
      }}
    >
      <Icon as={Heart} size={22} />
    </button>
  );
}
