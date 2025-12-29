import React from 'react';
import { ChangeRequest } from './types';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { Select } from '../../../components/ui/Select';

export interface ChangeRequestPanelProps {
  disabled: boolean;
  items: ChangeRequest[];
  form: { title: string; description: string; impactSummary: string };
  onFormChange: (next: { title: string; description: string; impactSummary: string }) => void;
  onSubmit: (event: React.FormEvent) => void;
  onStatusChange: (id: string, status: ChangeRequest['status']) => void;
  formatDate: (value?: string | null) => string;
}

export const ChangeRequestPanel: React.FC<ChangeRequestPanelProps> = ({
  disabled,
  items,
  form,
  onFormChange,
  onSubmit,
  onStatusChange,
  formatDate
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>변경관리</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {disabled ? (
          <div className="text-sm text-text-secondary">요구사항을 선택하세요.</div>
        ) : (
          <>
            <form className="space-y-2" onSubmit={onSubmit}>
              <Input
                placeholder="변경요청 제목"
                value={form.title}
                onChange={(e) => onFormChange({ ...form, title: e.target.value })}
              />
              <Textarea
                rows={2}
                placeholder="변경 내용"
                value={form.description}
                onChange={(e) => onFormChange({ ...form, description: e.target.value })}
              />
              <Input
                placeholder="영향도 요약"
                value={form.impactSummary}
                onChange={(e) => onFormChange({ ...form, impactSummary: e.target.value })}
              />
              <Button type="submit" fullWidth>변경요청 등록</Button>
            </form>
            <div className="space-y-2 text-xs">
              {items.map(item => (
                <div key={item.id} className="border border-border rounded-sm p-2 space-y-1">
                  <div className="font-semibold text-text-primary">{item.title}</div>
                  {item.description && <div className="text-text-secondary">설명: {item.description}</div>}
                  {item.impact_summary && <div className="text-text-secondary">영향도: {item.impact_summary}</div>}
                  <div className="flex items-center gap-2">
                    <Select
                      value={item.status}
                      onChange={(e) => onStatusChange(item.id, e.target.value as ChangeRequest['status'])}
                    >
                      <option value="requested">요청</option>
                      <option value="approved">승인</option>
                      <option value="rejected">반려</option>
                      <option value="implemented">반영</option>
                    </Select>
                    <span className="text-text-secondary">{formatDate(item.requested_at)}</span>
                  </div>
                </div>
              ))}
              {items.length === 0 && <div className="text-text-secondary">변경요청이 없습니다.</div>}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
