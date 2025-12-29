import React from 'react';
import { AnalysisRun } from './types';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';

export interface RunTimelineProps {
  runs: AnalysisRun[];
  formatDate: (value?: string | null) => string;
  truncateJson: (value?: Record<string, unknown> | null) => string;
}

export const RunTimeline: React.FC<RunTimelineProps> = ({ runs, formatDate, truncateJson }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>분석 실행 이력</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {runs.length === 0 && (
            <div className="text-sm text-text-secondary">분석 이력이 없습니다.</div>
          )}
          {runs.map((run) => (
            <div key={run.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="h-3 w-3 rounded-full bg-primary" />
                <div className="flex-1 w-px bg-slate-200" />
              </div>
              <div className="flex-1 border border-border rounded-sm p-3">
                <div className="flex items-center gap-2">
                  <Badge variant="primary">{run.run_type}</Badge>
                  <span className="text-xs text-text-secondary">{formatDate(run.created_at)}</span>
                </div>
                <div className="mt-2 text-xs text-text-secondary">
                  파라미터: {truncateJson(run.params)}
                </div>
                <div className="mt-1 text-xs text-text-secondary">
                  범위: {truncateJson(run.data_range)}
                </div>
                <div className="mt-1 text-xs text-text-secondary">
                  Hash: {run.dataset_hash ?? '-'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
