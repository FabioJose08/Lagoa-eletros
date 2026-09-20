import { ChevronRight, type LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Icon } from '@/components/icons';

export interface SectionTitleProps {
  id: string;
  title: string;
  lead?: string;
  moreTo?: string;
  moreLabel?: string;
  mark?: LucideIcon;
}

export function SectionTitle({ id, title, lead, moreTo, moreLabel = 'Ver todos', mark }: SectionTitleProps): JSX.Element {
  return (
    <div className="section-head">
      <div className="section-head__text">
        <div className="section-title__row">
          {mark ? <span className="title-mark"><Icon as={mark} size={20} /></span> : null}
          <h2 className="section-title" id={id}>{title}</h2>
        </div>
        {lead ? <p className="section-lead">{lead}</p> : null}
      </div>
      {moreTo ? (
        <Link className="link-more" to={moreTo}>{moreLabel}<Icon as={ChevronRight} size={18} /></Link>
      ) : null}
    </div>
  );
}
