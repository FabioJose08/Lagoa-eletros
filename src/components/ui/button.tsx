import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/* shadcn/ui adaptado: as variantes usam as classes do design system da Lagoa (.btn), que já
   consomem os tokens (--btn-h, --c-primary...). Assim o visual continua exatamente o mesmo. */
const buttonVariants = cva('btn', {
  variants: {
    variant: {
      default: 'btn--primary',
      whatsapp: 'btn--whatsapp',
      outline: 'btn--outline',
      ghost: 'btn--text',
      'ghost-dark': 'btn--ghost-dark',
      destructive: 'btn--danger',
    },
    size: { default: '', sm: 'btn--sm', lg: 'btn--lg', icon: 'btn--icon' },
    block: { true: 'btn--block', false: '' },
  },
  defaultVariants: { variant: 'default', size: 'default', block: false },
});

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, block, asChild = false, loading = false, disabled, children, type, ...props }, ref) => {
    const classes = cn(buttonVariants({ variant, size, block }), loading && 'is-loading', className);
    if (asChild) {
      return (
        <Slot ref={ref} className={classes} {...props}>
          {children}
        </Slot>
      );
    }
    return (
      <button ref={ref} type={type ?? 'button'} className={classes} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
        {loading ? <Loader2 size={18} className="icon spin" aria-hidden="true" /> : null}
        {children}
      </button>
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
