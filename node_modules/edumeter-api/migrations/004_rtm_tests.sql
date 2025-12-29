CREATE TABLE IF NOT EXISTS design_artifacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  type text NOT NULL,
  identifier text NOT NULL,
  name text,
  description text,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS design_artifacts_tenant_idx ON design_artifacts (tenant_id);

CREATE TABLE IF NOT EXISTS requirement_design_links (
  requirement_id uuid NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
  design_artifact_id uuid NOT NULL REFERENCES design_artifacts(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (requirement_id, design_artifact_id)
);

CREATE INDEX IF NOT EXISTS requirement_design_links_tenant_idx ON requirement_design_links (tenant_id);

CREATE TABLE IF NOT EXISTS test_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  description text,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS test_requirements_tenant_code_uq ON test_requirements (tenant_id, code);

CREATE TABLE IF NOT EXISTS requirement_test_requirement_links (
  requirement_id uuid NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
  test_requirement_id uuid NOT NULL REFERENCES test_requirements(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (requirement_id, test_requirement_id)
);

CREATE INDEX IF NOT EXISTS requirement_test_links_tenant_idx ON requirement_test_requirement_links (tenant_id);

CREATE TABLE IF NOT EXISTS test_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  test_requirement_id uuid NOT NULL REFERENCES test_requirements(id) ON DELETE CASCADE,
  name text NOT NULL,
  steps text,
  expected_result text,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS test_cases_requirement_idx ON test_cases (test_requirement_id);

CREATE TABLE IF NOT EXISTS test_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'planned',
  executed_by uuid REFERENCES users(id) ON DELETE SET NULL,
  executed_at timestamptz
);

CREATE TABLE IF NOT EXISTS test_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  test_case_id uuid NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
  test_run_id uuid NOT NULL REFERENCES test_runs(id) ON DELETE CASCADE,
  status text NOT NULL,
  actual_result text,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS test_results_case_idx ON test_results (test_case_id);

CREATE TABLE IF NOT EXISTS test_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  test_result_id uuid NOT NULL REFERENCES test_results(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_url text NOT NULL,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);