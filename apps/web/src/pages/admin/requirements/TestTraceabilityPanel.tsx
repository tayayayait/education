import React from 'react';
import { TestCase, TestEvidence, TestRequirement, TestResult, TestRun } from './types';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { Select } from '../../../components/ui/Select';

export interface TestTraceabilityPanelProps {
  selectedRequirementId: string | null;
  testRequirements: TestRequirement[];
  testRequirementForm: { code: string; name: string; description: string };
  onTestRequirementFormChange: (next: { code: string; name: string; description: string }) => void;
  onCreateTestRequirement: (event: React.FormEvent) => void;
  testLinks: TestRequirement[];
  testLinkId: string;
  onTestLinkChange: (value: string) => void;
  onLinkTestRequirement: () => void;
  testRequirementId: string;
  onTestRequirementIdChange: (value: string) => void;
  onReloadTestCases: () => void;
  testCases: TestCase[];
  testCaseForm: { name: string; steps: string; expectedResult: string };
  onTestCaseFormChange: (next: { name: string; steps: string; expectedResult: string }) => void;
  onCreateTestCase: (event: React.FormEvent) => void;
  testRuns: TestRun[];
  testRunForm: { name: string; status: TestRun['status'] };
  onTestRunFormChange: (next: { name: string; status: TestRun['status'] }) => void;
  onCreateTestRun: (event: React.FormEvent) => void;
  testResults: TestResult[];
  testResultForm: { testRunId: string; testCaseId: string; status: TestResult['status']; actualResult: string };
  onTestResultFormChange: (next: { testRunId: string; testCaseId: string; status: TestResult['status']; actualResult: string }) => void;
  onCreateTestResult: (event: React.FormEvent) => void;
  testEvidence: TestEvidence[];
  testEvidenceForm: { testResultId: string; fileName: string; fileUrl: string };
  onTestEvidenceFormChange: (next: { testResultId: string; fileName: string; fileUrl: string }) => void;
  onCreateEvidence: (event: React.FormEvent) => void;
}

