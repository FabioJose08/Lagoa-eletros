import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva('badge', {
  variants: {
    variant: {
      novo: 'badge--novo',
      usado: 'badge--usado',
      recondicionado: 'badge--recondicionado',
      oferta: 'badge--oferta',
      estoque: 'badge--estoque',
      neutral: 'badge--neutral',
      success: 'badge--success',
      warning: 'badge--warning',
      danger: 'badge--danger',
      info: 'badge--info',
    },
  },
  defaultVariants: { variant: 'neutral' },
});

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps): JSX.Element {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
