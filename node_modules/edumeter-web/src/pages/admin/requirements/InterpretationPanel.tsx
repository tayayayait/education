import React from 'react';
import { Interpretation } from './types';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';

export interface InterpretationPanelProps {
  disabled: boolean;
  items: Interpretation[];
  form: { rawText: string; acceptanceCriteria: string; rationale: string };
  onFormChange: (next: { rawText: string; acceptanceCriteria: string; rationale: string }) => void;
  onSubmit: (event: React.FormEvent) => void;
  formatDate: (value?: string | null) => string;
}

export const InterpretationPanel: React.FC<InterpretationPanelProps> = ({
  disabled,
  items,
  form,
  onFormChange,
  onSubmit,
  formatDate
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>해석/정제 로그</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {disabled ? (
          <div className="text-sm text-text-secondary">요구사항을 선택하세요.</div>
        ) : (
          <>
            <form className="space-y-2" onSubmit={onSubmit}>
              <Textarea
                rows={2}
                placeholder="원문"
                value={form.rawText}
                onChange={(e) => onFormChange({ ...form, rawText: e.target.value })}
              />
              <Textarea
                rows={2}
                placeholder="Acceptance Criteria"
                value={form.acceptanceCriteria}
                onChange={(e) => onFormChange({ ...form, acceptanceCriteria: e.target.value })}
              />
              <Input
                placeholder="근거/비고"
                value={form.rationale}
                onChange={(e) => onFormChange({ ...form, rationale: e.target.value })}
              />
              <Button type="submit" fullWidth>
                해석 등록
              </Button>
            </form>
            <div className="space-y-2 text-xs">
              {items.map(item => (
                <div key={item.id} className="border border-border rounded-sm p-2">
                  <div className="font-semibold text-text-primary">{item.acceptance_criteria}</div>
                  {item.raw_text && <div className="text-text-secondary">원문: {item.raw_text}</div>}
                  {item.rationale && <div className="text-text-secondary">근거: {item.rationale}</div>}
                  <div className="text-text-secondary">{formatDate(item.created_at)}</div>
                </div>
              ))}
              {items.length === 0 && <div className="text-text-secondary">등록된 해석이 없습니다.</div>}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
