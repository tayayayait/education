CREATE TABLE IF NOT EXISTS prompt_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  subject text,
  grade text,
  difficulty text,
  intent text,
  core_concept text,
  template text NOT NULL,
  version integer NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS prompt_templates_code_version_uq ON prompt_templates (tenant_id, code, version);
CREATE INDEX IF NOT EXISTS prompt_templates_active_idx ON prompt_templates (tenant_id, code, is_active);

CREATE TABLE IF NOT EXISTS generation_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  prompt_template_id uuid NOT NULL REFERENCES prompt_templates(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'generated',
  model_name text,
  model_version text,
  parameters jsonb,
  prompt_snapshot text,
  requested_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS generation_runs_tenant_idx ON generation_runs (tenant_id, created_at DESC);

CREATE TABLE IF NOT EXISTS generation_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  run_id uuid NOT NULL REFERENCES generation_runs(id) ON DELETE CASCADE,
  sequence integer NOT NULL,
  status text NOT NULL DEFAULT 'generated',
  stem text NOT NULL,
  options jsonb,
  answer text NOT NULL,
  explanation text,
  metadata jsonb,
  item_id uuid REFERENCES items(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS generation_items_run_idx ON generation_items (run_id, created_at DESC);
CREATE INDEX IF NOT EXISTS generation_items_status_idx ON generation_items (tenant_id, status);

CREATE TABLE IF NOT EXISTS generation_validations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  generation_item_id uuid NOT NULL REFERENCES generation_items(id) ON DELETE CASCADE,
  rule_name text NOT NULL,
  status text NOT NULL,
  message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS generation_validations_item_idx ON generation_validations (generation_item_id);

CREATE TABLE IF NOT EXISTS generation_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  generation_item_id uuid NOT NULL REFERENCES generation_items(id) ON DELETE CASCADE,
  reviewer_id uuid REFERENCES users(id) ON DELETE SET NULL,
  decision text NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS generation_reviews_item_idx ON generation_reviews (generation_item_id);

CREATE TABLE IF NOT EXISTS generation_usages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  generation_item_id uuid NOT NULL REFERENCES generation_items(id) ON DELETE CASCADE,
  item_id uuid REFERENCES items(id) ON DELETE SET NULL,
  used_in text,
  used_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS generation_usages_item_idx ON generation_usages (generation_item_id);