import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SwitchProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

/** Interruptor acessível (role="switch"), operável por teclado (Espaço/Enter). */
const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(({ checked, onCheckedChange, className, ...props }, ref) => (
  <button
    ref={ref}
    type="button"
    role="switch"
    aria-checked={checked}
    data-state={checked ? 'checked' : 'unchecked'}
    className={cn('switch', className)}
    onClick={() => onCheckedChange(!checked)}
    {...props}
  >
    <span className="switch__thumb" />
  </button>
));
Switch.displayName = 'Switch';

export { Switch };
