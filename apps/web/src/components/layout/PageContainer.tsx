import React from 'react';
import { cn } from '../ui/utils';

export interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {}

export const PageContainer = React.forwardRef<HTMLDivElement, PageContainerProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('mx-auto w-full max-w-[1200px] px-6', className)}
      {...props}
    />
  )
);

PageContainer.displayName = 'PageContainer';
