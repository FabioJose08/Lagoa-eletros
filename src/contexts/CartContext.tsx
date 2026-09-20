import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { CartItem, CartLine } from '@/types';
import { addToCart, buildCartLines, cartTotals, sanitizeCart, setCartQuantity, type CartTotals } from '@/utils/cart';
import { useCatalog } from '@/hooks/useCatalog';

const KEY = 'lagoa:cart:v2';

export interface CartValue extends CartTotals {
  items: CartItem[];
  lines: CartLine[];
  add: (productId: string, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
}

export const CartContext = createContext<CartValue | null>(null);

function load(): CartItem[] {
  try {
    return sanitizeCart(JSON.parse(localStorage.getItem(KEY) ?? '[]'));
  } catch {
    return [];
  }
}

/**
 * Carrinho guardado no aparelho (só ids e quantidades). Preços e estoque são sempre lidos do catálogo atual.
 * Para guardar por usuário no futuro, basta trocar load/save por leitura/escrita em users/{uid}/cart.
 */
export function CartProvider({ children }: { children: ReactNode }): JSX.Element {
  const { products } = useCatalog();
  const [items, setItems] = useState<CartItem[]>(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {
      /* armazenamento indisponível: segue só na memória */
    }
  }, [items]);

  const add = useCallback(
    (productId: string, quantity = 1) => {
      const p = products.find((x) => x.id === productId);
      setItems((cur) => addToCart(cur, productId, quantity, p ? p.availableStock : undefined));
    },
    [products],
  );
  const setQuantity = useCallback((productId: string, quantity: number) => setItems((cur) => setCartQuantity(cur, productId, quantity)), []);
  const remove = useCallback((productId: string) => setItems((cur) => cur.filter((i) => i.productId !== productId)), []);
  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartValue>(() => {
    const lines = buildCartLines(items, products);
    return { items, lines, ...cartTotals(lines), add, setQuantity, remove, clear };
  }, [items, products, add, setQuantity, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
