import { useState } from 'react';
import { Boxes, ClipboardList, ExternalLink, LayoutDashboard, LogOut, Menu, Percent, Tags, Users, X, Store } from 'lucide-react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Drawer } from '@/components/common/Drawer';
import { Icon } from '@/components/icons';
import { useAuth } from '@/hooks/useAuth';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';

const NAV = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/products', label: 'Produtos', icon: Boxes },
  { to: '/admin/orders', label: 'Pedidos', icon: ClipboardList },
  { to: '/admin/categories', label: 'Categorias', icon: Tags },
  { to: '/admin/brands', label: 'Marcas', icon: Store },
  { to: '/admin/promotions', label: 'Promoções', icon: Percent },
  { to: '/admin/users', label: 'Usuários', icon: Users },
] as const;

/** Layout do ADMINISTRADOR: totalmente separado da loja (menu lateral, tabelas, formulários). */
export function AdminLayout(): JSX.Element {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  useDocumentMeta({ title: 'Painel administrativo', noindex: true });

  const current = NAV.find((n) => pathname.startsWith(n.to))?.label ?? 'Painel';
  const logout = async (): Promise<void> => { await signOut(); navigate('/admin/login', { replace: true }); };

  const links = (onClick?: () => void): JSX.Element => (
    <nav className="admin-nav" aria-label="Painel administrativo">
      {NAV.map((n) => (
        <NavLink key={n.to} to={n.to} onClick={onClick}><Icon as={n.icon} size={20} />{n.label}</NavLink>
      ))}
    </nav>
  );

  return (
    <div className="admin">
      <aside className="admin-sidebar">
        <Link className="admin-sidebar__logo" to="/admin/dashboard"><img src="/brand/logo-mark-sm.webp" width={94} height={52} alt="Lagoa Eletros" /></Link>
        <p className="admin-sidebar__tag">Painel administrativo</p>
        {links()}
        <div className="admin-sidebar__foot">
          <nav className="admin-nav" aria-label="Atalhos">
            <Link to="/" target="_blank" rel="noopener"><Icon as={ExternalLink} size={20} />Ver a loja</Link>
            <button type="button" className="admin-nav__btn" onClick={() => void logout()}><Icon as={LogOut} size={20} />Sair</button>
          </nav>
          <p className="admin-sidebar__user">{user?.email}</p>
        </div>
      </aside>

      <div className="admin-content">
        <header className="admin-top">
          <button type="button" className="icon-btn admin-top__menu" aria-label="Abrir menu do painel" aria-haspopup="dialog" onClick={() => setMenuOpen(true)}><Icon as={Menu} size={24} /></button>
          <span className="admin-top__title">{current}</span>
          <span className="admin-top__spacer" />
          <Link className="icon-btn" to="/" target="_blank" rel="noopener" aria-label="Ver a loja (abre em nova aba)"><Icon as={ExternalLink} size={20} /></Link>
        </header>
        <main className="admin-main" id="conteudo" tabIndex={-1}><Outlet /></main>
      </div>

      <Drawer open={menuOpen} onClose={() => setMenuOpen(false)} variant="side" label="Menu do painel">
        <div className="drawer__head">
          <img src="/brand/logo-mark-sm.webp" width={94} height={52} alt="Lagoa Eletros" />
          <button type="button" className="icon-btn" onClick={() => setMenuOpen(false)} aria-label="Fechar menu"><Icon as={X} size={24} /></button>
        </div>
        <div className="drawer__body admin-sidebar admin-sidebar--drawer">
          {links(() => setMenuOpen(false))}
          <div className="admin-sidebar__foot">
            <nav className="admin-nav" aria-label="Atalhos">
              <Link to="/" target="_blank" rel="noopener"><Icon as={ExternalLink} size={20} />Ver a loja</Link>
              <button type="button" className="admin-nav__btn" onClick={() => void logout()}><Icon as={LogOut} size={20} />Sair</button>
            </nav>
            <p className="admin-sidebar__user">{user?.email}</p>
          </div>
        </div>
      </Drawer>
    </div>
  );
}
