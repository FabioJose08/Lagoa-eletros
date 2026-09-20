import type { LucideIcon } from 'lucide-react';
import { Icon } from '@/components/icons';

export interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  hint?: string;
  alert?: boolean;
}

export function StatCard({ label, value, icon, hint, alert }: StatCardProps): JSX.Element {
  return (
    <div className={`stat-card${alert ? ' stat-card--alert' : ''}`}>
      <span className="stat-card__label"><Icon as={icon} size={18} />{label}</span>
      <span className="stat-card__value">{value}</span>
      {hint ? <span className="stat-card__hint">{hint}</span> : null}
    </div>
  );
}
