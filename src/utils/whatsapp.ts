import { STORE } from '@/lib/constants';

export function waLink(message?: string): string {
  const base = `https://wa.me/${STORE.whatsappNumber}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/** Link do WhatsApp para um número específico (usado pelo painel para chamar o cliente). */
export function waLinkTo(phone: string, message?: string): string {
  const digits = phone.replace(/\D/g, '');
  const full = digits.startsWith('55') ? digits : `55${digits}`;
  return message ? `https://wa.me/${full}?text=${encodeURIComponent(message)}` : `https://wa.me/${full}`;
}

/** Em produtos DEMO a mensagem avisa que é teste, para não confundir a loja. */
const demoSuffix = (demo?: boolean): string => (demo ? ' (Mensagem de teste do site: produto demonstrativo.)' : '');

export const WA_MESSAGES = {
  generic: 'Olá! Vim pelo site da Lagoa Eletros e gostaria de mais informações.',
  interest: (name: string, demo?: boolean): string =>
    `Olá! Tenho interesse no produto ${name} da Lagoa Eletros. Gostaria de saber disponibilidade e informações.${demoSuffix(demo)}`,
  availability: (name: string, demo?: boolean): string =>
    `Olá! Gostaria de consultar a disponibilidade do produto ${name} da Lagoa Eletros.${demoSuffix(demo)}`,
  order: (code: string, total: string): string =>
    `Olá! Acabei de fazer o pedido ${code} no site da Lagoa Eletros (total ${total}). Gostaria de combinar o pagamento e a entrega/retirada.`,
};
