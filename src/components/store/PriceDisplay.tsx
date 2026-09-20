import type { Product } from '@/types';
import { formatBRL } from '@/utils/format';
import { getPriceInfo } from '@/utils/pricing';
import { cn } from '@/lib/utils';

/** Mostra preço anterior (riscado), preço atual e % de desconto. A regra de preço é única (utils/pricing.ts). */
export function PriceDisplay({
  product,
  lg,
}: {
  product: Pick<Product, 'price' | 'oldPrice' | 'onSale' | 'promotion'>;
  lg?: boolean;
}): JSX.Element {
  const info = getPriceInfo(product);
  return (
    <div className={cn('price', lg && 'price--lg')}>
      {info.previous !== null ? (
        <span className="price__old"><span className="sr-only">De </span>{formatBRL(info.previous)}</span>
      ) : null}
      <span className="price__now">
        <span className="sr-only">{info.previous !== null ? 'Por ' : 'Preço: '}</span>
        {formatBRL(info.current)}
      </span>
      {info.discountPercent > 0 ? (
        <span className="price__off">
          <span aria-hidden="true">-{info.discountPercent}%</span>
          <span className="sr-only">{info.discountPercent}% de desconto</span>
        </span>
      ) : null}
    </div>
  );
}
