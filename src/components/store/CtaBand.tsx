import { WA_MESSAGES } from '@/utils/whatsapp';
import { WhatsAppButton } from './WhatsAppButton';

export function CtaBand(): JSX.Element {
  return (
    <div className="cta-band">
      <div>
        <h2 className="cta-band__title">Não encontrou o que procura?</h2>
        <p className="cta-band__text">Chame a gente no WhatsApp e pergunte. Também dá para consultar a disponibilidade de qualquer produto do site.</p>
      </div>
      <WhatsAppButton message={WA_MESSAGES.generic} label="Falar no WhatsApp" size="lg" />
    </div>
  );
}
