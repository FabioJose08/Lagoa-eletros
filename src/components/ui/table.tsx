import * as React from 'react';
import { cn } from '@/lib/utils';

/** A tabela rola na horizontal dentro do próprio quadro (a página nunca ganha barra de rolagem lateral). */
const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(({ className, ...props }, ref) => (
  <div className="data-table__wrap">
    <table ref={ref} className={cn('data-table', className)} {...props} />
  </div>
));
Table.displayName = 'Table';

const TableHeader = (props: React.HTMLAttributes<HTMLTableSectionElement>): JSX.Element => <thead {...props} />;
const TableBody = (props: React.HTMLAttributes<HTMLTableSectionElement>): JSX.Element => <tbody {...props} />;
const TableRow = ({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>): JSX.Element => <tr className={className} {...props} />;
const TableHead = ({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>): JSX.Element => (
  <th scope="col" className={className} {...props} />
);
const TableCell = ({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>): JSX.Element => <td className={className} {...props} />;

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell };
