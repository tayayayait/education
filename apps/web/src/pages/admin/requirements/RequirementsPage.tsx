import React, { useEffect, useMemo, useState } from 'react';
import { createApiClient } from '../../../services/apiClient';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { RequirementsList } from './RequirementsList';
import { RequirementForm } from './RequirementForm';
import { RequirementImportDialog } from './RequirementImportDialog';
import { CoverageSummaryCards } from './CoverageSummaryCards';
import { RequirementDetail } from './RequirementDetail';
import { InterpretationPanel } from './InterpretationPanel';
import { ChangeRequestPanel } from './ChangeRequestPanel';
import { DesignTraceabilityPanel } from './DesignTraceabilityPanel';
import { TestTraceabilityPanel } from './TestTraceabilityPanel';
import { CoverageTable } from './CoverageTable';
import {
  Baseline,
  ChangeRequest,
  CoverageRow,
  CoverageSummary,
  DesignArtifact,
  ImpactSummary,
  Interpretation,
  Requirement,
  RequirementFormState,
  TestCase,
  TestEvidence,
  TestRequirement,
  TestResult,
  TestRun
} from './types';

const baseUrl = import.meta.env.VITE_API_BASE_URL ?? '';
const api = createApiClient({ baseUrl });

const emptyRequirementForm: RequirementFormState = {
  code: '',
  category: '',
  name: '',
  description: '',
  definition: '',
  details: '',
  deliverables: ''
};

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('ko-KR');
};

