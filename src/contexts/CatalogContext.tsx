import { createContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { firebaseErrorMessage } from '@/firebase/firestore';
import { subscribeActiveBrands } from '@/services/brandService';
import { subscribeActiveCategories } from '@/services/categoryService';
import { subscribeActiveProducts } from '@/services/productService';
import type { Brand, Category, Product } from '@/types';
import type { CatalogLookup } from '@/utils/search';

export interface CatalogValue {
  status: 'loading' | 'ready' | 'error';
  error: string | null;
  products: Product[];
  categories: Category[];
  brands: Brand[];
  lookup: CatalogLookup;
  categoryById: (id: string) => Category | undefined;
  brandById: (id: string | null) => Brand | undefined;
  productBySlug: (slug: string) => Product | undefined;
  /** true se existe algum item DEMO no catálogo (mostra o aviso de demonstração). */
  hasDemo: boolean;
}

export const CatalogContext = createContext<CatalogValue | null>(null);

const byName = <T extends { name: string }>(a: T, b: T): number => a.name.localeCompare(b.name, 'pt-BR');

/**
 * Fonte ÚNICA de dados da loja: escuta o Firestore em tempo real.
 * Quando o administrador cadastra/edita/desativa um produto, o site do cliente atualiza sozinho.
 */
export function CatalogProvider({ children }: { children: ReactNode }): JSX.Element {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [ready, setReady] = useState({ products: false, categories: false, brands: false });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fail = (e: Error): void => setError(firebaseErrorMessage(e, 'Não foi possível carregar os produtos.'));
    const unsubs = [
      subscribeActiveProducts((l) => { setProducts(l); setReady((r) => ({ ...r, products: true })); setError(null); }, fail),
      subscribeActiveCategories((l) => { setCategories(l.sort(byName)); setReady((r) => ({ ...r, categories: true })); }, fail),
      subscribeActiveBrands((l) => { setBrands(l.sort(byName)); setReady((r) => ({ ...r, brands: true })); }, fail),
    ];
    return () => unsubs.forEach((u) => u());
  }, []);

  const value = useMemo<CatalogValue>(() => {
    const catMap = new Map(categories.map((c) => [c.id, c]));
    const brandMap = new Map(brands.map((b) => [b.id, b]));
    const categoryById = (id: string): Category | undefined => catMap.get(id);
    const brandById = (id: string | null): Brand | undefined => (id ? brandMap.get(id) : undefined);
    return {
      status: error ? 'error' : ready.products && ready.categories && ready.brands ? 'ready' : 'loading',
      error,
      products,
      categories,
      brands,
      lookup: {
        categoryName: (id) => catMap.get(id)?.name ?? '',
        brandName: (id) => (id ? brandMap.get(id)?.name ?? '' : ''),
      },
      categoryById,
      brandById,
      productBySlug: (slug) => products.find((p) => p.slug === slug),
      hasDemo: products.some((p) => p.demo),
    };
  }, [products, categories, brands, ready, error]);

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}
