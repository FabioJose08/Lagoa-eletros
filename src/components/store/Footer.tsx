import { Link } from 'react-router-dom';
import { WhatsAppIcon } from '@/components/icons';
import { MAPS, STORE } from '@/lib/constants';
import { useCatalog } from '@/hooks/useCatalog';
import { waLink, WA_MESSAGES } from '@/utils/whatsapp';
import { NAV_LINKS } from './Header';

export function Footer(): JSX.Element {
  const { hasDemo } = useCatalog();
  const a = STORE.address;
  return (
    <footer className="footer">
      <div className="container footer__grid">
        <div>
          <img className="footer__logo" src="/brand/logo-full.webp" width={190} height={151} alt="Lagoa Eletros" loading="lazy" />
          <p className="footer__tag">{STORE.tagline}</p>
        </div>
        <nav aria-label="Rodapé">
          <h2 className="footer__h">Navegação</h2>
          <ul className="footer__list">
            {NAV_LINKS.map((n) => <li key={n.to}><Link to={n.to}>{n.label}</Link></li>)}
          </ul>
        </nav>
        <div>
          <h2 className="footer__h">Atendimento</h2>
          <div className="footer__text">
            <a className="footer__wa" href={waLink(WA_MESSAGES.generic)} target="_blank" rel="noopener noreferrer">
              <WhatsAppIcon size={20} />{STORE.whatsappDisplay}
            </a>
            <p>{STORE.hours.days}<br />{STORE.hours.time}</p>
          </div>
        </div>
        <div>
          <h2 className="footer__h">Localização</h2>
          <div className="footer__text">
            <address>{a.street}<br />{a.district}<br />{a.city} - {a.uf}<br />{a.cep}</address>
            <a href={MAPS.apple} target="_blank" rel="noopener noreferrer">Ver no mapa</a>
          </div>
        </div>
      </div>
      <div className="footer__rule">
        <div className="container footer__bottom">
          <span>© {new Date().getFullYear()} {STORE.name}. Todos os direitos reservados.</span>
          {hasDemo ? <span>Versão de demonstração: produtos e preços são exemplos.</span> : null}
        </div>
      </div>
    </footer>
  );
}
