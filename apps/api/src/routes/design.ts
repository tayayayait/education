import { FastifyInstance } from 'fastify';
import { AuthUser, RoleCode } from '../types';

const ALLOWED_ROLES: RoleCode[] = ['ADMIN', 'APPROVER', 'REVIEWER'];

type DesignArtifactPayload = {
  type: string;
  identifier: string;
  name?: string;
  description?: string;
};

type LinkPayload = {
  designArtifactId: string;
};

export const designRoutes = async (fastify: FastifyInstance) => {
  fastify.get('/design-artifacts', { preHandler: fastify.authenticate }, async (request) => {
    const tenantId = request.tenantId as string;
    const result = await fastify.db.query(
      'SELECT * FROM design_artifacts WHERE tenant_id = $1 ORDER BY created_at DESC',
      [tenantId]
    );
    return { items: result.rows };
  });

  fastify.post<{ Body: DesignArtifactPayload }>('/design-artifacts', {
    preHandler: [fastify.authenticate, fastify.authorize(ALLOWED_ROLES)]
  }, async (request, reply) => {
    const tenantId = request.tenantId as string;
    const user = request.user as AuthUser;
    const { type, identifier, name, description } = request.body;

    if (!type || !identifier) {
      reply.code(400).send({ message: 'type and identifier are required' });
      return;
    }

    const result = await fastify.db.query(
      `
      INSERT INTO design_artifacts
        (tenant_id, type, identifier, name, description, created_by)
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *
      `,
      [tenantId, type, identifier, name ?? null, description ?? null, user.id]
    );

    await fastify.auditLog({
      tenantId,
      actorUserId: user.id,
      action: 'DESIGN_ARTIFACT_CREATE',
      entityType: 'design_artifact',
      entityId: result.rows[0].id,
      afterData: { type, identifier, name },
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'] ?? null
    });

    reply.code(201).send({ item: result.rows[0] });
  });

  fastify.post<{ Body: LinkPayload }>('/requirements/:id/design-links', {
    preHandler: [fastify.authenticate, fastify.authorize(ALLOWED_ROLES)]
  }, async (request, reply) => {
    const tenantId = request.tenantId as string;
    const user = request.user as AuthUser;
    const { id } = request.params as { id: string };
    const { designArtifactId } = request.body;

    if (!designArtifactId) {
      reply.code(400).send({ message: 'designArtifactId is required' });
      return;
    }

    await fastify.db.query(
      `
      INSERT INTO requirement_design_links
        (requirement_id, design_artifact_id, tenant_id)
      VALUES ($1,$2,$3)
      ON CONFLICT DO NOTHING
      `,
      [id, designArtifactId, tenantId]
    );

    await fastify.auditLog({
      tenantId,
      actorUserId: user.id,
      action: 'REQUIREMENT_DESIGN_LINK',
      entityType: 'requirement',
      entityId: id,
      afterData: { designArtifactId },
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'] ?? null
    });

    reply.code(201).send({ ok: true });
  });

  fastify.get('/requirements/:id/design-links', { preHandler: fastify.authenticate }, async (request) => {
    const tenantId = request.tenantId as string;
    const { id } = request.params as { id: string };

    const result = await fastify.db.query(
      `
      SELECT da.*
      FROM requirement_design_links rdl
      JOIN design_artifacts da ON da.id = rdl.design_artifact_id
      WHERE rdl.tenant_id = $1 AND rdl.requirement_id = $2
      ORDER BY da.created_at DESC
      `,
      [tenantId, id]
    );

    return { items: result.rows };
  });
};
