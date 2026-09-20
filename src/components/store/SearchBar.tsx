import { useMemo, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CategoryIcon, Icon } from '@/components/icons';
import { useCatalog } from '@/hooks/useCatalog';
import { formatBRL } from '@/utils/format';
import { CONDITION_LABEL } from '@/utils/labels';
import { getPriceInfo } from '@/utils/pricing';
import { normalizeText, searchProducts } from '@/utils/search';

export interface SearchBarProps {
  id: string;
  variant?: 'hero' | 'panel' | 'page';
  placeholder?: string;
  autoFocus?: boolean;
  /** Chamado depois de navegar (ex.: fechar o painel de busca do cabeçalho). */
  onDone?: () => void;
  /** Modo "ao vivo" (catálogo): o texto é controlado pelo pai e filtra a lista enquanto digita. */
  live?: { value: string; onChange: (value: string) => void };
}

interface Option {
  key: string;
  to: string;
  icon: string;
  title: string;
  sub: string;
  price?: string;
  all?: boolean;
}

/** Busca com sugestões (padrão "combobox" acessível: setas, Enter, Esc). */
export function SearchBar({ id, variant = 'page', placeholder = 'Buscar produtos', autoFocus, onDone, live }: SearchBarProps): JSX.Element {
  const navigate = useNavigate();
  const { products, categories, lookup, categoryById } = useCatalog();
  const [text, setText] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const value = live ? live.value : text;
  const q = value.trim();

  const options = useMemo<Option[]>(() => {
    if (live || q.length < 2) return [];
    const nq = normalizeText(q);
    const cats: Option[] = categories
      .filter((c) => normalizeText(c.name).includes(nq))
      .slice(0, 2)
      .map((c) => ({ key: `c-${c.id}`, to: `/categories/${c.slug}`, icon: c.icon, title: c.name, sub: 'Categoria' }));
    const prods: Option[] = searchProducts(products, q, lookup)
      .slice(0, 5)
      .map((p) => ({
        key: `p-${p.id}`,
        to: `/products/${p.slug}`,
        icon: categoryById(p.categoryId)?.icon ?? 'zap',
        title: p.name,
        sub: `${categoryById(p.categoryId)?.name ?? ''}, ${CONDITION_LABEL[p.condition].toLowerCase()}`,
        price: formatBRL(getPriceInfo(p).current),
      }));
    if (!cats.length && !prods.length) return [];
    return [...cats, ...prods, { key: 'all', to: `/products?q=${encodeURIComponent(q)}`, icon: 'search', title: `Ver todos os resultados para “${q}”`, sub: '', all: true }];
  }, [live, q, categories, products, lookup, categoryById]);

  const showList = open && !live && q.length >= 2;
  const go = (to: string): void => {
    setOpen(false);
    setActive(-1);
    navigate(to);
    onDone?.();
  };
  const onSubmit = (e: FormEvent): void => {
    e.preventDefault();
    if (live) return;
    go(q ? `/products?q=${encodeURIComponent(q)}` : '/products');
  };
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (!showList) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => (i + 1) % options.length); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => (i <= 0 ? options.length - 1 : i - 1)); }
    else if (e.key === 'Enter' && active >= 0 && options[active]) { e.preventDefault(); go(options[active].to); }
    else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); setOpen(false); }
  };

  const listId = `${id}-list`;
  return (
    <form
      className={`sb sb--${variant}`}
      role="search"
      onSubmit={onSubmit}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(false); }}
    >
      <label className="sr-only" htmlFor={`${id}-input`}>Buscar produtos</label>
      <div className="sb__field">
        <Icon as={Search} size={20} className="sb__icon" />
        <input
          id={`${id}-input`}
          className="sb__input"
          type="search"
          name="q"
          value={value}
          placeholder={placeholder}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          enterKeyHint="search"
          autoFocus={autoFocus}
          {...(live
            ? {}
            : { role: 'combobox', 'aria-expanded': showList, 'aria-controls': listId, 'aria-autocomplete': 'list' as const, 'aria-activedescendant': active >= 0 ? `${id}-opt-${active}` : undefined })}
          onChange={(e) => { if (live) live.onChange(e.target.value); else { setText(e.target.value); setOpen(true); setActive(-1); } }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
        />
        <button type="submit" className="btn btn--primary sb__submit">Buscar</button>
      </div>
      {!live ? (
        <ul id={listId} className="sb__list" role="listbox" aria-label="Sugestões" hidden={!showList}>
          {showList && options.length === 0 ? (
            <li className="sb__opt" role="option" aria-disabled="true" aria-selected="false">
              <span className="sb__opt-text">
                <span className="sb__opt-title">Nenhum produto encontrado.</span>
                <span className="sb__opt-sub">Experimente buscar por outro nome ou categoria.</span>
              </span>
            </li>
          ) : null}
          {showList ? options.map((o, i) => (
            <li
              key={o.key}
              id={`${id}-opt-${i}`}
              role="option"
              aria-selected={i === active}
              className={`sb__opt${o.all ? ' sb__opt--all' : ''}`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => go(o.to)}
            >
              <span className="sb__opt-icon"><CategoryIcon name={o.icon === 'search' ? 'zap' : o.icon} size={18} /></span>
              <span className="sb__opt-text">
                <span className="sb__opt-title">{o.title}</span>
                {o.sub ? <span className="sb__opt-sub">{o.sub}</span> : null}
              </span>
              {o.price ? <span className="sb__opt-price">{o.price}</span> : null}
            </li>
          )) : null}
        </ul>
      ) : null}
    </form>
  );
}
