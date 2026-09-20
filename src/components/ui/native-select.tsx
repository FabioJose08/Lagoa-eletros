import * as React from 'react';
import { cn } from '@/lib/utils';

const NativeSelect = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => <select ref={ref} className={cn('select select--full', className)} {...props} />,
);
NativeSelect.displayName = 'NativeSelect';

export { NativeSelect };
