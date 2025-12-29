INSERT INTO roles (code, name)
VALUES
  ('AUTHOR', 'Author'),
  ('REVIEWER', 'Reviewer'),
  ('APPROVER', 'Approver'),
  ('ADMIN', 'Admin')
ON CONFLICT (code) DO NOTHING;