import { useContext } from 'react';
import { CartContext, type CartValue } from '@/contexts/CartContext';

export function useCart(): CartValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart precisa estar dentro de <CartProvider>.');
  return ctx;
}
