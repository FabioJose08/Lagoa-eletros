import { Link } from 'react-router-dom';
import { EmptyState } from '@/components/common/PageState';
import { Button } from '@/components/ui/button';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';

export function NotFoundPage(): JSX.Element {
  useDocumentMeta({ title: 'Página não encontrada', noindex: true });
  return (
    <div className="container section">
      <EmptyState
        title="Página não encontrada."
        text="O endereço pode ter mudado. Volte para o início ou veja os produtos."
        actions={
          <>
            <Button asChild><Link to="/">Ir para o início</Link></Button>
            <Button asChild variant="outline"><Link to="/products">Ver produtos</Link></Button>
          </>
        }
      />
    </div>
  );
}
