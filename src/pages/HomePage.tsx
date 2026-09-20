import { useMemo } from 'react';
import { RefreshCw, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EmptyState, LoadingGrid } from '@/components/common/PageState';
import { Icon } from '@/components/icons';
import { Benefits } from '@/components/store/Benefits';
import { CategoryGrid } from '@/components/store/CategoryGrid';
import { CtaBand } from '@/components/store/CtaBand';
import { Hero } from '@/components/store/Hero';
import { LocationCard } from '@/components/store/LocationCard';
import { ProductGrid } from '@/components/store/ProductCard';
import { SectionTitle } from '@/components/store/SectionTitle';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useCatalog } from '@/hooks/useCatalog';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import type { Product } from '@/types';
import { getPriceInfo } from '@/utils/pricing';
import { sortProducts } from '@/utils/search';
import { STORE } from '@/lib/constants';

/** Alterna recondicionados e usados para a seção "Usados e Recondicionados". */
function interleave(a: Product[], b: Product[], max: number): Product[] {
  const out: Product[] = [];
  for (let i = 0; out.length < max && (a[i] || b[i]); i++) {
    if (a[i]) out.push(a[i]);
    if (b[i] && out.length < max) out.push(b[i]);
  }
  return out;
}

export function HomePage(): JSX.Element {
  useDocumentMeta({});
  const { products, categories, status } = useCatalog();
  const { isAdmin } = useAuth();

  const sections = useMemo(() => {
    const now = new Date();
    const promo = (p: Product): boolean => getPriceInfo(p, now).isPromo;
    return {
      // destaques: os mais recentes primeiro (o que você acabou de destacar aparece logo)
      featured: sortProducts(products.filter((p) => p.featured), 'newest', now).slice(0, 8),
      offers: products.filter(promo).slice(0, 4),
      news: products.filter((p) => p.condition === 'new' && !promo(p)).slice(0, 4),
      reuse: interleave(
        products.filter((p) => p.condition === 'refurbished'),
        products.filter((p) => p.condition === 'used'),
        4,
      ),
    };
  }, [products]);

  const empty = status === 'ready' && products.length === 0;

  return (
    <>
      <Hero />

      {categories.length > 0 ? (
        <section className="section section--tight" aria-labelledby="cat-title">
          <div className="container">
            <SectionTitle id="cat-title" title="Categorias" moreTo="/categories" moreLabel="Ver todas" />
            <CategoryGrid />
          </div>
        </section>
      ) : null}

      {status === 'loading' ? (
        <section className="section section--tight"><div className="container"><LoadingGrid count={4} /></div></section>
      ) : null}

      {empty ? (
        <section className="section section--tight">
          <div className="container">
            <EmptyState
              title="Estamos preparando o catálogo."
              text="Ainda não há produtos cadastrados. Enquanto isso, fale com a gente pelo WhatsApp."
              actions={isAdmin ? <Button asChild><Link to="/admin/products/new">Cadastrar o primeiro produto</Link></Button> : undefined}
            />
          </div>
        </section>
      ) : null}

      {sections.featured.length ? (
        <section className="section section--tight" aria-labelledby="dest-title">
          <div className="container">
            <SectionTitle id="dest-title" title="Produtos em destaque" moreTo="/products" moreLabel="Ver todos os produtos" />
            <ProductGrid products={sections.featured} />
          </div>
        </section>
      ) : null}

      {sections.offers.length ? (
        <section className="section section--tint" aria-labelledby="of-title">
          <div className="container">
            <SectionTitle id="of-title" title="Ofertas da Lagoa" lead="Produtos com preço reduzido." moreTo="/offers" moreLabel="Ver todas as ofertas" mark={Tag} />
            <ProductGrid products={sections.offers} />
          </div>
        </section>
      ) : null}

      {sections.news.length ? (
        <section className="section" aria-labelledby="new-title">
          <div className="container">
            <SectionTitle id="new-title" title="Novos produtos" moreTo="/products?cond=new" moreLabel="Ver novos" />
            <ProductGrid products={sections.news} />
          </div>
        </section>
      ) : null}

      {sections.reuse.length ? (
        <section className="section section--tight" aria-labelledby="reuse-title">
          <div className="container">
            <div className="reuse">
              <div className="reuse__panel">
                <span className="reuse__mark"><Icon as={RefreshCw} size={24} /></span>
                <h2 className="reuse__title" id="reuse-title">Usados e Recondicionados</h2>
                <p className="reuse__text">Opções para quem busca economia sem abrir mão de equipamentos selecionados.</p>
                <p className="reuse__note"><Icon as={RefreshCw} size={16} /><span>Consulte as condições de garantia de cada produto antes da compra.</span></p>
                <div className="reuse__cta">
                  <Link className="btn btn--ghost-dark" to="/products?cond=used">Ver usados</Link>
                  <Link className="btn btn--ghost-dark" to="/products?cond=refurbished">Ver recondicionados</Link>
                </div>
              </div>
              <ProductGrid products={sections.reuse} className="product-grid--reuse" />
            </div>
          </div>
        </section>
      ) : null}

      <section className="section" aria-labelledby="why-title">
        <div className="container">
          <SectionTitle id="why-title" title="Por que Lagoa Eletros?" />
          <Benefits />
        </div>
      </section>

      <section className="section section--tight" aria-labelledby="about-title">
        <div className="container">
          <div className="about">
            <div className="about__text">
              <h2 className="section-title" id="about-title">Sobre a Lagoa Eletros</h2>
              <p>A Lagoa Eletros é uma loja localizada em Lagoa do Carro, Pernambuco, especializada em produtos eletrônicos, informática, acessórios, peças e equipamentos novos, usados e recondicionados.</p>
              <div className="about__cta"><Button asChild variant="outline"><Link to="/about">Conhecer a loja</Link></Button></div>
            </div>
            <div className="about__logo">
              <img src="/brand/logo-full.webp" width={420} height={335} alt={`Logo da ${STORE.name}: ${STORE.tagline}`} loading="lazy" />
            </div>
          </div>
        </div>
      </section>

      <section className="section section--tight" aria-labelledby="loc-title"><div className="container"><LocationCard /></div></section>
      <section className="section section--tight"><div className="container"><CtaBand /></div></section>
    </>
  );
}
