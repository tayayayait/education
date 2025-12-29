CREATE TABLE IF NOT EXISTS item_detection_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  detection_type text NOT NULL,
  metric_name text NOT NULL,
  metric_value numeric(10,4),
  threshold numeric(10,4),
  status text NOT NULL DEFAULT 'flagged',
  details jsonb,
  analysis_run_id uuid REFERENCES analysis_runs(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS item_detection_results_item_idx ON item_detection_results (item_id, created_at DESC);

CREATE TABLE IF NOT EXISTS item_detection_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  detection_id uuid NOT NULL REFERENCES item_detection_results(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  note text,
  action_status text NOT NULL DEFAULT 'pending',
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS item_detection_actions_idx ON item_detection_actions (detection_id);

CREATE TABLE IF NOT EXISTS item_migration_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  source_name text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  summary jsonb,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS item_migration_jobs_tenant_idx ON item_migration_jobs (tenant_id, created_at DESC);

CREATE TABLE IF NOT EXISTS item_migration_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES item_migration_jobs(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  item_id uuid REFERENCES items(id) ON DELETE SET NULL,
  action text NOT NULL,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS item_migration_logs_job_idx ON item_migration_logs (job_id);

CREATE TABLE IF NOT EXISTS item_merge_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  match_criteria jsonb NOT NULL,
  resolution jsonb NOT NULL,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS item_merge_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  source_item_code text NOT NULL,
  target_item_id uuid REFERENCES items(id) ON DELETE SET NULL,
  rule_id uuid REFERENCES item_merge_rules(id) ON DELETE SET NULL,
  mapping_result text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);