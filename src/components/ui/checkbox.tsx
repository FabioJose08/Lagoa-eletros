import * as React from 'react';
import { cn } from '@/lib/utils';

/** Caixa de seleção nativa (acessibilidade e teclado de graça), no visual do design system. */
const Checkbox = React.forwardRef<HTMLInputElement, Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'>>(
  ({ className, ...props }, ref) => <input ref={ref} type="checkbox" className={cn('checkbox', className)} {...props} />,
);
Checkbox.displayName = 'Checkbox';

export { Checkbox };
