CREATE TABLE IF NOT EXISTS requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  code text NOT NULL,
  category text NOT NULL,
  name text NOT NULL,
  description text,
  definition text,
  details text,
  deliverables text,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS requirements_tenant_code_uq ON requirements (tenant_id, code);
CREATE INDEX IF NOT EXISTS requirements_tenant_idx ON requirements (tenant_id);

CREATE TABLE IF NOT EXISTS requirement_interpretations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  requirement_id uuid NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
  raw_text text,
  acceptance_criteria text NOT NULL,
  rationale text,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS requirement_interpretations_req_idx ON requirement_interpretations (requirement_id);

CREATE TABLE IF NOT EXISTS requirement_baselines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  version text NOT NULL,
  title text,
  description text,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS requirement_baselines_tenant_version_uq ON requirement_baselines (tenant_id, version);

CREATE TABLE IF NOT EXISTS requirement_baseline_items (
  baseline_id uuid NOT NULL REFERENCES requirement_baselines(id) ON DELETE CASCADE,
  requirement_id uuid NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
  code text NOT NULL,
  category text NOT NULL,
  name text NOT NULL,
  description text,
  definition text,
  details text,
  deliverables text,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (baseline_id, requirement_id)
);

CREATE TABLE IF NOT EXISTS change_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  requirement_id uuid NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  impact_summary text,
  status text NOT NULL DEFAULT 'requested',
  requested_by uuid REFERENCES users(id) ON DELETE SET NULL,
  approved_by uuid REFERENCES users(id) ON DELETE SET NULL,
  requested_at timestamptz NOT NULL DEFAULT now(),
  approved_at timestamptz,
  implemented_at timestamptz
);

CREATE INDEX IF NOT EXISTS change_requests_req_idx ON change_requests (requirement_id);