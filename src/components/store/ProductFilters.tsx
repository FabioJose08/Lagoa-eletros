import { useEffect, useRef, useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import type { Brand, Category, ProductCondition, ProductFilters as Filters } from '@/types';
import { CONDITION_LABEL } from '@/utils/labels';

export interface ProductFiltersProps {
  /** Prefixo dos ids (o mesmo formulário aparece na lateral e na gaveta do celular). */
  prefix: string;
  filters: Filters;
  onChange: (patch: Partial<Filters>) => void;
  categories: Category[];
  brands: Brand[];
  /** Quando a página já é de uma categoria, o filtro de categoria some. */
  hideCategories?: boolean;
  hideOnSale?: boolean;
}

const toggle = <T,>(list: T[], v: T): T[] => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
const CONDITIONS: ProductCondition[] = ['new', 'used', 'refurbished'];

/** Faixa de preço: espera 350 ms depois de digitar antes de filtrar (e respeita "Limpar filtros"). */
function PriceRange({ prefix, filters, onChange }: Pick<ProductFiltersProps, 'prefix' | 'filters' | 'onChange'>): JSX.Element {
  const [min, setMin] = useState(filters.minPrice);
  const [max, setMax] = useState(filters.maxPrice);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    window.clearTimeout(timer.current);
    setMin(filters.minPrice);
    setMax(filters.maxPrice);
  }, [filters.minPrice, filters.maxPrice]);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const push = (patch: Partial<Filters>): void => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => onChange(patch), 350);
  };
  return (
    <div className="range">
      <label className="field" htmlFor={`${prefix}-min`}>
        Mínimo (R$)
        <Input id={`${prefix}-min`} type="number" inputMode="numeric" min={0} step={10} placeholder="0" value={min}
          onChange={(e) => { setMin(e.target.value); push({ minPrice: e.target.value, maxPrice: max }); }} />
      </label>
      <label className="field" htmlFor={`${prefix}-max`}>
        Máximo (R$)
        <Input id={`${prefix}-max`} type="number" inputMode="numeric" min={0} step={10} placeholder="Sem limite" value={max}
          onChange={(e) => { setMax(e.target.value); push({ minPrice: min, maxPrice: e.target.value }); }} />
      </label>
    </div>
  );
}

export function ProductFilters({ prefix, filters, onChange, categories, brands, hideCategories, hideOnSale }: ProductFiltersProps): JSX.Element {
  return (
    <form className="filters" onSubmit={(e) => e.preventDefault()}>
      {!hideCategories && categories.length > 0 ? (
        <fieldset className="fgroup">
          <legend>Categoria</legend>
          {categories.map((c) => (
            <label className="check" key={c.id}>
              <Checkbox checked={filters.categoryIds.includes(c.id)} onChange={() => onChange({ categoryIds: toggle(filters.categoryIds, c.id) })} />
              <span>{c.name}</span>
            </label>
          ))}
        </fieldset>
      ) : null}
      <fieldset className="fgroup">
        <legend>Condição</legend>
        {CONDITIONS.map((c) => (
          <label className="check" key={c}>
            <Checkbox checked={filters.conditions.includes(c)} onChange={() => onChange({ conditions: toggle(filters.conditions, c) })} />
            <span>{CONDITION_LABEL[c]}</span>
          </label>
        ))}
      </fieldset>
      <fieldset className="fgroup">
        <legend>Faixa de preço</legend>
        <PriceRange prefix={prefix} filters={filters} onChange={onChange} />
      </fieldset>
      {brands.length > 0 ? (
        <fieldset className="fgroup">
          <legend>Marca</legend>
          {brands.map((b) => (
            <label className="check" key={b.id}>
              <Checkbox checked={filters.brandIds.includes(b.id)} onChange={() => onChange({ brandIds: toggle(filters.brandIds, b.id) })} />
              <span>{b.name}</span>
            </label>
          ))}
        </fieldset>
      ) : null}
      <fieldset className="fgroup">
        <legend>Disponibilidade</legend>
        {!hideOnSale ? (
          <label className="check">
            <Checkbox checked={filters.onSaleOnly} onChange={() => onChange({ onSaleOnly: !filters.onSaleOnly })} />
            <span>Somente em promoção</span>
          </label>
        ) : null}
        <label className="check">
          <Checkbox checked={filters.inStockOnly} onChange={() => onChange({ inStockOnly: !filters.inStockOnly })} />
          <span>Somente com estoque</span>
        </label>
      </fieldset>
    </form>
  );
}

export type { Filters as ProductFiltersValue };
