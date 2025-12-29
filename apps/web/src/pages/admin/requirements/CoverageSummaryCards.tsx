import React from 'react';
import { CoverageSummary } from './types';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';

const formatPercent = (value: number) => `${Math.round(value)}%`;

export interface CoverageSummaryCardsProps {
  summary: CoverageSummary | null;
  noncompliantCount: number;
  onRefresh: () => void;
}

export const CoverageSummaryCards: React.FC<CoverageSummaryCardsProps> = ({ summary, noncompliantCount, onRefresh }) => {
  const total = summary?.total ?? 0;
  const designRate = total ? (summary?.with_design ?? 0) / total * 100 : 0;
  const testRate = total ? (summary?.with_test ?? 0) / total * 100 : 0;
  const passRate = total ? (summary?.with_pass ?? 0) / total * 100 : 0;

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <CardTitle>커버리지 요약</CardTitle>
        <Button variant="secondary" onClick={onRefresh}>새로고침</Button>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-4">
        <div className="rounded-sm border border-border bg-card p-4">
          <div className="text-xs text-text-secondary">총 요구사항</div>
          <div className="text-2xl font-bold text-text-primary mt-1">{total}</div>
        </div>
        <div className="rounded-sm border border-border bg-card p-4">
          <div className="text-xs text-text-secondary">설계 연결</div>
          <div className="text-2xl font-bold text-text-primary mt-1">{summary?.with_design ?? 0}</div>
          <div className="text-xs text-text-secondary">{formatPercent(designRate)}</div>
        </div>
        <div className="rounded-sm border border-border bg-card p-4">
          <div className="text-xs text-text-secondary">테스트 연결</div>
          <div className="text-2xl font-bold text-text-primary mt-1">{summary?.with_test ?? 0}</div>
          <div className="text-xs text-text-secondary">{formatPercent(testRate)}</div>
        </div>
        <div className="rounded-sm border border-border bg-card p-4">
          <div className="text-xs text-text-secondary">PASS 연결</div>
          <div className="text-2xl font-bold text-text-primary mt-1">{summary?.with_pass ?? 0}</div>
          <div className="text-xs text-text-secondary">{formatPercent(passRate)} · 미준수 {noncompliantCount}건</div>
        </div>
      </CardContent>
    </Card>
  );
};
