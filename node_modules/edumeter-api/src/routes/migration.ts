import { FastifyInstance } from 'fastify';
import { AuthUser } from '../types';

export const migrationRoutes = async (fastify: FastifyInstance) => {
  fastify.post('/migrations/jobs', {
    preHandler: [fastify.authenticate, fastify.authorize(['ADMIN', 'APPROVER'])]
  }, async (request, reply) => {
    const tenantId = request.tenantId as string;
    const user = request.user as AuthUser;
    const { sourceName } = request.body as { sourceName: string };

    if (!sourceName) {
      reply.code(400).send({ message: 'sourceName is required' });
      return;
    }

    const result = await fastify.db.query(
      `
      INSERT INTO item_migration_jobs
        (tenant_id, source_name, created_by)
      VALUES ($1,$2,$3)
      RETURNING *
      `,
      [tenantId, sourceName, user.id]
    );

    await fastify.auditLog({
      tenantId,
      actorUserId: user.id,
      action: 'MIGRATION_JOB_CREATE',
      entityType: 'item_migration_job',
      entityId: result.rows[0].id,
      afterData: { sourceName },
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'] ?? null
    });

    reply.code(201).send({ item: result.rows[0] });
  });

  fastify.get('/migrations/jobs', { preHandler: fastify.authenticate }, async (request) => {
    const tenantId = request.tenantId as string;
    const result = await fastify.db.query(
      'SELECT * FROM item_migration_jobs WHERE tenant_id = $1 ORDER BY created_at DESC',
      [tenantId]
    );
    return { items: result.rows };
  });

  fastify.get('/migrations/jobs/:id', { preHandler: fastify.authenticate }, async (request, reply) => {
    const tenantId = request.tenantId as string;
    const { id } = request.params as { id: string };

    const jobResult = await fastify.db.query(
      'SELECT * FROM item_migration_jobs WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );

    if (jobResult.rowCount === 0) {
      reply.code(404).send({ message: 'Migration job not found' });
      return;
    }

    const logsResult = await fastify.db.query(
      'SELECT * FROM item_migration_logs WHERE job_id = $1 AND tenant_id = $2 ORDER BY created_at DESC',
      [id, tenantId]
    );

    return { item: jobResult.rows[0], logs: logsResult.rows };
  });

  fastify.post('/migrations/jobs/:id/complete', {
    preHandler: [fastify.authenticate, fastify.authorize(['ADMIN', 'APPROVER'])]
  }, async (request, reply) => {
    const tenantId = request.tenantId as string;
    const user = request.user as AuthUser;
    const { id } = request.params as { id: string };
    const { status, summary } = request.body as { status: 'completed' | 'failed'; summary?: unknown };

    if (!status) {
      reply.code(400).send({ message: 'status is required' });
      return;
    }

    const result = await fastify.db.query(
      `
      UPDATE item_migration_jobs
      SET status = $1,
          summary = $2,
          completed_at = now()
      WHERE id = $3 AND tenant_id = $4
      RETURNING *
      `,
      [status, summary ?? null, id, tenantId]
    );

    await fastify.auditLog({
      tenantId,
      actorUserId: user.id,
      action: 'MIGRATION_JOB_COMPLETE',
      entityType: 'item_migration_job',
      entityId: id,
      afterData: { status },
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'] ?? null
    });

    reply.send({ item: result.rows[0] });
  });

  fastify.post('/migrations/merge-rules', {
    preHandler: [fastify.authenticate, fastify.authorize(['ADMIN', 'APPROVER'])]
  }, async (request, reply) => {
    const tenantId = request.tenantId as string;
    const user = request.user as AuthUser;
    const { name, matchCriteria, resolution } = request.body as {
      name: string;
      matchCriteria: unknown;
      resolution: unknown;
    };

    if (!name || !matchCriteria || !resolution) {
      reply.code(400).send({ message: 'name, matchCriteria, resolution are required' });
      return;
    }

    const result = await fastify.db.query(
      `
      INSERT INTO item_merge_rules
        (tenant_id, name, match_criteria, resolution, created_by)
      VALUES ($1,$2,$3,$4,$5)
      RETURNING *
      `,
      [tenantId, name, matchCriteria, resolution, user.id]
    );

    await fastify.auditLog({
      tenantId,
      actorUserId: user.id,
      action: 'MERGE_RULE_CREATE',
      entityType: 'item_merge_rule',
      entityId: result.rows[0].id,
      afterData: { name },
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'] ?? null
    });

    reply.code(201).send({ item: result.rows[0] });
  });

  fastify.get('/migrations/merge-rules', { preHandler: fastify.authenticate }, async (request) => {
    const tenantId = request.tenantId as string;
    const result = await fastify.db.query(
      'SELECT * FROM item_merge_rules WHERE tenant_id = $1 ORDER BY created_at DESC',
      [tenantId]
    );
    return { items: result.rows };
  });
};