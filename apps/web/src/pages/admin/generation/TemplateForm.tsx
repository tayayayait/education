import React from 'react';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';

export interface TemplateFormState {
  code: string;
  name: string;
  subject: string;
  grade: string;
  difficulty: string;
  intent: string;
  coreConcept: string;
  template: string;
}

export interface TemplateFormProps {
  form: TemplateFormState;
  onChange: (next: TemplateFormState) => void;
  onSubmit: (event: React.FormEvent) => void;
}

export const TemplateForm: React.FC<TemplateFormProps> = ({ form, onChange, onSubmit }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>프롬프트 템플릿 등록</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-3" onSubmit={onSubmit}>
          <Input
            placeholder="코드"
            value={form.code}
            onChange={(e) => onChange({ ...form, code: e.target.value })}
          />
          <Input
            placeholder="명칭"
            value={form.name}
            onChange={(e) => onChange({ ...form, name: e.target.value })}
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
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="난이도"
              value={form.difficulty}
              onChange={(e) => onChange({ ...form, difficulty: e.target.value })}
            />
            <Input
              placeholder="출제 의도"
              value={form.intent}
              onChange={(e) => onChange({ ...form, intent: e.target.value })}
            />
          </div>
          <Input
            placeholder="핵심 개념"
            value={form.coreConcept}
            onChange={(e) => onChange({ ...form, coreConcept: e.target.value })}
          />
          <Textarea
            rows={4}
            placeholder="템플릿"
            value={form.template}
            onChange={(e) => onChange({ ...form, template: e.target.value })}
          />
          <Button type="submit" fullWidth>
            템플릿 저장
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
