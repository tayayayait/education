import fp from 'fastify-plugin';
import { AuditLogEntry } from '../types';

const auditPlugin = fp(async (fastify) => {
  fastify.decorate('auditLog', async (entry: AuditLogEntry) => {
    const {
      tenantId,
      actorUserId,
      action,
      entityType,
      entityId,
      beforeData,
      afterData,
      ipAddress,
      userAgent
    } = entry;

    await fastify.db.query(
      `
      INSERT INTO audit_logs (
        tenant_id,
        actor_user_id,
        action,
        entity_type,
        entity_id,
        before_data,
        after_data,
        ip_address,
        user_agent
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      `,
      [
        tenantId,
        actorUserId ?? null,
        action,
        entityType,
        entityId ?? null,
        beforeData ?? null,
        afterData ?? null,
        ipAddress ?? null,
        userAgent ?? null
      ]
    );
  });
});

export default auditPlugin;