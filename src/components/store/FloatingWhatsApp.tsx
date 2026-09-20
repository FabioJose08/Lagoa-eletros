import { WhatsAppIcon } from '@/components/icons';
import { waLink, WA_MESSAGES } from '@/utils/whatsapp';

/** Botão flutuante do WhatsApp. Nome acessível fixo; o rótulo visual só aparece com mouse/teclado. */
export function FloatingWhatsApp(): JSX.Element {
  return (
    <a id="fab-whatsapp" className="fab" href={waLink(WA_MESSAGES.generic)} target="_blank" rel="noopener noreferrer" aria-label="Falar no WhatsApp">
      <WhatsAppIcon size={28} />
      <span className="fab__label" aria-hidden="true">Falar no WhatsApp</span>
    </a>
  );
}
