import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { CircleAlert, Search } from 'lucide-react';
import { Icon } from '@/components/icons';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  text?: string;
  actions?: ReactNode;
  error?: boolean;
}

/** Estado vazio / erro (mesmo visual do projeto original). */
export function EmptyState({ icon = Search, title, text, actions, error }: EmptyStateProps): JSX.Element {
  return (
    <div className={`state${error ? ' state--error' : ''}`}>
      <span className="state__icon"><Icon as={error ? CircleAlert : icon} size={28} /></span>
      <h2 className="state__title">{title}</h2>
      {text ? <p className="state__text">{text}</p> : null}
      {actions ? <div className="state__actions">{actions}</div> : null}
    </div>
  );
}

/** Esqueleto de cards enquanto o catálogo carrega. */
export function LoadingGrid({ count = 8 }: { count?: number }): JSX.Element {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">Carregando produtos…</span>
      <div className="product-grid" aria-hidden="true">
        {Array.from({ length: count }, (_, i) => (
          <div className="skeleton" key={i}>
            <div className="skeleton__img" />
            <div className="skeleton__line" />
            <div className="skeleton__line skeleton__line--short" />
            <div className="skeleton__line skeleton__line--btn" />
          </div>
        ))}
      </div>
    </div>
  );
}
