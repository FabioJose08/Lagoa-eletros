import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { Icon } from '@/components/icons';
import { CtaBand } from '@/components/store/CtaBand';
import { LocationCard } from '@/components/store/LocationCard';
import { WhatsAppButton } from '@/components/store/WhatsAppButton';
import { Button } from '@/components/ui/button';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { STORE } from '@/lib/constants';
import { WA_MESSAGES } from '@/utils/whatsapp';

const OFFER = ['Produtos novos', 'Produtos usados', 'Produtos recondicionados', 'Peças e acessórios', 'Informática, eletrônicos e games'];

export function AboutPage(): JSX.Element {
  useDocumentMeta({ title: 'Sobre a loja', description: 'Conheça a Lagoa Eletros, loja de eletrônicos, informática, acessórios e peças em Lagoa do Carro - PE.' });
  return (
    <>
      <div className="container page-head"><Breadcrumbs items={[{ label: 'Início', to: '/' }, { label: 'Sobre' }]} /></div>
      <div className="container section section--tight">
        <div className="about">
          <div className="about__text">
            <h1 className="page-title" tabIndex={-1}>Sobre a Lagoa Eletros</h1>
            <p>A Lagoa Eletros é uma loja localizada em Lagoa do Carro, Pernambuco, especializada em produtos eletrônicos, informática, acessórios, peças e equipamentos novos, usados e recondicionados.</p>
            <p>Aqui você encontra:</p>
            <ul className="about__list">{OFFER.map((t) => <li key={t}><Icon as={Check} size={18} /><span>{t}</span></li>)}</ul>
            <div className="about__cta">
              <WhatsAppButton message={WA_MESSAGES.generic} label="Falar no WhatsApp" size="lg" />
              <Button asChild variant="outline" size="lg"><Link to="/location">Como chegar</Link></Button>
            </div>
          </div>
          <div className="about__logo">
            <img src="/brand/logo-full.webp" width={420} height={335} alt={`Logo da ${STORE.name}: ${STORE.tagline}`} />
          </div>
        </div>
      </div>
    </>
  );
}

export function LocationPage(): JSX.Element {
  useDocumentMeta({ title: 'Como chegar', description: 'Endereço, horário e mapa da Lagoa Eletros em Lagoa do Carro - PE.' });
  return (
    <>
      <div className="container page-head">
        <Breadcrumbs items={[{ label: 'Início', to: '/' }, { label: 'Localização' }]} />
        <h1 className="page-title" tabIndex={-1}>Visite nossa loja</h1>
        <p className="page-lead">Antes de vir, você pode consultar a disponibilidade dos produtos pelo WhatsApp.</p>
      </div>
      <div className="container section section--tight">
        <LocationCard withTitle={false} />
        <div style={{ marginTop: 24 }}><CtaBand /></div>
      </div>
    </>
  );
}
