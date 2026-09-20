import { useEffect, useState } from 'react';
import { Heart, LayoutDashboard, Menu, Search, ShoppingCart, User } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import { Icon } from '@/components/icons';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { useFavorites } from '@/hooks/useFavorites';
import { WA_MESSAGES } from '@/utils/whatsapp';
import { MobileMenu } from './MobileMenu';
import { SearchBar } from './SearchBar';
import { WhatsAppButton } from './WhatsAppButton';

export const NAV_LINKS = [
  { label: 'Início', to: '/', end: true },
  { label: 'Produtos', to: '/products', end: false },
  { label: 'Categorias', to: '/categories', end: false },
  { label: 'Ofertas', to: '/offers', end: false },
  { label: 'Sobre', to: '/about', end: false },
  { label: 'Localização', to: '/location', end: false },
] as const;

export function Header(): JSX.Element {
  const { count } = useCart();
  const { ids } = useFavorites();
  const { user, isAdmin } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = (): void => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!searchOpen) return;
    const onKey = (e: KeyboardEvent): void => { if (e.key === 'Escape') setSearchOpen(false); };
    const onDown = (e: MouseEvent): void => {
      const t = e.target as Element;
      if (!t.closest('#search-panel') && !t.closest('[data-search-toggle]')) setSearchOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onDown); };
  }, [searchOpen]);

  return (
    <header className="header" style={{ boxShadow: scrolled ? '0 6px 20px -10px rgba(0,0,0,.7)' : 'none' }}>
      <div className="container header__inner">
        <Link className="header__logo" to="/">
          <img src="/brand/logo-mark-sm.webp" width={94} height={52} alt="Lagoa Eletros" />
        </Link>
        <nav className="header__nav" aria-label="Principal">
          {NAV_LINKS.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className="nav-link">{n.label}</NavLink>
          ))}
        </nav>
        <div className="header__actions">
          <button type="button" className="icon-btn" data-search-toggle aria-expanded={searchOpen} aria-controls="search-panel" aria-label="Buscar produtos" onClick={() => setSearchOpen((v) => !v)}>
            <Icon as={Search} size={22} />
          </button>
          <Link className="icon-btn header__hide-sm" to="/favorites" aria-label={ids.length ? `Favoritos (${ids.length})` : 'Favoritos'}>
            <Icon as={Heart} size={22} />
            {ids.length > 0 ? <span className="count">{ids.length}</span> : null}
          </Link>
          <Link className="icon-btn" to="/cart" aria-label={count ? `Carrinho (${count} ${count === 1 ? 'item' : 'itens'})` : 'Carrinho'}>
            <Icon as={ShoppingCart} size={22} />
            {count > 0 ? <span className="count">{count}</span> : null}
          </Link>
          <Link className="icon-btn header__hide-sm" to={user ? '/account' : '/login'} aria-label={user ? 'Minha conta' : 'Entrar'}>
            <Icon as={User} size={22} />
          </Link>
          {isAdmin ? (
            <Link className="icon-btn header__admin" to="/admin/dashboard" aria-label="Painel administrativo">
              <Icon as={LayoutDashboard} size={22} />
            </Link>
          ) : null}
          <WhatsAppButton message={WA_MESSAGES.generic} label="WhatsApp" className="header__wa" />
          <button type="button" className="icon-btn header__menu-btn" aria-haspopup="dialog" aria-label="Abrir menu" onClick={() => setMenuOpen(true)}>
            <Icon as={Menu} size={24} />
          </button>
        </div>
      </div>
      <div id="search-panel" className="search-panel" hidden={!searchOpen}>
        <div className="container">
          {searchOpen ? <SearchBar id="hs" variant="panel" autoFocus onDone={() => setSearchOpen(false)} /> : null}
        </div>
      </div>
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </header>
  );
}
