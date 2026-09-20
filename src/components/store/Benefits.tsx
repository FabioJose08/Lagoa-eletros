import { RefreshCw, Settings, Sparkles, Store, type LucideIcon } from 'lucide-react';
import { Icon, WhatsAppIcon } from '@/components/icons';

const ITEMS: Array<{ icon: LucideIcon | 'whatsapp'; title: string; text: string }> = [
  { icon: Sparkles, title: 'Novos e usados', text: 'Encontre equipamentos novos e usados no mesmo lugar.' },
  { icon: RefreshCw, title: 'Produtos recondicionados', text: 'Uma opção para quem quer economizar.' },
  { icon: Settings, title: 'Peças e acessórios', text: 'Peças, acessórios e itens para informática e games.' },
  { icon: 'whatsapp', title: 'Atendimento pelo WhatsApp', text: 'Tire dúvidas e consulte a disponibilidade direto na conversa.' },
  { icon: Store, title: 'Loja física em Lagoa do Carro', text: 'Venha ver os produtos pessoalmente.' },
];

/** Benefícios baseados SOMENTE nas informações reais fornecidas pela loja. */
export function Benefits(): JSX.Element {
  return (
    <ul className="benefits">
      {ITEMS.map((b) => (
        <li className="benefit" key={b.title}>
          <span className="benefit__icon">{b.icon === 'whatsapp' ? <WhatsAppIcon size={22} /> : <Icon as={b.icon} size={22} />}</span>
          <div>
            <h3 className="benefit__title">{b.title}</h3>
            <p className="benefit__text">{b.text}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
