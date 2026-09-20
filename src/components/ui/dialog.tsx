import { useEffect, useId, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Janela modal baseada no <dialog> nativo: o navegador prende o foco dentro dela, fecha com ESC
 * e deixa o resto da página inerte (acessibilidade sem biblioteca extra).
 */
export function Dialog({ open, onOpenChange, title, description, children, footer, size = 'md', className }: DialogProps): JSX.Element {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={cn('dialog', `dialog--${size}`, className)}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      onClose={() => onOpenChange(false)}
      onCancel={(e) => { e.preventDefault(); onOpenChange(false); }}
      onClick={(e) => { if (e.target === ref.current) onOpenChange(false); }}
    >
      {open ? (
        <div className="dialog__panel">
          <div className="dialog__head">
            <div>
              <h2 id={titleId} className="dialog__title">{title}</h2>
              {description ? <p id={descId} className="dialog__desc">{description}</p> : null}
            </div>
            <Button variant="ghost" size="icon" aria-label="Fechar" onClick={() => onOpenChange(false)}>
              <X size={20} aria-hidden="true" />
            </Button>
          </div>
          <div className="dialog__body">{children}</div>
          {footer ? <div className="dialog__foot">{footer}</div> : null}
        </div>
      ) : null}
    </dialog>
  );
}

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
}

/** Confirmação (ex.: "Excluir produto?"). O foco começa no botão Cancelar, o mais seguro. */
export function ConfirmDialog({
  open, onOpenChange, title, description, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', destructive, loading, onConfirm,
}: ConfirmDialogProps): JSX.Element {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <Button variant="outline" autoFocus onClick={() => onOpenChange(false)} disabled={loading}>{cancelLabel}</Button>
          <Button variant={destructive ? 'destructive' : 'default'} onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
        </>
      }
    />
  );
}
