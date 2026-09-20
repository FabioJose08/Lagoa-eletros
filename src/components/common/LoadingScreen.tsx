import { Loader2 } from 'lucide-react';

export function LoadingScreen({ label = 'Carregando…' }: { label?: string }): JSX.Element {
  return (
    <div className="page-loader" role="status" aria-live="polite">
      <Loader2 size={32} className="icon spin" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
