import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Icon } from '@/components/icons';

export interface Crumb {
  label: string;
  to?: string;
}

export function Breadcrumbs({ items }: { items: Crumb[] }): JSX.Element {
  return (
    <nav aria-label="Você está em">
      <ol className="crumbs">
        {items.map((it, i) =>
          i === items.length - 1 || !it.to ? (
            <li key={i}><span aria-current="page">{it.label}</span></li>
          ) : (
            <li key={i}>
              <Link to={it.to}>{it.label}</Link>
              <Icon as={ChevronRight} size={14} />
            </li>
          ),
        )}
      </ol>
    </nav>
  );
}
