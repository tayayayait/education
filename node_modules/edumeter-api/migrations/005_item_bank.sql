CREATE TABLE IF NOT EXISTS items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  code text NOT NULL,
  title text NOT NULL,
  subject text NOT NULL,
  grade text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  current_version_id uuid,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS items_tenant_code_uq ON items (tenant_id, code);
CREATE INDEX IF NOT EXISTS items_tenant_idx ON items (tenant_id);
CREATE INDEX IF NOT EXISTS items_status_idx ON items (tenant_id, status);
CREATE INDEX IF NOT EXISTS items_subject_grade_idx ON items (tenant_id, subject, grade);

CREATE TABLE IF NOT EXISTS item_contents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  curriculum_code text,
  standard_code text,
  standard_description text,
  content_text text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS item_contents_item_idx ON item_contents (item_id);
CREATE UNIQUE INDEX IF NOT EXISTS item_contents_item_uq ON item_contents (item_id);

CREATE TABLE IF NOT EXISTS item_purposes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  purpose_type text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS item_purposes_item_idx ON item_purposes (item_id);

CREATE TABLE IF NOT EXISTS item_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  version_number integer NOT NULL,
  stem text NOT NULL,
  options jsonb,
  answer text NOT NULL,
  explanation text,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS item_versions_unique ON item_versions (item_id, version_number);

ALTER TABLE items
  ADD CONSTRAINT IF NOT EXISTS items_current_version_fk
  FOREIGN KEY (current_version_id) REFERENCES item_versions(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS item_histories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  action text NOT NULL,
  from_status text,
  to_status text,
  note text,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS item_histories_item_idx ON item_histories (item_id);
