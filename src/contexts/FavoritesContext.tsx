import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

const KEY = 'lagoa:favoritos:v1';

export interface FavoritesValue {
  ids: string[];
  isFavorite: (productId: string) => boolean;
  /** Retorna true se o produto passou a ser favorito, false se foi removido. */
  toggle: (productId: string) => boolean;
}

export const FavoritesContext = createContext<FavoritesValue | null>(null);

function load(): string[] {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(raw) ? raw.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function FavoritesProvider({ children }: { children: ReactNode }): JSX.Element {
  const [ids, setIds] = useState<string[]>(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(ids));
    } catch {
      /* segue na memória */
    }
  }, [ids]);

  const isFavorite = useCallback((id: string) => ids.includes(id), [ids]);
  const toggle = useCallback(
    (id: string): boolean => {
      const on = !ids.includes(id);
      setIds((cur) => (on ? [...cur, id] : cur.filter((x) => x !== id)));
      return on;
    },
    [ids],
  );

  const value = useMemo<FavoritesValue>(() => ({ ids, isFavorite, toggle }), [ids, isFavorite, toggle]);
  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}
