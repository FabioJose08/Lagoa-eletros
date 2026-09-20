import { useContext } from 'react';
import { CatalogContext, type CatalogValue } from '@/contexts/CatalogContext';

export function useCatalog(): CatalogValue {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error('useCatalog precisa estar dentro de <CatalogProvider>.');
  return ctx;
}
