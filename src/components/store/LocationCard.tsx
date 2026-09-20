import { Clock, ExternalLink, MapPin, Navigation } from 'lucide-react';
import { Icon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { MAPS, STORE } from '@/lib/constants';

/**
 * Cartão de localização. Com MAPS.embedUrl preenchido (lib/constants.ts) mostra o mapa incorporado;
 * sem ele, mostra o painel que abre o mapa (Apple Maps + link do Google Maps).
 */
export function LocationCard({ withTitle = true }: { withTitle?: boolean }): JSX.Element {
  const a = STORE.address;
  return (
    <div className="loc">
      <div className="loc__info">
        {withTitle ? <h2 className="loc__title" id="loc-title">Visite nossa loja</h2> : null}
        <div className="loc__row">
          <span className="icon-wrap"><Icon as={MapPin} size={20} /></span>
          <address className="loc__addr"><strong>{STORE.name}</strong>{a.street}<br />{a.district}<br />{a.city} - {a.uf}<br />{a.cep}</address>
        </div>
        <div className="loc__row">
          <span className="icon-wrap"><Icon as={Clock} size={20} /></span>
          <div className="loc__hours"><strong>Horário</strong>{STORE.hours.days}<br />{STORE.hours.time}</div>
        </div>
        <div className="loc__actions">
          <Button asChild><a href={MAPS.apple} target="_blank" rel="noopener noreferrer"><Icon as={Navigation} size={18} />Como chegar</a></Button>
          <Button asChild variant="outline"><a href={MAPS.apple} target="_blank" rel="noopener noreferrer"><Icon as={MapPin} size={18} />Ver no mapa</a></Button>
        </div>
        <p className="loc__alt">Prefere o Google Maps? <a href={MAPS.google} target="_blank" rel="noopener noreferrer">Abrir no Google Maps</a></p>
      </div>
      {MAPS.embedUrl ? (
        <iframe className="loc__map" title="Mapa da Lagoa Eletros" src={MAPS.embedUrl} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
      ) : (
        <a className="loc__map" href={MAPS.apple} target="_blank" rel="noopener noreferrer" aria-label="Abrir a localização da Lagoa Eletros no mapa">
          <svg className="contours" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
            <path d="M40 150c10-60 80-100 160-96s150 50 160 110-60 102-150 104S30 210 40 150z" /><path d="M75 152c8-42 60-72 124-68s118 38 126 80-46 74-118 76S67 194 75 152z" />
            <path d="M110 152c6-26 42-46 90-44s88 26 94 54-34 50-88 52-102-30-96-62z" /><path d="M145 154c4-12 26-22 56-20s58 12 60 28-26 26-58 26-62-14-58-34z" />
            <path d="M-20 60c60 20 90 10 140-20s110-40 180-20" /><path d="M200 320c10-40 60-60 110-70s70-40 120-60" />
          </svg>
          <span className="loc__pin">
            <span className="loc__pin-dot"><Icon as={MapPin} size={28} /></span>
            <span className="loc__pin-city">{a.city} - {a.uf}</span>
            <span className="loc__pin-cta">Abrir no mapa<Icon as={ExternalLink} size={16} /></span>
          </span>
        </a>
      )}
    </div>
  );
}
