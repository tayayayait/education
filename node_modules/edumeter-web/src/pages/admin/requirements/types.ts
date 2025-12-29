export type Requirement = {
  id: string;
  code: string;
  category: string;
  name: string;
  description?: string | null;
  definition?: string | null;
  details?: string | null;
  deliverables?: string | null;
};

export type RequirementFormState = {
  id?: string;
  code: string;
  category: string;
  name: string;
  description: string;
  definition: string;
  details: string;
  deliverables: string;
};

export type Baseline = {
  id: string;
  version: string;
  title?: string | null;
  description?: string | null;
  created_at: string;
};

export type Interpretation = {
  id: string;
  raw_text?: string | null;
  acceptance_criteria: string;
  rationale?: string | null;
  created_at: string;
};

export type ChangeRequest = {
  id: string;
  title: string;
  description?: string | null;
  impact_summary?: string | null;
  status: 'requested' | 'approved' | 'rejected' | 'implemented';
  requested_at: string;
};

export type ImpactSummary = {
  design_count: number;
  test_requirement_count: number;
  test_case_count: number;
  test_result_count: number;
  passed_count: number;
};

export type DesignArtifact = {
  id: string;
  type: string;
  identifier: string;
  name?: string | null;
  description?: string | null;
  created_at: string;
};

export type TestRequirement = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  created_at: string;
};

export type TestCase = {
  id: string;
  test_requirement_id: string;
  name: string;
  steps?: string | null;
  expected_result?: string | null;
  created_at: string;
};

export type TestRun = {
  id: string;
  name: string;
  status: 'planned' | 'in_progress' | 'completed';
  executed_at?: string | null;
  created_at?: string | null;
};

export type TestResult = {
  id: string;
  test_case_id: string;
  test_run_id: string;
  status: 'pass' | 'fail' | 'blocked';
  actual_result?: string | null;
  created_at: string;
};

export type TestEvidence = {
  id: string;
  test_result_id: string;
  file_name: string;
  file_url: string;
  created_at: string;
};

export type CoverageSummary = {
  total: number;
  with_design: number;
  with_test: number;
  with_pass: number;
};

export type CoverageRow = {
  id: string;
  code: string;
  name: string;
  has_design: boolean;
  has_test: boolean;
  has_pass: boolean;
};
