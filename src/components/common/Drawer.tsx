import { useEffect, useRef, type ReactNode } from 'react';

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  /** side = menu lateral | sheet = folha que sobe de baixo (filtros no celular). */
  variant?: 'side' | 'sheet';
  label: string;
  children: ReactNode;
}

const prefersReducedMotion = (): boolean => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Gaveta acessível baseada em <dialog>: foco preso, ESC fecha, clique fora fecha, página de fundo inerte. */
export function Drawer({ open, onClose, variant = 'side', label, children }: DrawerProps): JSX.Element {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open) {
      if (!el.open) el.showModal();
      let raf2 = 0;
      const raf1 = requestAnimationFrame(() => { raf2 = requestAnimationFrame(() => el.classList.add('is-open')); });
      return () => { cancelAnimationFrame(raf1); cancelAnimationFrame(raf2); };
    }
    el.classList.remove('is-open');
    if (el.open) {
      const t = window.setTimeout(() => el.close(), prefersReducedMotion() ? 0 : 300);
      return () => window.clearTimeout(t);
    }
    return undefined;
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={`drawer drawer--${variant}`}
      aria-label={label}
      onCancel={(e) => { e.preventDefault(); onClose(); }}
      onClick={(e) => { if (e.target === ref.current) onClose(); }}
      onClose={() => { ref.current?.classList.remove('is-open'); }}
    >
      {children}
    </dialog>
  );
}