export const TestTraceabilityPanel: React.FC<TestTraceabilityPanelProps> = ({
  selectedRequirementId,
  testRequirements,
  testRequirementForm,
  onTestRequirementFormChange,
  onCreateTestRequirement,
  testLinks,
  testLinkId,
  onTestLinkChange,
  onLinkTestRequirement,
  testRequirementId,
  onTestRequirementIdChange,
  onReloadTestCases,
  testCases,
  testCaseForm,
  onTestCaseFormChange,
  onCreateTestCase,
  testRuns,
  testRunForm,
  onTestRunFormChange,
  onCreateTestRun,
  testResults,
  testResultForm,
  onTestResultFormChange,
  onCreateTestResult,
  testEvidence,
  testEvidenceForm,
  onTestEvidenceFormChange,
  onCreateEvidence
}) => {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>테스트 요구사항 (RTM)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="space-y-2" onSubmit={onCreateTestRequirement}>
            <Input
              placeholder="테스트 요구 코드"
              value={testRequirementForm.code}
              onChange={(e) => onTestRequirementFormChange({ ...testRequirementForm, code: e.target.value })}
            />
            <Input
              placeholder="명칭"
              value={testRequirementForm.name}
              onChange={(e) => onTestRequirementFormChange({ ...testRequirementForm, name: e.target.value })}
            />
            <Textarea
              rows={2}
              placeholder="설명"
              value={testRequirementForm.description}
              onChange={(e) => onTestRequirementFormChange({ ...testRequirementForm, description: e.target.value })}
            />
            <Button type="submit" fullWidth>테스트 요구 등록</Button>
          </form>
          <div className="flex gap-2">
            <Select
              value={testLinkId}
              onChange={(e) => onTestLinkChange(e.target.value)}
            >
              <option value="">연결할 테스트 요구 선택</option>
              {testRequirements.map(item => (
                <option key={item.id} value={item.id}>
                  {item.code} · {item.name}
                </option>
              ))}
            </Select>
            <Button
              variant="secondary"
              onClick={onLinkTestRequirement}
              disabled={!selectedRequirementId || !testLinkId}
            >
              연결
            </Button>
          </div>
          <div className="text-xs text-text-secondary">연결된 테스트 요구: {testLinks.length}건</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>테스트 케이스</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Select
              value={testRequirementId}
              onChange={(e) => onTestRequirementIdChange(e.target.value)}
            >
              <option value="">테스트 요구 선택</option>
              {testRequirements.map(item => (
                <option key={item.id} value={item.id}>
                  {item.code} · {item.name}
                </option>
              ))}
            </Select>
            <Button variant="secondary" onClick={onReloadTestCases} disabled={!testRequirementId}>
              조회
            </Button>
          </div>
          <form className="space-y-2" onSubmit={onCreateTestCase}>
            <Input
              placeholder="테스트 케이스 명"
              value={testCaseForm.name}
              onChange={(e) => onTestCaseFormChange({ ...testCaseForm, name: e.target.value })}
            />
            <Textarea
              rows={2}
              placeholder="테스트 절차"
              value={testCaseForm.steps}
              onChange={(e) => onTestCaseFormChange({ ...testCaseForm, steps: e.target.value })}
            />
            <Textarea
              rows={2}
              placeholder="기대 결과"
              value={testCaseForm.expectedResult}
              onChange={(e) => onTestCaseFormChange({ ...testCaseForm, expectedResult: e.target.value })}
            />
            <Button type="submit" fullWidth>케이스 등록</Button>
          </form>
          <div className="text-xs text-text-secondary">등록 {testCases.length}건</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>테스트 실행</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <form className="space-y-2" onSubmit={onCreateTestRun}>
            <Input
              placeholder="테스트 실행 명"
              value={testRunForm.name}
              onChange={(e) => onTestRunFormChange({ ...testRunForm, name: e.target.value })}
            />
            <Select
              value={testRunForm.status}
              onChange={(e) => onTestRunFormChange({ ...testRunForm, status: e.target.value as TestRun['status'] })}
            >
              <option value="planned">계획</option>
              <option value="in_progress">진행</option>
              <option value="completed">완료</option>
            </Select>
            <Button type="submit" fullWidth>실행 등록</Button>
          </form>
          <div className="text-xs text-text-secondary">등록 {testRuns.length}건</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>테스트 결과</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <form className="space-y-2" onSubmit={onCreateTestResult}>
            <Select
              value={testResultForm.testRunId}
              onChange={(e) => onTestResultFormChange({ ...testResultForm, testRunId: e.target.value })}
            >
              <option value="">테스트 실행 선택</option>
              {testRuns.map(item => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
            <Select
              value={testResultForm.testCaseId}
              onChange={(e) => onTestResultFormChange({ ...testResultForm, testCaseId: e.target.value })}
            >
              <option value="">테스트 케이스 선택</option>
              {testCases.map(item => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
            <Select
              value={testResultForm.status}
              onChange={(e) => onTestResultFormChange({ ...testResultForm, status: e.target.value as TestResult['status'] })}
            >
              <option value="pass">PASS</option>
              <option value="fail">FAIL</option>
              <option value="blocked">BLOCKED</option>
            </Select>
            <Textarea
              rows={2}
              placeholder="실제 결과"
              value={testResultForm.actualResult}
              onChange={(e) => onTestResultFormChange({ ...testResultForm, actualResult: e.target.value })}
            />
            <Button type="submit" fullWidth>결과 등록</Button>
          </form>
          <div className="text-xs text-text-secondary">등록 {testResults.length}건</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>테스트 증적</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <form className="space-y-2" onSubmit={onCreateEvidence}>
            <Select
              value={testEvidenceForm.testResultId}
              onChange={(e) => onTestEvidenceFormChange({ ...testEvidenceForm, testResultId: e.target.value })}
            >
              <option value="">테스트 결과 선택</option>
              {testResults.map(item => (
                <option key={item.id} value={item.id}>
                  {item.status}
                </option>
              ))}
            </Select>
            <Input
              placeholder="파일명"
              value={testEvidenceForm.fileName}
              onChange={(e) => onTestEvidenceFormChange({ ...testEvidenceForm, fileName: e.target.value })}
            />
            <Input
              placeholder="파일 URL"
              value={testEvidenceForm.fileUrl}
              onChange={(e) => onTestEvidenceFormChange({ ...testEvidenceForm, fileUrl: e.target.value })}
            />
            <Button type="submit" fullWidth>증적 등록</Button>
          </form>
          <div className="text-xs text-text-secondary">등록 {testEvidence.length}건</div>
        </CardContent>
      </Card>
    </div>
  );
};
