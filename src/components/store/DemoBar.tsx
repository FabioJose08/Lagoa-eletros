import { Info } from 'lucide-react';
import { Icon } from '@/components/icons';
import { useCatalog } from '@/hooks/useCatalog';

/** Só aparece enquanto houver produtos DEMO no catálogo. Some sozinha quando os dados demo forem removidos. */
export function DemoBar(): JSX.Element | null {
  const { hasDemo } = useCatalog();
  if (!hasDemo) return null;
  return (
    <div className="demo-bar" role="note">
      <div className="container demo-bar__inner">
        <Icon as={Info} size={18} />
        <p><strong>Versão de demonstração.</strong> Produtos e preços são exemplos.</p>
      </div>
    </div>
  );
}
