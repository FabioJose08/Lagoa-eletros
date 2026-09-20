import type { ReactNode } from 'react';
import { CircleAlert } from 'lucide-react';
import { Icon } from '@/components/icons';
import { Label } from '@/components/ui/label';

/** Atributos de acessibilidade para ligar o campo à mensagem de erro/dica. */
export function fieldA11y(id: string, error?: string, hint?: string | boolean): { id: string; 'aria-invalid': boolean; 'aria-describedby'?: string } {
  return {
    id,
    'aria-invalid': Boolean(error),
    'aria-describedby': error ? `${id}-error` : hint ? `${id}-hint` : undefined,
  };
}

export interface FormFieldProps {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  className?: string;
  children: ReactNode;
}

/** Rótulo + campo + dica + mensagem de erro logo abaixo do campo. */
export function FormField({ id, label, error, hint, optional, className, children }: FormFieldProps): JSX.Element {
  return (
    <div className={`form-field ${className ?? ''}`}>
      <Label htmlFor={id}>
        {label}
        {optional ? <span className="label__opt"> (opcional)</span> : null}
      </Label>
      {children}
      {hint && !error ? <p id={`${id}-hint`} className="form-hint">{hint}</p> : null}
      {error ? (
        <p id={`${id}-error`} className="form-error" role="alert">
          <Icon as={CircleAlert} size={16} />
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
}

export function FormAlert({ tone = 'error', children }: { tone?: 'error' | 'info' | 'success'; children: ReactNode }): JSX.Element {
  return (
    <div className={`form-alert form-alert--${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      <Icon as={CircleAlert} size={18} />
      <div>{children}</div>
    </div>
  );
}
