import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { TemplateFormState } from './TemplateForm';

export interface TemplatePreviewProps {
  form: TemplateFormState;
}

export const TemplatePreview: React.FC<TemplatePreviewProps> = ({ form }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>프롬프트 미리보기</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-xs text-text-secondary">
          <div>코드: <span className="text-text-primary">{form.code || '-'}</span></div>
          <div>명칭: <span className="text-text-primary">{form.name || '-'}</span></div>
          <div>과목: <span className="text-text-primary">{form.subject || '-'}</span></div>
          <div>학년: <span className="text-text-primary">{form.grade || '-'}</span></div>
          <div>난이도: <span className="text-text-primary">{form.difficulty || '-'}</span></div>
          <div>출제 의도: <span className="text-text-primary">{form.intent || '-'}</span></div>
          <div className="col-span-2">핵심 개념: <span className="text-text-primary">{form.coreConcept || '-'}</span></div>
        </div>
        <div className="rounded-sm border border-border bg-slate-50 p-3 text-xs text-text-secondary whitespace-pre-wrap">
          {form.template || '템플릿 내용을 입력하면 여기에 표시됩니다.'}
        </div>
      </CardContent>
    </Card>
  );
};
