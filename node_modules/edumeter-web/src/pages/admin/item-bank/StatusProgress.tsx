import React from 'react';
import { Badge } from '../../../components/ui/Badge';
import { cn } from '../../../components/ui/utils';

const steps = [
  { key: 'draft', label: '등록' },
  { key: 'review', label: '검토' },
  { key: 'approved', label: '승인' },
  { key: 'published', label: '배포' }
];

const statusLabel: Record<string, string> = {
  draft: '초안',
  review: '검토',
  approved: '승인',
  published: '배포',
  retired: '폐기'
};

export interface StatusProgressProps {
  status?: string;
}

export const StatusProgress: React.FC<StatusProgressProps> = ({ status = 'draft' }) => {
  const activeIndex = steps.findIndex(step => step.key === status);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-text-primary">문항 상태 흐름</div>
        <Badge variant="outline">{statusLabel[status] ?? status}</Badge>
      </div>
      <div className="flex items-center gap-2">
        {steps.map((step, index) => {
          const isActive = index <= (activeIndex >= 0 ? activeIndex : 0);
          return (
            <div key={step.key} className="flex items-center gap-2">
              <div
                className={cn(
                  'h-2 w-16 rounded-full',
                  isActive ? 'bg-primary' : 'bg-slate-200'
                )}
              />
              <span className={cn('text-xs', isActive ? 'text-text-primary' : 'text-text-secondary')}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
