import React, { useMemo } from 'react';
import { GenerationRun, PromptTemplate } from './types';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/Table';

const statusVariant: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  running: 'warning',
  generated: 'success',
  failed: 'danger'
};

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('ko-KR');
};

const getRunCount = (run: GenerationRun) => {
  const params = run.parameters ?? {};
  const count = (params as Record<string, unknown>).count;
  return typeof count === 'number' ? count : null;
};

export interface RunHistoryTableProps {
  runs: GenerationRun[];
  templates: PromptTemplate[];
  onRetry: (run: GenerationRun) => void;
  onOpenLog: (run: GenerationRun) => void;
}

export const RunHistoryTable: React.FC<RunHistoryTableProps> = ({ runs, templates, onRetry, onOpenLog }) => {
  const templateMap = useMemo(() => new Map(templates.map(template => [template.id, template])), [templates]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>최근 실행 이력</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-auto border border-border rounded-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>시간</TableHead>
                <TableHead>템플릿</TableHead>
                <TableHead>모델</TableHead>
                <TableHead>상태</TableHead>
                <TableHead className="text-right">작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runs.map(run => {
                const template = templateMap.get(run.prompt_template_id);
                const count = getRunCount(run);

                return (
                  <TableRow key={run.id}>
                    <TableCell className="text-xs text-text-secondary">{formatDate(run.created_at)}</TableCell>
                    <TableCell>
                      {template ? `${template.code} v${template.version}` : run.prompt_template_id}
                      {typeof count === 'number' && <span className="ml-2 text-xs text-text-secondary">{count}문항</span>}
                    </TableCell>
                    <TableCell className="text-xs text-text-secondary">{run.model_name ?? '-'}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[run.status] ?? 'default'}>{run.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="secondary" size="sm" onClick={() => onOpenLog(run)}>
                          로그
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => onRetry(run)} disabled={run.status === 'running'}>
                          재시도
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {runs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-text-secondary py-6">
                    실행 이력이 없습니다.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
