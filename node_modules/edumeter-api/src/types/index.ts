export type RoleCode = 'AUTHOR' | 'REVIEWER' | 'APPROVER' | 'ADMIN';

export type AuthUser = {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  roles: RoleCode[];
};

export type AuditLogEntry = {
  tenantId: string;
  actorUserId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  beforeData?: unknown;
  afterData?: unknown;
  ipAddress?: string | null;
  userAgent?: string | null;
};