import React from 'react';
import { RequirementFormState } from './types';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';

export interface RequirementFormProps {
  form: RequirementFormState;
  onChange: (next: RequirementFormState) => void;
  onSubmit: (event: React.FormEvent) => void;
  onReset: () => void;
  isEditing: boolean;
}

export const RequirementForm: React.FC<RequirementFormProps> = ({
  form,
  onChange,
  onSubmit,
  onReset,
  isEditing
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>요구사항 {isEditing ? '수정' : '등록'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-3" onSubmit={onSubmit}>
          <Input
            placeholder="요구사항 코드"
            value={form.code}
            onChange={(e) => onChange({ ...form, code: e.target.value })}
          />
          <Input
            placeholder="분류"
            value={form.category}
            onChange={(e) => onChange({ ...form, category: e.target.value })}
          />
          <Input
            placeholder="요구사항 명칭"
            value={form.name}
            onChange={(e) => onChange({ ...form, name: e.target.value })}
          />
          <Textarea
            placeholder="설명"
            rows={2}
            value={form.description}
            onChange={(e) => onChange({ ...form, description: e.target.value })}
          />
          <Textarea
            placeholder="정의"
            rows={2}
            value={form.definition}
            onChange={(e) => onChange({ ...form, definition: e.target.value })}
          />
          <Textarea
            placeholder="상세"
            rows={2}
            value={form.details}
            onChange={(e) => onChange({ ...form, details: e.target.value })}
          />
          <Textarea
            placeholder="산출물"
            rows={2}
            value={form.deliverables}
            onChange={(e) => onChange({ ...form, deliverables: e.target.value })}
          />
          <div className="flex gap-2">
            <Button type="submit" className="flex-1">
              {isEditing ? '수정 저장' : '요구사항 등록'}
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
