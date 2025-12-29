import React from 'react';
import { PromptTemplate } from './types';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';

export interface RunFormState {
  templateId: string;
  count: number;
  modelName: string;
  modelVersion: string;
}

export interface RunFormProps {
  templates: PromptTemplate[];
  form: RunFormState;
  onChange: (next: RunFormState) => void;
  onSubmit: (event: React.FormEvent) => void;
}

export const RunForm: React.FC<RunFormProps> = ({ templates, form, onChange, onSubmit }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>자동 생성 실행</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-3" onSubmit={onSubmit}>
          <Select
            value={form.templateId}
            onChange={(e) => onChange({ ...form, templateId: e.target.value })}
          >
            <option value="">템플릿 선택</option>
            {templates.map(template => (
              <option key={template.id} value={template.id}>
                {template.code} v{template.version} ({template.name})
              </option>
            ))}
          </Select>
          <Input
            type="number"
            min={1}
            value={form.count}
            onChange={(e) => onChange({ ...form, count: Number(e.target.value) })}
          />
          <Input
            placeholder="모델"
            value={form.modelName}
            onChange={(e) => onChange({ ...form, modelName: e.target.value })}
          />
          <Input
            placeholder="모델 버전"
            value={form.modelVersion}
            onChange={(e) => onChange({ ...form, modelVersion: e.target.value })}
          />
          <Button type="submit" fullWidth>
            생성 실행
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
