import React from 'react';
import { ItemFormState } from './types';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { Select } from '../../../components/ui/Select';
import { StatusProgress } from './StatusProgress';

export interface ItemFormPanelProps {
  form: ItemFormState;
  onChange: (next: ItemFormState) => void;
  onSubmit: (event: React.FormEvent) => void;
  onReset: () => void;
  isEditing: boolean;
}

export const ItemFormPanel: React.FC<ItemFormPanelProps> = ({
  form,
  onChange,
  onSubmit,
  onReset,
  isEditing
}) => {
  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between">
          <CardTitle>문항 {isEditing ? '수정' : '등록'}</CardTitle>
        </div>
        <StatusProgress status={form.status} />
      </CardHeader>
      <CardContent>
        <form className="space-y-3" onSubmit={onSubmit}>
          <Input
            placeholder="문항 코드 (자동 생성 예정)"
            value={form.code}
            onChange={(e) => onChange({ ...form, code: e.target.value })}
          />
          <Input
            placeholder="문항 제목"
            value={form.title}
            onChange={(e) => onChange({ ...form, title: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="과목"
              value={form.subject}
              onChange={(e) => onChange({ ...form, subject: e.target.value })}
            />
            <Input
              placeholder="학년"
              value={form.grade}
              onChange={(e) => onChange({ ...form, grade: e.target.value })}
            />
          </div>
          <Input
            placeholder="성취기준 코드"
            value={form.standardCode}
            onChange={(e) => onChange({ ...form, standardCode: e.target.value })}
          />
          <Input
            placeholder="성취기준 설명"
            value={form.standardDescription}
            onChange={(e) => onChange({ ...form, standardDescription: e.target.value })}
          />
          <Select
            value={form.purposeType}
            onChange={(e) => onChange({ ...form, purposeType: e.target.value })}
          >
            <option value="supplemental">보완</option>
            <option value="diagnostic">진단</option>
            <option value="practice">연습</option>
          </Select>
          <Textarea
            rows={3}
            placeholder="지문"
            value={form.stem}
            onChange={(e) => onChange({ ...form, stem: e.target.value })}
          />
          <Input
            placeholder="정답"
            value={form.answer}
            onChange={(e) => onChange({ ...form, answer: e.target.value })}
          />
          <div className="flex gap-2">
            <Button type="submit" className="flex-1">
              {isEditing ? '수정 저장' : '문항 등록'}
            </Button>
            <Button type="button" variant="secondary" onClick={onReset}>
              초기화
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
