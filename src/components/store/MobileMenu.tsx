import { Clock, Heart, Home, Info, LayoutDashboard, LayoutGrid, LogOut, MapPin, RefreshCw, ShoppingCart, Sparkles, Tag, User, X } from 'lucide-react';
import { useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Drawer } from '@/components/common/Drawer';
import { Icon } from '@/components/icons';
import { useAuth } from '@/hooks/useAuth';
import { STORE } from '@/lib/constants';
import { WA_MESSAGES } from '@/utils/whatsapp';
import { WhatsAppButton } from './WhatsAppButton';

export function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }): JSX.Element {
  const { user, isAdmin, signOut } = useAuth();
  const { pathname, search } = useLocation();
  // Fecha o menu quando a página muda.
  useEffect(() => { onClose(); }, [pathname, search]); // eslint-disable-line react-hooks/exhaustive-deps

  const link = (to: string, label: string, icon: Parameters<typeof Icon>[0]['as'], end = false): JSX.Element => (
    <li key={to}>
      <NavLink className="menu-link" to={to} end={end}><Icon as={icon} size={22} />{label}</NavLink>
    </li>
  );

  return (
    <Drawer open={open} onClose={onClose} variant="side" label="Menu">
      <div className="drawer__head">
        <img src="/brand/logo-mark-sm.webp" width={94} height={52} alt="Lagoa Eletros" />
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Fechar menu"><Icon as={X} size={24} /></button>
      </div>
      <div className="drawer__body">
        <nav aria-label="Menu">
          <ul className="menu-list">
            {link('/', 'Início', Home, true)}
            {link('/products', 'Produtos', LayoutGrid)}
            {link('/categories', 'Categorias', Tag)}
            {link('/offers', 'Ofertas', Sparkles)}
            {link('/about', 'Sobre', Info)}
            {link('/location', 'Localização', MapPin)}
            <li><Link className="menu-link" to="/products?cond=used,refurbished"><Icon as={RefreshCw} size={22} />Usados e recondicionados</Link></li>
            {link('/favorites', 'Favoritos', Heart)}
            {link('/cart', 'Carrinho', ShoppingCart)}
            {user ? link('/account', 'Minha conta', User) : link('/login', 'Entrar ou criar conta', User)}
            {isAdmin ? link('/admin/dashboard', 'Painel administrativo', LayoutDashboard) : null}
            {user ? (
              <li>
                <button type="button" className="menu-link menu-link--btn" onClick={() => { void signOut(); onClose(); }}>
                  <Icon as={LogOut} size={22} />Sair
                </button>
              </li>
            ) : null}
          </ul>
        </nav>
        <div className="menu-foot">
          <WhatsAppButton message={WA_MESSAGES.generic} label="Falar no WhatsApp" size="lg" block />
          <p className="menu-note"><Icon as={Clock} size={18} /><span>{STORE.hours.days}: {STORE.hours.time}</span></p>
          <p className="menu-note"><Icon as={MapPin} size={18} /><span>{STORE.address.city} - {STORE.address.uf}</span></p>
        </div>
      </div>
    </Drawer>
  );
}
