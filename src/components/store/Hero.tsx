import { Link } from 'react-router-dom';
import { STORE } from '@/lib/constants';
import { WA_MESSAGES } from '@/utils/whatsapp';
import { SearchBar } from './SearchBar';
import { WhatsAppButton } from './WhatsAppButton';

const QUICK = ['iPhone', 'Notebook', 'Monitor', 'Controle', 'Tablet'];

export function Hero(): JSX.Element {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <svg className="hero__circuit" viewBox="0 0 640 520" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" preserveAspectRatio="xMaxYMid slice" aria-hidden="true">
        <path d="M640 34H500l-36 36H380" /><circle cx="371" cy="70" r="6" /><path d="M640 104H566l-30 30H468" /><circle cx="459" cy="134" r="6" />
        <path d="M640 420H548l-30 30H430" /><circle cx="421" cy="450" r="6" /><path d="M640 486H592l-26 26H500" /><circle cx="491" cy="512" r="6" />
      </svg>
      <div className="container hero__inner">
        <div className="hero__copy">
          <h1 className="hero__title" id="hero-title" tabIndex={-1}>Seu próximo eletrônico está aqui.</h1>
          <p className="hero__lead">{STORE.tagline}</p>
          <div className="hero__cta">
            <WhatsAppButton message={WA_MESSAGES.generic} label="Falar no WhatsApp" size="lg" />
            <Link className="btn btn--ghost-dark btn--lg" to="/products">Ver produtos</Link>
          </div>
          <div className="hero__search">
            <SearchBar id="hh" variant="hero" />
            <div className="hero__try">
              <span>Experimente buscar por:</span>
              {QUICK.map((t) => <Link key={t} to={`/products?q=${encodeURIComponent(t)}`}>{t}</Link>)}
            </div>
          </div>
        </div>
        <div className="hero__brand">
          <img src="/brand/logo-mark.webp" width={500} height={278} alt="Lagoa Eletros: sol sobre a lagoa com circuitos eletrônicos" fetchPriority="high" />
        </div>
      </div>
      <div className="hero__wave" aria-hidden="true">
        <svg viewBox="0 0 1440 60" preserveAspectRatio="none" fill="currentColor"><path d="M0 60V30C170 8 330 4 510 20s370 36 550 24c140-9 270-26 380-32V60z" /></svg>
      </div>
    </section>
  );
}
