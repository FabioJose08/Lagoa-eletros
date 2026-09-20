import { WhatsAppIcon } from '@/components/icons';
import { Button, type ButtonProps } from '@/components/ui/button';
import { waLink } from '@/utils/whatsapp';

export interface WhatsAppButtonProps {
  message?: string;
  label: string;
  size?: ButtonProps['size'];
  block?: boolean;
  className?: string;
  ariaLabel?: string;
}

/** Botão verde do WhatsApp (abre a conversa com a mensagem pronta). O canal principal de venda da loja. */
export function WhatsAppButton({ message, label, size, block, className, ariaLabel }: WhatsAppButtonProps): JSX.Element {
  return (
    <Button asChild variant="whatsapp" size={size} block={block} className={className}>
      <a href={waLink(message)} target="_blank" rel="noopener noreferrer" aria-label={ariaLabel}>
        <WhatsAppIcon size={20} />
        <span>{label}</span>
      </a>
    </Button>
  );
}
