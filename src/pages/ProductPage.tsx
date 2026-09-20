import { useEffect, useMemo, useState } from 'react';
import { CircleAlert, CircleCheck, Info, Minus, Plus, ShoppingCart } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { Icon, WhatsAppIcon } from '@/components/icons';
import { FavoriteButton } from '@/components/store/FavoriteButton';
import { ProductGrid } from '@/components/store/ProductCard';
import { PriceDisplay } from '@/components/store/PriceDisplay';
import { ProductBadges } from '@/components/store/ProductBadges';
import { ProductImage } from '@/components/store/ProductImage';
import { WhatsAppButton } from '@/components/store/WhatsAppButton';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/sonner';
import { useCart } from '@/hooks/useCart';
import { useCatalog } from '@/hooks/useCatalog';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { GARANTIA_NOTA } from '@/lib/constants';
import type { Product, ProductCondition } from '@/types';
import { CONDITION_LABEL, CONDITION_TEXT } from '@/utils/labels';
import { getPriceInfo } from '@/utils/pricing';
import { getStockState, isPurchasable } from '@/utils/stock';
import { waLink, WA_MESSAGES } from '@/utils/whatsapp';
import { NotFoundPage } from './NotFoundPage';

const SCHEMA_CONDITION: Record<ProductCondition, string> = {
  new: 'https://schema.org/NewCondition',
  used: 'https://schema.org/UsedCondition',
  refurbished: 'https://schema.org/RefurbishedCondition',
};

function productJsonLd(p: Product, brand: string, url: string): Record<string, unknown> | undefined {
  if (p.demo) return undefined; // dados de demonstração não vão para o Google
  const info = getPriceInfo(p);
  const images = [p.imageUrl, ...p.additionalImages.map((i) => i.url)].filter(Boolean);
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    description: p.shortDescription || p.description || p.name,
    sku: p.sku,
    ...(images.length ? { image: images } : {}),
    ...(brand ? { brand: { '@type': 'Brand', name: brand } } : {}),
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: 'BRL',
      price: info.current.toFixed(2),
      itemCondition: SCHEMA_CONDITION[p.condition],
      availability: p.availableStock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
  };
}

