import { useContext } from 'react';
import { FavoritesContext, type FavoritesValue } from '@/contexts/FavoritesContext';

export function useFavorites(): FavoritesValue {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites precisa estar dentro de <FavoritesProvider>.');
  return ctx;
}
