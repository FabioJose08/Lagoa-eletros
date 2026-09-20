import { BrowserRouter } from 'react-router-dom';
import { SetupNotice } from '@/components/common/SetupNotice';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import { CatalogProvider } from '@/contexts/CatalogContext';
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import { isFirebaseConfigured } from '@/firebase/config';
import { AppRoutes } from '@/routes/AppRoutes';

export default function App(): JSX.Element {
  // Sem o arquivo .env preenchido, mostra o passo a passo em vez de uma tela quebrada.
  if (!isFirebaseConfigured) return <SetupNotice />;
  return (
    <BrowserRouter>
      <AuthProvider>
        <CatalogProvider>
          <CartProvider>
            <FavoritesProvider>
              <AppRoutes />
              <Toaster />
            </FavoritesProvider>
          </CartProvider>
        </CatalogProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