export function ProductPage(): JSX.Element {
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const { products, status, productBySlug, categoryById, brandById } = useCatalog();
  const cart = useCart();
  const product = productBySlug(slug);
  const [selected, setSelected] = useState(0);
  const [qty, setQty] = useState(1);
  useEffect(() => { setSelected(0); setQty(1); }, [slug]);

  const brand = product ? brandById(product.brandId) : undefined;
  const cat = product ? categoryById(product.categoryId) : undefined;
  useDocumentMeta({
    title: product?.name,
    description: product ? (product.shortDescription || product.description || `${product.name} na Lagoa Eletros.`).slice(0, 160) : undefined,
    image: product?.imageUrl || undefined,
    noindex: product?.demo,
    jsonLd: product ? productJsonLd(product, brand?.name ?? '', window.location.href) : undefined,
  });

  const related = useMemo(() => {
    if (!product) return [];
    const same = products.filter((x) => x.id !== product.id && x.categoryId === product.categoryId).slice(0, 4);
    return same.length ? same : products.filter((x) => x.id !== product.id && x.featured).slice(0, 4);
  }, [products, product]);

  if (status === 'loading') return <LoadingScreen label="Carregando produto…" />;
  if (!product) return <NotFoundPage />;

  const purchasable = isPurchasable(product);
  const state = getStockState(product);
  const images = [...(product.imageUrl ? [product.imageUrl] : []), ...product.additionalImages.map((i) => i.url)];
  const maxQty = Math.max(1, Math.min(product.availableStock, 20));
  const inCart = cart.items.find((i) => i.productId === product.id)?.quantity ?? 0;

  const addToCart = (): boolean => {
    if (inCart + qty > product.availableStock) {
      toast.error(`Só temos ${product.availableStock} unidade(s) deste produto${inCart ? ` (você já tem ${inCart} no carrinho)` : ''}.`);
      return false;
    }
    cart.add(product.id, qty);
    return true;
  };
  const onAdd = (): void => {
    if (addToCart()) toast.success('Adicionado ao carrinho', { action: { label: 'Ver carrinho', onClick: () => navigate('/cart') } });
  };
  const onBuyNow = (): void => { if (addToCart()) navigate('/cart'); };

  const availability =
    state === 'in_stock' ? 'Em estoque. Confirme a disponibilidade pelo WhatsApp antes de vir à loja.'
    : state === 'low_stock' ? `Estoque baixo: restam ${product.availableStock} ${product.availableStock === 1 ? 'unidade' : 'unidades'}.`
    : 'Sem estoque no momento. Consulte a disponibilidade pelo WhatsApp.';
  const waMessage = purchasable ? WA_MESSAGES.interest(product.name, product.demo) : WA_MESSAGES.availability(product.name, product.demo);

  return (
    <div className="container pdp pdp-has-sticky">
      <div className="page-head">
        <Breadcrumbs items={[{ label: 'Início', to: '/' }, { label: 'Produtos', to: '/products' }, ...(cat ? [{ label: cat.name, to: `/categories/${cat.slug}` }] : []), { label: product.name }]} />
      </div>
      <div className="pdp__grid">
        <div className="pdp__media">
          <ProductImage product={product} large src={images[selected]} priority />
          {images.length > 1 ? (
            <div className="pdp__thumbs">
              {images.map((src, i) => (
                <button key={src} type="button" className="pdp__thumb" aria-label={`Ver imagem ${i + 1} de ${images.length}`} aria-current={i === selected} onClick={() => setSelected(i)}>
                  <img src={src} alt="" width={72} height={54} loading="lazy" />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="pdp__info">
          <ProductBadges product={product} />
          <h1 className="pdp__title" tabIndex={-1}>{product.name}</h1>
          <PriceDisplay product={product} lg />
          <p className={`pdp__avail ${purchasable ? 'pdp__avail--ok' : 'pdp__avail--no'}`}>
            <Icon as={purchasable ? CircleCheck : CircleAlert} size={20} />
            <span>{availability}</span>
          </p>

          <div className="pdp__cta">
            {purchasable ? (
              <>
                <div className="pdp__qty">
                  <span id="qty-label" className="label" style={{ margin: 0 }}>Quantidade</span>
                  <div className="qty" role="group" aria-labelledby="qty-label">
                    <button type="button" aria-label="Diminuir quantidade" disabled={qty <= 1} onClick={() => setQty((q) => Math.max(1, q - 1))}><Icon as={Minus} size={18} /></button>
                    <output aria-live="polite">{qty}</output>
                    <button type="button" aria-label="Aumentar quantidade" disabled={qty >= maxQty} onClick={() => setQty((q) => Math.min(maxQty, q + 1))}><Icon as={Plus} size={18} /></button>
                  </div>
                </div>
                <Button size="lg" block onClick={onAdd}><Icon as={ShoppingCart} size={20} />Adicionar ao carrinho</Button>
                <div className="pdp__cta-row">
                  <Button size="lg" variant="outline" onClick={onBuyNow}>Comprar agora</Button>
                  <FavoriteButton product={product} inline />
                </div>
                <WhatsAppButton message={waMessage} label="Falar no WhatsApp" size="lg" block />
              </>
            ) : (
              <>
                <Button size="lg" block disabled>Indisponível</Button>
                <div className="pdp__cta-row">
                  <WhatsAppButton message={waMessage} label="Consultar disponibilidade" size="lg" />
                  <FavoriteButton product={product} inline />
                </div>
              </>
            )}
          </div>
          <p className="pdp__note"><Icon as={Info} size={18} /><span>{GARANTIA_NOTA}</span></p>
          {product.demo ? (
            <p className="demo-note"><Icon as={Info} size={18} /><span><strong>Produto de demonstração.</strong> Nome, preço e disponibilidade são exemplos e não representam o estoque real da loja.</span></p>
          ) : null}
        </div>
      </div>

      <div className="pdp__sections">
        <section aria-labelledby="desc-title">
          <h2 className="pdp__h2" id="desc-title">Descrição</h2>
          <p className="pdp__desc" style={{ whiteSpace: 'pre-line' }}>{product.description || product.shortDescription || 'Descrição em breve.'}</p>
        </section>
        <section aria-labelledby="info-title">
          <h2 className="pdp__h2" id="info-title">Informações</h2>
          <dl className="spec">
            <div className="spec__row"><dt>Marca</dt><dd>{brand?.name ?? 'Não informada'}</dd></div>
            <div className="spec__row"><dt>Categoria</dt><dd>{cat ? <Link to={`/categories/${cat.slug}`}>{cat.name}</Link> : '—'}</dd></div>
            <div className="spec__row"><dt>Condição</dt><dd>{CONDITION_LABEL[product.condition]}</dd></div>
            <div className="spec__row"><dt>Sobre a condição</dt><dd>{CONDITION_TEXT[product.condition]}</dd></div>
            <div className="spec__row"><dt>SKU</dt><dd>{product.sku || '—'}</dd></div>
            <div className="spec__row"><dt>Disponibilidade</dt><dd>{state === 'out_of_stock' ? 'Sem estoque no momento' : state === 'low_stock' ? 'Estoque baixo' : 'Em estoque'}</dd></div>
          </dl>
        </section>
        {related.length ? (
          <section aria-labelledby="rel-title">
            <h2 className="pdp__h2" id="rel-title">{related[0].categoryId === product.categoryId ? `Mais em ${cat?.name ?? 'esta categoria'}` : 'Você também pode gostar'}</h2>
            <ProductGrid products={related} />
          </section>
        ) : null}
      </div>

      <div className="sticky-buy">
        <div className="sticky-buy__price"><PriceDisplay product={product} /></div>
        {purchasable ? <Button className="sticky-buy__main" onClick={onAdd}><Icon as={ShoppingCart} size={18} />Adicionar</Button> : null}
        <a className="btn btn--whatsapp sticky-buy__wa" href={waLink(waMessage)} target="_blank" rel="noopener noreferrer" aria-label={purchasable ? 'Falar no WhatsApp sobre este produto' : 'Consultar disponibilidade no WhatsApp'}>
          <WhatsAppIcon size={22} />
        </a>
      </div>
    </div>
  );
}
