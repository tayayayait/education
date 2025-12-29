import React from 'react';
import { cn } from './utils';

export interface TableContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  stickyHeader?: boolean;
  stackOnMobile?: boolean;
}

export const TableContainer = React.forwardRef<HTMLDivElement, TableContainerProps>(
  ({ className, stickyHeader, stackOnMobile, ...props }, ref) => (
    <div
      ref={ref}
      data-table-sticky={stickyHeader ? 'true' : undefined}
      data-table-stack={stackOnMobile ? 'true' : undefined}
      className={cn('w-full overflow-x-auto', className)}
      {...props}
    />
  )
);
TableContainer.displayName = 'TableContainer';

export const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <table ref={ref} className={cn('w-full caption-bottom text-sm', className)} {...props} />
  )
);
Table.displayName = 'Table';

export const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <thead ref={ref} className={cn('bg-slate-50 text-text-secondary', className)} {...props} />
  )
);
TableHeader.displayName = 'TableHeader';

export const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tbody ref={ref} className={cn('[&_tr:last-child]:border-0', className)} {...props} />
  )
);
TableBody.displayName = 'TableBody';

export const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn('border-b border-border transition-colors hover:bg-slate-50', className)}
      {...props}
    />
  )
);
TableRow.displayName = 'TableRow';

export const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={cn('h-11 px-3 text-left text-xs font-semibold text-text-secondary', className)}
      {...props}
    />
  )
);
TableHead.displayName = 'TableHead';

export interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  dataLabel?: string;
}

export const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className, dataLabel, ...props }, ref) => (
    <td
      ref={ref}
      data-label={dataLabel}
      className={cn('px-3 py-2 text-sm text-text-primary', className)}
      {...props}
    />
  )
);
TableCell.displayName = 'TableCell';

export const TableCaption = React.forwardRef<HTMLTableCaptionElement, React.HTMLAttributes<HTMLTableCaptionElement>>(
  ({ className, ...props }, ref) => (
    <caption ref={ref} className={cn('mt-4 text-sm text-text-secondary', className)} {...props} />
  )
);
TableCaption.displayName = 'TableCaption';
