import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { useAuth } from '@/hooks/useAuth';

/**
 * Área do administrador.
 *  - não logado            -> /admin/login
 *  - logado, mas não admin -> volta para a loja (sem mostrar nada do painel)
 *  - admin                 -> entra
 * Atenção: isto só organiza a navegação. Quem PROTEGE os dados são as Security Rules do Firebase.
 */
export function AdminRoute(): JSX.Element {
  const { user, isAdmin, loading } = useAuth();
  const location = useLocation();
  if (loading) return <LoadingScreen label="Verificando seu acesso…" />;
  if (!user) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  if (!isAdmin) return <Navigate to="/" replace state={{ denied: true }} />;
  return <Outlet />;
}