export const RequirementsPage: React.FC = () => {
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [selectedRequirementId, setSelectedRequirementId] = useState<string | null>(null);
  const [requirementForm, setRequirementForm] = useState<RequirementFormState>(emptyRequirementForm);
  const [requirementsLoading, setRequirementsLoading] = useState(false);
  const [requirementsError, setRequirementsError] = useState<string | null>(null);
  const [requirementsInfo, setRequirementsInfo] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterSearch, setFilterSearch] = useState('');

  const [baselines, setBaselines] = useState<Baseline[]>([]);
  const [baselineForm, setBaselineForm] = useState({ version: '', title: '', description: '' });

  const [importFile, setImportFile] = useState<File | null>(null);
  const [importFormat, setImportFormat] = useState<'csv' | 'json'>('csv');
  const [importBaseline, setImportBaseline] = useState({ version: '', title: '', description: '' });
  const [isImportOpen, setIsImportOpen] = useState(false);

  const [interpretations, setInterpretations] = useState<Interpretation[]>([]);
  const [interpretationForm, setInterpretationForm] = useState({ rawText: '', acceptanceCriteria: '', rationale: '' });

  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([]);
  const [changeRequestForm, setChangeRequestForm] = useState({ title: '', description: '', impactSummary: '' });

  const [impact, setImpact] = useState<ImpactSummary | null>(null);

  const [designArtifacts, setDesignArtifacts] = useState<DesignArtifact[]>([]);
  const [designForm, setDesignForm] = useState({ type: '', identifier: '', name: '', description: '' });
  const [designLinks, setDesignLinks] = useState<DesignArtifact[]>([]);
  const [designLinkId, setDesignLinkId] = useState('');

  const [testRequirements, setTestRequirements] = useState<TestRequirement[]>([]);
  const [testRequirementForm, setTestRequirementForm] = useState({ code: '', name: '', description: '' });
  const [testLinks, setTestLinks] = useState<TestRequirement[]>([]);
  const [testLinkId, setTestLinkId] = useState('');

  const [testRequirementId, setTestRequirementId] = useState<string>('');
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [testCaseForm, setTestCaseForm] = useState({ name: '', steps: '', expectedResult: '' });

  const [testRuns, setTestRuns] = useState<TestRun[]>([]);
  const [testRunForm, setTestRunForm] = useState({ name: '', status: 'planned' as TestRun['status'] });

  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [testResultForm, setTestResultForm] = useState({
    testCaseId: '',
    testRunId: '',
    status: 'pass' as TestResult['status'],
    actualResult: ''
  });

  const [testEvidence, setTestEvidence] = useState<TestEvidence[]>([]);
  const [testEvidenceForm, setTestEvidenceForm] = useState({ testResultId: '', fileName: '', fileUrl: '' });

  const [coverageSummary, setCoverageSummary] = useState<CoverageSummary | null>(null);
  const [coverageItems, setCoverageItems] = useState<CoverageRow[]>([]);
  const [noncompliantItems, setNoncompliantItems] = useState<CoverageRow[]>([]);

  const selectedRequirement = useMemo(
    () => requirements.find(req => req.id === selectedRequirementId) ?? null,
    [requirements, selectedRequirementId]
  );

  const categories = useMemo(() => {
    const set = new Set(requirements.map(req => req.category).filter(Boolean));
    return Array.from(set).sort();
  }, [requirements]);

  const loadRequirements = async () => {
    setRequirementsLoading(true);
    setRequirementsError(null);
    try {
      const params = new URLSearchParams();
      if (filterCategory) params.set('category', filterCategory);
      if (filterSearch) params.set('search', filterSearch);
      const data = await api.get<{ items: Requirement[] }>(`/requirements?${params.toString()}`);
      setRequirements(data.items ?? []);
      if (!selectedRequirementId && data.items?.length) {
        setSelectedRequirementId(data.items[0].id);
      }
    } catch (err) {
      setRequirementsError(err instanceof Error ? err.message : '요구사항을 불러오지 못했습니다.');
    } finally {
      setRequirementsLoading(false);
    }
  };

  const loadBaselines = async () => {
    const data = await api.get<{ items: Baseline[] }>('/requirements/baselines');
    setBaselines(data.items ?? []);
  };

  const loadCoverage = async () => {
    const data = await api.get<{ summary: CoverageSummary; items: CoverageRow[] }>('/requirements/coverage');
    setCoverageSummary(data.summary);
    setCoverageItems(data.items ?? []);
  };

  const loadNoncompliant = async () => {
    const data = await api.get<{ items: CoverageRow[] }>('/requirements/noncompliant');
    setNoncompliantItems(data.items ?? []);
  };

  const loadInterpretations = async (requirementId: string) => {
    const data = await api.get<{ items: Interpretation[] }>(`/requirements/${requirementId}/interpretations`);
    setInterpretations(data.items ?? []);
  };

  const loadChangeRequests = async (requirementId: string) => {
    const data = await api.get<{ items: ChangeRequest[] }>(`/requirements/${requirementId}/change-requests`);
    setChangeRequests(data.items ?? []);
  };

  const loadImpact = async (requirementId: string) => {
    const data = await api.get<{ impact: ImpactSummary }>(`/requirements/${requirementId}/impact`);
    setImpact(data.impact ?? null);
  };

  const loadDesignArtifacts = async () => {
    const data = await api.get<{ items: DesignArtifact[] }>('/design-artifacts');
    setDesignArtifacts(data.items ?? []);
  };

  const loadDesignLinks = async (requirementId: string) => {
    const data = await api.get<{ items: DesignArtifact[] }>(`/requirements/${requirementId}/design-links`);
    setDesignLinks(data.items ?? []);
  };

  const loadTestRequirements = async () => {
    const data = await api.get<{ items: TestRequirement[] }>('/test-requirements');
    setTestRequirements(data.items ?? []);
  };

  const loadTestLinks = async (requirementId: string) => {
    const data = await api.get<{ items: TestRequirement[] }>(`/requirements/${requirementId}/test-links`);
    setTestLinks(data.items ?? []);
  };

  const loadTestCases = async (requirementId: string) => {
    const params = requirementId ? `?testRequirementId=${requirementId}` : '';
    const data = await api.get<{ items: TestCase[] }>(`/test-cases${params}`);
    setTestCases(data.items ?? []);
  };

  const loadTestRuns = async () => {
    const data = await api.get<{ items: TestRun[] }>('/test-runs');
    setTestRuns(data.items ?? []);
  };

  const loadTestResults = async (testRunId?: string, testCaseId?: string) => {
    const params = new URLSearchParams();
    if (testRunId) params.set('testRunId', testRunId);
    if (testCaseId) params.set('testCaseId', testCaseId);
    const query = params.toString();
    const data = await api.get<{ items: TestResult[] }>(`/test-results${query ? `?${query}` : ''}`);
    setTestResults(data.items ?? []);
  };

  const loadTestEvidence = async (testResultId: string) => {
    const params = testResultId ? `?testResultId=${testResultId}` : '';
    const data = await api.get<{ items: TestEvidence[] }>(`/test-evidence${params}`);
    setTestEvidence(data.items ?? []);
  };

  useEffect(() => {
    void loadRequirements();
    void loadBaselines();
    void loadDesignArtifacts();
    void loadTestRequirements();
    void loadTestRuns();
    void loadCoverage();
    void loadNoncompliant();
  }, []);

  useEffect(() => {
    if (!selectedRequirementId) {
      setInterpretations([]);
      setChangeRequests([]);
      setDesignLinks([]);
      setTestLinks([]);
      setImpact(null);
      return;
    }
    void loadInterpretations(selectedRequirementId);
    void loadChangeRequests(selectedRequirementId);
    void loadDesignLinks(selectedRequirementId);
    void loadTestLinks(selectedRequirementId);
    void loadImpact(selectedRequirementId);
  }, [selectedRequirementId]);

  useEffect(() => {
    if (!selectedRequirement) {
      setRequirementForm(emptyRequirementForm);
      return;
    }
    setRequirementForm({
      id: selectedRequirement.id,
      code: selectedRequirement.code ?? '',
      category: selectedRequirement.category ?? '',
      name: selectedRequirement.name ?? '',
      description: selectedRequirement.description ?? '',
      definition: selectedRequirement.definition ?? '',
      details: selectedRequirement.details ?? '',
      deliverables: selectedRequirement.deliverables ?? ''
    });
  }, [selectedRequirement]);

  useEffect(() => {
    if (!testRequirementId && testRequirements.length > 0) {
      setTestRequirementId(testRequirements[0].id);
    }
  }, [testRequirements, testRequirementId]);

  useEffect(() => {
    if (testRequirementId) {
      void loadTestCases(testRequirementId);
    } else {
      setTestCases([]);
    }
  }, [testRequirementId]);

  useEffect(() => {
    if (testRuns.length > 0 && !testResultForm.testRunId) {
      setTestResultForm(prev => ({ ...prev, testRunId: testRuns[0].id }));
    }
  }, [testRuns, testResultForm.testRunId]);

  useEffect(() => {
    if (testCases.length > 0 && !testResultForm.testCaseId) {
      setTestResultForm(prev => ({ ...prev, testCaseId: testCases[0].id }));
    }
  }, [testCases, testResultForm.testCaseId]);

  useEffect(() => {
    if (testResultForm.testRunId || testResultForm.testCaseId) {
      void loadTestResults(testResultForm.testRunId, testResultForm.testCaseId);
    }
  }, [testResultForm.testRunId, testResultForm.testCaseId]);

  useEffect(() => {
    if (testResults.length > 0 && !testEvidenceForm.testResultId) {
      setTestEvidenceForm(prev => ({ ...prev, testResultId: testResults[0].id }));
    }
  }, [testResults, testEvidenceForm.testResultId]);

  useEffect(() => {
    if (testEvidenceForm.testResultId) {
      void loadTestEvidence(testEvidenceForm.testResultId);
    } else {
      setTestEvidence([]);
    }
  }, [testEvidenceForm.testResultId]);

  const handleSaveRequirement = async (event: React.FormEvent) => {
    event.preventDefault();
    setRequirementsError(null);
    setRequirementsInfo(null);
    try {
      if (requirementForm.id) {
        await api.put(`/requirements/${requirementForm.id}`, {
          code: requirementForm.code,
          category: requirementForm.category,
          name: requirementForm.name,
          description: requirementForm.description || undefined,
          definition: requirementForm.definition || undefined,
          details: requirementForm.details || undefined,
          deliverables: requirementForm.deliverables || undefined
        });
        setRequirementsInfo('요구사항이 수정되었습니다.');
      } else {
        await api.post('/requirements', {
          code: requirementForm.code,
          category: requirementForm.category,
          name: requirementForm.name,
          description: requirementForm.description || undefined,
          definition: requirementForm.definition || undefined,
          details: requirementForm.details || undefined,
          deliverables: requirementForm.deliverables || undefined
        });
        setRequirementsInfo('요구사항이 등록되었습니다.');
      }
      await loadRequirements();
    } catch (err) {
      setRequirementsError(err instanceof Error ? err.message : '요구사항 저장에 실패했습니다.');
    }
  };

  const handleDeleteRequirement = async (id: string) => {
    if (!confirm('해당 요구사항을 삭제하시겠습니까?')) return;
    try {
      await api.delete(`/requirements/${id}`);
      setRequirementsInfo('요구사항이 삭제되었습니다.');
      if (selectedRequirementId === id) {
        setSelectedRequirementId(null);
      }
      await loadRequirements();
    } catch (err) {
      setRequirementsError(err instanceof Error ? err.message : '요구사항 삭제에 실패했습니다.');
    }
  };

  const handleImport = async () => {
    if (!importFile) return;
    setRequirementsError(null);
    setRequirementsInfo(null);
    try {
      const dataText = await importFile.text();
      const payload = {
        format: importFormat,
        data: dataText,
        baselineVersion: importBaseline.version || undefined,
        baselineTitle: importBaseline.title || undefined,
        baselineDescription: importBaseline.description || undefined
      };
      const result = await api.post<{ imported: number }>('/requirements/import', payload);
      setRequirementsInfo(`요구사항 ${result.imported ?? 0}건을 가져왔습니다.`);
      setImportFile(null);
      setImportBaseline({ version: '', title: '', description: '' });
      await loadRequirements();
      await loadBaselines();
      setIsImportOpen(false);
    } catch (err) {
      setRequirementsError(err instanceof Error ? err.message : '요구사항 가져오기에 실패했습니다.');
    }
  };

  const handleCreateBaseline = async (event: React.FormEvent) => {
    event.preventDefault();
    setRequirementsError(null);
    setRequirementsInfo(null);
    try {
      await api.post('/requirements/baselines', baselineForm);
      setBaselineForm({ version: '', title: '', description: '' });
      setRequirementsInfo('베이스라인을 생성했습니다.');
      await loadBaselines();
    } catch (err) {
      setRequirementsError(err instanceof Error ? err.message : '베이스라인 생성에 실패했습니다.');
    }
  };

  const handleCreateInterpretation = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedRequirementId) return;
    setRequirementsError(null);
    try {
      await api.post(`/requirements/${selectedRequirementId}/interpretations`, {
        rawText: interpretationForm.rawText || undefined,
        acceptanceCriteria: interpretationForm.acceptanceCriteria,
        rationale: interpretationForm.rationale || undefined
      });
      setInterpretationForm({ rawText: '', acceptanceCriteria: '', rationale: '' });
      await loadInterpretations(selectedRequirementId);
    } catch (err) {
      setRequirementsError(err instanceof Error ? err.message : '해석/정제 등록에 실패했습니다.');
    }
  };

  const handleCreateChangeRequest = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedRequirementId) return;
    setRequirementsError(null);
    try {
      await api.post(`/requirements/${selectedRequirementId}/change-requests`, {
        title: changeRequestForm.title,
        description: changeRequestForm.description || undefined,
        impactSummary: changeRequestForm.impactSummary || undefined
      });
      setChangeRequestForm({ title: '', description: '', impactSummary: '' });
      await loadChangeRequests(selectedRequirementId);
    } catch (err) {
      setRequirementsError(err instanceof Error ? err.message : '변경요청 등록에 실패했습니다.');
    }
  };

  const handleUpdateChangeRequest = async (id: string, status: ChangeRequest['status']) => {
    setRequirementsError(null);
    try {
      await api.patch(`/change-requests/${id}`, { status });
      if (selectedRequirementId) {
        await loadChangeRequests(selectedRequirementId);
      }
    } catch (err) {
      setRequirementsError(err instanceof Error ? err.message : '변경요청 상태 업데이트에 실패했습니다.');
    }
  };

  const handleCreateDesignArtifact = async (event: React.FormEvent) => {
    event.preventDefault();
    setRequirementsError(null);
    try {
      await api.post('/design-artifacts', {
        type: designForm.type,
        identifier: designForm.identifier,
        name: designForm.name || undefined,
        description: designForm.description || undefined
      });
      setDesignForm({ type: '', identifier: '', name: '', description: '' });
      await loadDesignArtifacts();
    } catch (err) {
      setRequirementsError(err instanceof Error ? err.message : '설계 산출물 등록에 실패했습니다.');
    }
  };

  const handleLinkDesign = async () => {
    if (!selectedRequirementId || !designLinkId) return;
    setRequirementsError(null);
    try {
      await api.post(`/requirements/${selectedRequirementId}/design-links`, { designArtifactId: designLinkId });
      await loadDesignLinks(selectedRequirementId);
      setDesignLinkId('');
    } catch (err) {
      setRequirementsError(err instanceof Error ? err.message : '설계 산출물 연결 실패');
    }
  };

  const handleCreateTestRequirement = async (event: React.FormEvent) => {
    event.preventDefault();
    setRequirementsError(null);
    try {
      await api.post('/test-requirements', {
        code: testRequirementForm.code,
        name: testRequirementForm.name,
        description: testRequirementForm.description || undefined
      });
      setTestRequirementForm({ code: '', name: '', description: '' });
      await loadTestRequirements();
    } catch (err) {
      setRequirementsError(err instanceof Error ? err.message : '테스트 요구 등록에 실패했습니다.');
    }
  };

  const handleLinkTestRequirement = async () => {
    if (!selectedRequirementId || !testLinkId) return;
    setRequirementsError(null);
    try {
      await api.post(`/requirements/${selectedRequirementId}/test-links`, { testRequirementId: testLinkId });
      await loadTestLinks(selectedRequirementId);
      setTestLinkId('');
    } catch (err) {
      setRequirementsError(err instanceof Error ? err.message : '테스트 요구 연결 실패');
    }
  };

  const handleCreateTestCase = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!testRequirementId) return;
    setRequirementsError(null);
    try {
      await api.post('/test-cases', {
        testRequirementId,
        name: testCaseForm.name,
        steps: testCaseForm.steps || undefined,
        expectedResult: testCaseForm.expectedResult || undefined
      });
      setTestCaseForm({ name: '', steps: '', expectedResult: '' });
      await loadTestCases(testRequirementId);
    } catch (err) {
      setRequirementsError(err instanceof Error ? err.message : '테스트 케이스 등록 실패');
    }
  };

  const handleCreateTestRun = async (event: React.FormEvent) => {
    event.preventDefault();
    setRequirementsError(null);
    try {
      await api.post('/test-runs', {
        name: testRunForm.name,
        status: testRunForm.status
      });
      setTestRunForm({ name: '', status: 'planned' });
      await loadTestRuns();
    } catch (err) {
      setRequirementsError(err instanceof Error ? err.message : '테스트 실행 등록 실패');
    }
  };

  const handleCreateTestResult = async (event: React.FormEvent) => {
    event.preventDefault();
    setRequirementsError(null);
    try {
      await api.post('/test-results', {
        testRunId: testResultForm.testRunId,
        testCaseId: testResultForm.testCaseId,
        status: testResultForm.status,
        actualResult: testResultForm.actualResult || undefined
      });
      setTestResultForm(prev => ({ ...prev, actualResult: '' }));
      await loadTestResults(testResultForm.testRunId, testResultForm.testCaseId);
    } catch (err) {
      setRequirementsError(err instanceof Error ? err.message : '테스트 결과 등록 실패');
    }
  };

  const handleCreateEvidence = async (event: React.FormEvent) => {
    event.preventDefault();
    setRequirementsError(null);
    try {
      await api.post('/test-evidence', {
        testResultId: testEvidenceForm.testResultId,
        fileName: testEvidenceForm.fileName,
        fileUrl: testEvidenceForm.fileUrl
      });
      setTestEvidenceForm(prev => ({ ...prev, fileName: '', fileUrl: '' }));
      if (testEvidenceForm.testResultId) {
        await loadTestEvidence(testEvidenceForm.testResultId);
      }
    } catch (err) {
      setRequirementsError(err instanceof Error ? err.message : '테스트 증적 등록 실패');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-xl font-bold text-text-primary">요구사항 관리</h3>
          <p className="text-sm text-text-secondary mt-1">요구사항/RTM/커버리지를 관리합니다.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={loadRequirements}>리스트 새로고침</Button>
          <Button onClick={() => setIsImportOpen(true)}>Import 열기</Button>
        </div>
      </div>

      {requirementsError && (
        <div className="rounded-sm border border-danger/20 bg-danger/10 text-danger text-sm p-3">
          {requirementsError}
        </div>
      )}
      {requirementsInfo && (
        <div className="rounded-sm border border-success/20 bg-success/10 text-success text-sm p-3">
          {requirementsInfo}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <RequirementsList
          items={requirements}
          loading={requirementsLoading}
          selectedId={selectedRequirementId}
          categories={categories}
          filterCategory={filterCategory}
          filterSearch={filterSearch}
          onFilterCategoryChange={setFilterCategory}
          onFilterSearchChange={setFilterSearch}
          onApplyFilters={loadRequirements}
          onSelect={setSelectedRequirementId}
          onDelete={handleDeleteRequirement}
          onOpenImport={() => setIsImportOpen(true)}
          onRefresh={loadRequirements}
        />
        <div className="space-y-4">
          <RequirementForm
            form={requirementForm}
            onChange={setRequirementForm}
            onSubmit={handleSaveRequirement}
            onReset={() => {
              setRequirementForm(emptyRequirementForm);
              setSelectedRequirementId(null);
            }}
            isEditing={Boolean(requirementForm.id)}
          />
          <Card>
            <CardHeader>
              <CardTitle>베이스라인 생성</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-2" onSubmit={handleCreateBaseline}>
                <Input
                  placeholder="버전"
                  value={baselineForm.version}
                  onChange={(e) => setBaselineForm(prev => ({ ...prev, version: e.target.value }))}
                />
                <Input
                  placeholder="제목"
                  value={baselineForm.title}
                  onChange={(e) => setBaselineForm(prev => ({ ...prev, title: e.target.value }))}
                />
                <Textarea
                  rows={2}
                  placeholder="설명"
                  value={baselineForm.description}
                  onChange={(e) => setBaselineForm(prev => ({ ...prev, description: e.target.value }))}
                />
                <Button type="submit" fullWidth>베이스라인 생성</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      <CoverageSummaryCards
        summary={coverageSummary}
        noncompliantCount={noncompliantItems.length}
        onRefresh={() => {
          void loadCoverage();
          void loadNoncompliant();
        }}
      />

      <RequirementDetail requirement={selectedRequirement} impact={impact} />

      <div className="grid gap-6 lg:grid-cols-2">
        <InterpretationPanel
          disabled={!selectedRequirementId}
          items={interpretations}
          form={interpretationForm}
          onFormChange={setInterpretationForm}
          onSubmit={handleCreateInterpretation}
          formatDate={formatDate}
        />
        <ChangeRequestPanel
          disabled={!selectedRequirementId}
          items={changeRequests}
          form={changeRequestForm}
          onFormChange={setChangeRequestForm}
          onSubmit={handleCreateChangeRequest}
          onStatusChange={handleUpdateChangeRequest}
          formatDate={formatDate}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DesignTraceabilityPanel
          selectedRequirementId={selectedRequirementId}
          designForm={designForm}
          onFormChange={setDesignForm}
          onCreate={handleCreateDesignArtifact}
          designArtifacts={designArtifacts}
          designLinks={designLinks}
          designLinkId={designLinkId}
          onDesignLinkChange={setDesignLinkId}
          onLink={handleLinkDesign}
        />
        <TestTraceabilityPanel
          selectedRequirementId={selectedRequirementId}
          testRequirements={testRequirements}
          testRequirementForm={testRequirementForm}
          onTestRequirementFormChange={setTestRequirementForm}
          onCreateTestRequirement={handleCreateTestRequirement}
          testLinks={testLinks}
          testLinkId={testLinkId}
          onTestLinkChange={setTestLinkId}
          onLinkTestRequirement={handleLinkTestRequirement}
          testRequirementId={testRequirementId}
          onTestRequirementIdChange={setTestRequirementId}
          onReloadTestCases={() => testRequirementId && loadTestCases(testRequirementId)}
          testCases={testCases}
          testCaseForm={testCaseForm}
          onTestCaseFormChange={setTestCaseForm}
          onCreateTestCase={handleCreateTestCase}
          testRuns={testRuns}
          testRunForm={testRunForm}
          onTestRunFormChange={setTestRunForm}
          onCreateTestRun={handleCreateTestRun}
          testResults={testResults}
          testResultForm={testResultForm}
          onTestResultFormChange={setTestResultForm}
          onCreateTestResult={handleCreateTestResult}
          testEvidence={testEvidence}
          testEvidenceForm={testEvidenceForm}
          onTestEvidenceFormChange={setTestEvidenceForm}
          onCreateEvidence={handleCreateEvidence}
        />
      </div>

      <CoverageTable items={coverageItems} noncompliantItems={noncompliantItems} />

      <RequirementImportDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        importFile={importFile}
        onFileChange={setImportFile}
        importFormat={importFormat}
        onFormatChange={setImportFormat}
        importBaseline={importBaseline}
        onBaselineChange={setImportBaseline}
        baselines={baselines}
        onImport={handleImport}
      />
    </div>
  );
};
