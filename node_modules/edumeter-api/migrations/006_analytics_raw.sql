CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  external_id text,
  name text,
  grade text,
  class_code text,
  attributes jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS students_tenant_idx ON students (tenant_id);

CREATE TABLE IF NOT EXISTS assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  purpose text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS assessments_tenant_idx ON assessments (tenant_id);

CREATE TABLE IF NOT EXISTS test_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  assessment_id uuid REFERENCES assessments(id) ON DELETE SET NULL,
  student_id uuid REFERENCES students(id) ON DELETE SET NULL,
  started_at timestamptz,
  completed_at timestamptz,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS test_sessions_tenant_idx ON test_sessions (tenant_id);
CREATE INDEX IF NOT EXISTS test_sessions_assessment_idx ON test_sessions (assessment_id);

CREATE TABLE IF NOT EXISTS item_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES test_sessions(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  response_value text,
  is_correct boolean,
  response_time_ms integer,
  answered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS item_responses_tenant_idx ON item_responses (tenant_id);
CREATE INDEX IF NOT EXISTS item_responses_item_idx ON item_responses (item_id);
CREATE INDEX IF NOT EXISTS item_responses_session_idx ON item_responses (session_id);

CREATE TABLE IF NOT EXISTS survey_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES test_sessions(id) ON DELETE CASCADE,
  question_code text NOT NULL,
  response_value text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS survey_responses_session_idx ON survey_responses (session_id);

CREATE TABLE IF NOT EXISTS analysis_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  run_type text NOT NULL,
  params jsonb,
  data_range jsonb,
  dataset_hash text,
  software_version text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS analysis_runs_tenant_idx ON analysis_runs (tenant_id, created_at DESC);

CREATE TABLE IF NOT EXISTS item_ctt_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  analysis_run_id uuid NOT NULL REFERENCES analysis_runs(id) ON DELETE CASCADE,
  n integer NOT NULL,
  p_value numeric(6,4),
  discrimination numeric(6,4),
  point_biserial numeric(6,4),
  mean_time_ms numeric(10,2),
  std_time_ms numeric(10,2),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS item_ctt_stats_item_idx ON item_ctt_stats (item_id, created_at DESC);

CREATE TABLE IF NOT EXISTS item_irt_params (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  analysis_run_id uuid NOT NULL REFERENCES analysis_runs(id) ON DELETE CASCADE,
  model text NOT NULL,
  a_param numeric(8,4),
  b_param numeric(8,4),
  c_param numeric(8,4),
  d_param numeric(8,4),
  estimation_method text,
  n integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS item_irt_params_item_idx ON item_irt_params (item_id, created_at DESC);

CREATE TABLE IF NOT EXISTS item_exposure_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  analysis_run_id uuid NOT NULL REFERENCES analysis_runs(id) ON DELETE CASCADE,
  exposure_count integer NOT NULL,
  mean_time_ms numeric(10,2),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS item_exposure_stats_item_idx ON item_exposure_stats (item_id, created_at DESC);