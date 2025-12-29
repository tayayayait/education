import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';

export interface AnalyticsSummaryCardsProps {
  ingestFile: File | null;
  onFileChange: (file: File | null) => void;
  onIngest: () => void;
  itemId: string;
  onItemIdChange: (value: string) => void;
  detectionStatus: string;
  onDetectionStatusChange: (value: string) => void;
  onApplyFilters: () => void;
  detectionSummary: Record<string, number>;
}

export const AnalyticsSummaryCards: React.FC<AnalyticsSummaryCardsProps> = ({
  ingestFile,
  onFileChange,
  onIngest,
  itemId,
  onItemIdChange,
  detectionStatus,
  onDetectionStatusChange,
  onApplyFilters,
  detectionSummary
}) => {
  const chartData = Object.entries(detectionSummary).map(([type, count]) => ({
    type,
    count
  }));

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>데이터 적재</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-text-secondary">
            JSON 파일(ingest payload)을 업로드해 실데이터를 적재합니다.
          </p>
          <input type="file" accept=".json" onChange={(e) => onFileChange(e.target.files?.[0] ?? null)} />
          {ingestFile && <div className="text-xs text-text-secondary">선택: {ingestFile.name}</div>}
          <Button fullWidth onClick={onIngest} disabled={!ingestFile}>
            적재 실행
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>필터</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Input
            placeholder="Item ID (선택)"
            value={itemId}
            onChange={(e) => onItemIdChange(e.target.value)}
          />
          <Select value={detectionStatus} onChange={(e) => onDetectionStatusChange(e.target.value)}>
            <option value="">탐지 상태 전체</option>
            <option value="flagged">flagged</option>
            <option value="resolved">resolved</option>
          </Select>
          <Button fullWidth variant="secondary" onClick={onApplyFilters}>
            적용
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>탐지 요약</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <div className="text-sm text-text-secondary">탐지 결과가 없습니다.</div>
          ) : (
            <div className="h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <XAxis dataKey="type" tick={{ fontSize: 10 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                  <Tooltip cursor={{ fill: 'rgba(148,163,184,0.1)' }} />
                  <Bar dataKey="count" fill="rgb(var(--color-primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
