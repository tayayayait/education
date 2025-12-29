import React, { useEffect, useMemo, useState } from 'react';
import { createApiClient } from '../../../services/apiClient';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/Tabs';
import { useToast } from '../../../components/ui/ToastProvider';
import { TemplateForm, TemplateFormState } from './TemplateForm';
import { TemplatePreview } from './TemplatePreview';
import { RunForm, RunFormState } from './RunForm';
import { RunHistoryTable } from './RunHistoryTable';
import { ItemReviewTable } from './ItemReviewTable';
import { RunLogModal } from './RunLogModal';
import { PromptTemplate, GenerationItem, GenerationRun, RunResponse } from './types';

const api = createApiClient({ baseUrl: import.meta.env.VITE_API_BASE_URL });

const initialTemplateForm: TemplateFormState = {
  code: '',
  name: '',
  subject: '',
  grade: '',
  difficulty: '',
  intent: '',
  coreConcept: '',
  template: ''
};

const initialRunForm: RunFormState = {
  templateId: '',
  count: 3,
  modelName: '',
  modelVersion: ''
};

const getRunCount = (run: GenerationRun) => {
  const params = run.parameters ?? {};
  const count = (params as Record<string, unknown>).count;
  return typeof count === 'number' ? count : null;
};

export const GenerationPage: React.FC = () => {
  const { addToast } = useToast();
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [items, setItems] = useState<GenerationItem[]>([]);
  const [runs, setRuns] = useState<GenerationRun[]>([]);
  const [templateForm, setTemplateForm] = useState<TemplateFormState>(initialTemplateForm);
  const [runForm, setRunForm] = useState<RunFormState>(initialRunForm);
  const [activeTab, setActiveTab] = useState('template');
  const [selectedRun, setSelectedRun] = useState<GenerationRun | null>(null);
  const [isRunLogOpen, setIsRunLogOpen] = useState(false);

  const templateMap = useMemo(() => new Map(templates.map(template => [template.id, template])), [templates]);

  const loadTemplates = async () => {
    const data = await api.get<{ items: PromptTemplate[] }>('/prompt-templates?active=true');
    setTemplates(data.items ?? []);
  };

  const loadGenerated = async () => {
    const data = await api.get<{ items: GenerationItem[] }>('/generation/items');
    setItems(data.items ?? []);
  };

  const loadRuns = async () => {
    const data = await api.get<{ items: GenerationRun[] }>('/generation/runs');
    setRuns(data.items ?? []);
  };

  useEffect(() => {
    void loadTemplates();
    void loadGenerated();
    void loadRuns();
  }, []);

  const handleCreateTemplate = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await api.post('/prompt-templates', templateForm);
      setTemplateForm(initialTemplateForm);
      await loadTemplates();
      addToast({ variant: 'success', message: '템플릿이 저장되었습니다.' });
    } catch (err) {
      addToast({ variant: 'danger', message: err instanceof Error ? err.message : '템플릿 생성 실패' });
    }
  };

  const handleGenerate = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const payload = {
        templateId: runForm.templateId,
        count: Number(runForm.count),
        modelName: runForm.modelName || undefined,
        modelVersion: runForm.modelVersion || undefined
      };
      const data = await api.post<RunResponse>('/generation/runs', payload);
      setItems(data.items ?? []);
      await loadRuns();
      setActiveTab('history');
      addToast({ variant: 'success', message: '자동생성 실행을 완료했습니다.' });
    } catch (err) {
      addToast({ variant: 'danger', message: err instanceof Error ? err.message : '생성 실패' });
    }
  };

  const handleRetryRun = async (run: GenerationRun) => {
    try {
      const params = run.parameters ?? {};
      const count = getRunCount(run) ?? runForm.count;
      const { count: _ignored, lastError: _ignored2, ...restParams } = params as Record<string, unknown>;
      const payload = {
        templateId: run.prompt_template_id,
        count,
        modelName: (run.model_name ?? runForm.modelName) || undefined,
        modelVersion: (run.model_version ?? runForm.modelVersion) || undefined,
        parameters: Object.keys(restParams).length > 0 ? restParams : undefined
      };
      const data = await api.post<RunResponse>('/generation/runs', payload);
      setItems(data.items ?? []);
      await loadRuns();
      addToast({ variant: 'success', message: '실패 실행을 재시도했습니다.' });
    } catch (err) {
      addToast({ variant: 'danger', message: err instanceof Error ? err.message : '재시도 실패' });
    }
  };

  const handleReview = async (id: string, decision: 'accept' | 'reject') => {
    try {
      await api.post(`/generation/items/${id}/review`, { decision });
      await loadGenerated();
      addToast({ variant: 'success', message: '리뷰 결과가 반영되었습니다.' });
    } catch (err) {
      addToast({ variant: 'danger', message: err instanceof Error ? err.message : '리뷰 실패' });
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await api.post(`/generation/items/${id}/approve`, {});
      await loadGenerated();
      addToast({ variant: 'success', message: '승인이 완료되었습니다.' });
    } catch (err) {
      addToast({ variant: 'danger', message: err instanceof Error ? err.message : '승인 실패' });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-text-primary">문항 자동생성 파이프라인</h3>
        <p className="text-sm text-text-secondary mt-2">
          프롬프트 템플릿 관리, 자동생성, 검토/승인 흐름을 확인합니다.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="template">템플릿 등록</TabsTrigger>
          <TabsTrigger value="run">자동 생성</TabsTrigger>
          <TabsTrigger value="history">이력/검토</TabsTrigger>
        </TabsList>

        <TabsContent value="template">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
            <TemplateForm form={templateForm} onChange={setTemplateForm} onSubmit={handleCreateTemplate} />
            <TemplatePreview form={templateForm} />
          </div>
        </TabsContent>

        <TabsContent value="run">
          <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
            <RunForm templates={templates} form={runForm} onChange={setRunForm} onSubmit={handleGenerate} />
            <RunHistoryTable
              runs={runs}
              templates={templates}
              onRetry={handleRetryRun}
              onOpenLog={(run) => {
                setSelectedRun(run);
                setIsRunLogOpen(true);
              }}
            />
          </div>
        </TabsContent>

        <TabsContent value="history">
          <div className="space-y-6">
            <RunHistoryTable
              runs={runs}
              templates={templates}
              onRetry={handleRetryRun}
              onOpenLog={(run) => {
                setSelectedRun(run);
                setIsRunLogOpen(true);
              }}
            />
            <ItemReviewTable items={items} onReview={handleReview} onApprove={handleApprove} />
          </div>
        </TabsContent>
      </Tabs>

      <RunLogModal
        open={isRunLogOpen}
        run={selectedRun}
        template={selectedRun ? templateMap.get(selectedRun.prompt_template_id) ?? null : null}
        onOpenChange={setIsRunLogOpen}
      />
    </div>
  );
};
