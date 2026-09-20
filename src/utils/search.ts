import type { Product, ProductCondition, ProductFilters } from '@/types';
import { parseMoney } from './format';
import { CONDITION_LABEL } from './labels';
import { getPriceInfo } from './pricing';

export const normalizeText = (s: string): string =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

/** Como o catálogo traduz ids em nomes (categoria/marca) para a busca por texto. */
export interface CatalogLookup {
  categoryName: (id: string) => string;
  brandName: (id: string | null) => string;
}

export const DEFAULT_FILTERS: ProductFilters = {
  query: '',
  categoryIds: [],
  brandIds: [],
  conditions: [],
  minPrice: '',
  maxPrice: '',
  onSaleOnly: false,
  inStockOnly: false,
  sort: 'relevance',
};

function searchIndex(p: Product, lookup: CatalogLookup): string {
  return normalizeText(
    [p.name, p.sku, p.shortDescription, lookup.categoryName(p.categoryId), lookup.brandName(p.brandId), CONDITION_LABEL[p.condition]].join(' '),
  );
}

/** Busca por nome, SKU, categoria, marca e condição. Todas as palavras precisam aparecer. */
export function searchProducts(products: Product[], query: string, lookup: CatalogLookup): Product[] {
  const tokens = normalizeText(query).split(/\s+/).filter(Boolean);
  if (!tokens.length) return products;
  return products.filter((p) => {
    const idx = searchIndex(p, lookup);
    return tokens.every((t) => idx.includes(t));
  });
}

export function filterProducts(
  products: Product[],
  f: ProductFilters,
  lookup: CatalogLookup,
  now: Date = new Date(),
): Product[] {
  let list = searchProducts(products, f.query, lookup);
  if (f.categoryIds.length) list = list.filter((p) => f.categoryIds.includes(p.categoryId));
  if (f.brandIds.length) list = list.filter((p) => p.brandId !== null && f.brandIds.includes(p.brandId));
  if (f.conditions.length) list = list.filter((p) => f.conditions.includes(p.condition));
  const min = parseMoney(f.minPrice);
  const max = parseMoney(f.maxPrice);
  if (min !== null) list = list.filter((p) => getPriceInfo(p, now).current >= min);
  if (max !== null) list = list.filter((p) => getPriceInfo(p, now).current <= max);
  if (f.onSaleOnly) list = list.filter((p) => getPriceInfo(p, now).isPromo);
  if (f.inStockOnly) list = list.filter((p) => p.availableStock > 0);
  return sortProducts(list, f.sort, now);
}

export function sortProducts(products: Product[], sort: ProductFilters['sort'], now: Date = new Date()): Product[] {
  const list = products.slice();
  const price = (p: Product): number => getPriceInfo(p, now).current;
  switch (sort) {
    case 'price_asc':
      return list.sort((a, b) => price(a) - price(b));
    case 'price_desc':
      return list.sort((a, b) => price(b) - price(a));
    case 'name':
      return list.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    case 'newest':
      return list.sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
    default:
      return list.sort(
        (a, b) =>
          Number(b.featured) - Number(a.featured) ||
          Number(getPriceInfo(b, now).isPromo) - Number(getPriceInfo(a, now).isPromo) ||
          Number(b.availableStock > 0) - Number(a.availableStock > 0) ||
          a.name.localeCompare(b.name, 'pt-BR'),
      );
  }
}

/* ---------- Filtros <-> URL (links compartilháveis) ---------- */

const list = (v: string | null): string[] => (v ? v.split(',').map((s) => s.trim()).filter(Boolean) : []);
const isCondition = (v: string): v is ProductCondition => v in CONDITION_LABEL;
const SORTS: ProductFilters['sort'][] = ['relevance', 'price_asc', 'price_desc', 'name', 'newest'];

export function filtersFromParams(sp: URLSearchParams): ProductFilters {
  const sort = sp.get('sort');
  return {
    query: sp.get('q') ?? '',
    categoryIds: list(sp.get('cat')),
    brandIds: list(sp.get('brand')),
    conditions: list(sp.get('cond')).filter(isCondition),
    minPrice: sp.get('min') ?? '',
    maxPrice: sp.get('max') ?? '',
    onSaleOnly: sp.get('sale') === '1',
    inStockOnly: sp.get('stock') === '1',
    sort: SORTS.includes(sort as ProductFilters['sort']) ? (sort as ProductFilters['sort']) : 'relevance',
  };
}

export function filtersToParams(f: ProductFilters): URLSearchParams {
  const sp = new URLSearchParams();
  if (f.query) sp.set('q', f.query);
  if (f.categoryIds.length) sp.set('cat', f.categoryIds.join(','));
  if (f.brandIds.length) sp.set('brand', f.brandIds.join(','));
  if (f.conditions.length) sp.set('cond', f.conditions.join(','));
  if (f.minPrice) sp.set('min', f.minPrice);
  if (f.maxPrice) sp.set('max', f.maxPrice);
  if (f.onSaleOnly) sp.set('sale', '1');
  if (f.inStockOnly) sp.set('stock', '1');
  if (f.sort !== 'relevance') sp.set('sort', f.sort);
  return sp;
}
