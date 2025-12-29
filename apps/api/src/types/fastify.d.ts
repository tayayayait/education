import 'fastify';
import { Pool } from 'pg';
import { AuthUser, AuditLogEntry, RoleCode } from '../types';

declare module 'fastify' {
  interface FastifyInstance {
    db: Pool;
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    authorize: (allowed: RoleCode[]) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    auditLog: (entry: AuditLogEntry) => Promise<void>;
  }

  interface FastifyRequest {
    user?: AuthUser;
    tenantId?: string;
  }
}