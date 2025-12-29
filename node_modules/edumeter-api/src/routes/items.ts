import { FastifyInstance } from 'fastify';
import { AuthUser, RoleCode } from '../types';

const AUTHOR_ROLES: RoleCode[] = ['AUTHOR', 'ADMIN'];
const REVIEW_ROLES: RoleCode[] = ['REVIEWER', 'APPROVER', 'ADMIN'];
const APPROVE_ROLES: RoleCode[] = ['APPROVER', 'ADMIN'];

const STATUS_FLOW = {
  draft: ['review'],
  review: ['approved', 'draft'],
  approved: ['published', 'retired'],
  published: ['retired'],
  retired: []
} as const;

type ItemPayload = {
  code: string;
  title: string;
  subject: string;
  grade: string;
  content?: {
    curriculumCode?: string;
    standardCode?: string;
    standardDescription?: string;
    contentText?: string;
    metadata?: unknown;
  };
  purpose?: {
    purposeType: string;
    description?: string;
  };
  version?: {
    versionNumber: number;
    stem: string;
    options?: unknown;
    answer: string;
    explanation?: string;
  };
};

type ItemUpdatePayload = Partial<ItemPayload>;

type VersionPayload = {
  versionNumber: number;
  stem: string;
  options?: unknown;
  answer: string;
  explanation?: string;
};

const ensureStatusTransition = (fromStatus: string, toStatus: string) => {
  const allowed = (STATUS_FLOW as Record<string, readonly string[]>)[fromStatus] ?? [];
  if (!allowed.includes(toStatus)) {
    throw new Error(`Invalid status transition: ${fromStatus} -> ${toStatus}`);
  }
};

export const itemRoutes = async (fastify: FastifyInstance) => {
  fastify.get('/items', { preHandler: fastify.authenticate }, async (request) => {
    const tenantId = request.tenantId as string;
    const query = request.query as {
      subject?: string;
      grade?: string;
      status?: string;
      standardCode?: string;
      purposeType?: string;
      search?: string;
    };

    const filters: string[] = ['i.tenant_id = $1'];
    const params: Array<string> = [tenantId];
    let idx = 2;

    if (query.subject) {
      filters.push(`i.subject = $${idx}`);
      params.push(query.subject);
      idx += 1;
    }

    if (query.grade) {
      filters.push(`i.grade = $${idx}`);
      params.push(query.grade);
      idx += 1;
    }

    if (query.status) {
      filters.push(`i.status = $${idx}`);
      params.push(query.status);
      idx += 1;
    }

    if (query.standardCode) {
      filters.push(`ic.standard_code = $${idx}`);
      params.push(query.standardCode);
      idx += 1;
    }

    if (query.purposeType) {
      filters.push(`ip.purpose_type = $${idx}`);
      params.push(query.purposeType);
      idx += 1;
    }

    if (query.search) {
      filters.push(`(i.code ILIKE $${idx} OR i.title ILIKE $${idx})`);
      params.push(`%${query.search}%`);
      idx += 1;
    }

    const result = await fastify.db.query(
      `
      SELECT i.*, ic.standard_code, ic.standard_description, ip.purpose_type
      FROM items i
      LEFT JOIN item_contents ic ON ic.item_id = i.id
      LEFT JOIN item_purposes ip ON ip.item_id = i.id
      WHERE ${filters.join(' AND ')}
      ORDER BY i.created_at DESC
      `,
      params
    );

    return { items: result.rows };
  });

  fastify.get('/items/:id', { preHandler: fastify.authenticate }, async (request, reply) => {
    const tenantId = request.tenantId as string;
    const { id } = request.params as { id: string };

    const itemResult = await fastify.db.query(
      'SELECT * FROM items WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );

    if (itemResult.rowCount === 0) {
      reply.code(404).send({ message: 'Item not found' });
      return;
    }

    const contentResult = await fastify.db.query(
      'SELECT * FROM item_contents WHERE item_id = $1 AND tenant_id = $2',
      [id, tenantId]
    );
    const purposeResult = await fastify.db.query(
      'SELECT * FROM item_purposes WHERE item_id = $1 AND tenant_id = $2',
      [id, tenantId]
    );
    const versionResult = await fastify.db.query(
      'SELECT * FROM item_versions WHERE item_id = $1 AND tenant_id = $2 ORDER BY version_number DESC',
      [id, tenantId]
    );
    const historyResult = await fastify.db.query(
      'SELECT * FROM item_histories WHERE item_id = $1 AND tenant_id = $2 ORDER BY created_at DESC',
      [id, tenantId]
    );

    return {
      item: itemResult.rows[0],
      content: contentResult.rows[0] ?? null,
      purposes: purposeResult.rows,
      versions: versionResult.rows,
      history: historyResult.rows
    };
  });

  fastify.post<{ Body: ItemPayload }>('/items', {
    preHandler: [fastify.authenticate, fastify.authorize(AUTHOR_ROLES)]
  }, async (request, reply) => {
    const tenantId = request.tenantId as string;
    const user = request.user as AuthUser;
    const payload = request.body;

    if (!payload.code || !payload.title || !payload.subject || !payload.grade) {
      reply.code(400).send({ message: 'code, title, subject, grade are required' });
      return;
    }

    const client = await fastify.db.connect();
    try {
      await client.query('BEGIN');

      const itemResult = await client.query(
        `
        INSERT INTO items
          (tenant_id, code, title, subject, grade, status, created_by, updated_by)
        VALUES ($1,$2,$3,$4,$5,'draft',$6,$6)
        RETURNING *
        `,
        [tenantId, payload.code, payload.title, payload.subject, payload.grade, user.id]
      );
      const item = itemResult.rows[0];

      if (payload.content) {
        await client.query(
          `
          INSERT INTO item_contents
            (tenant_id, item_id, curriculum_code, standard_code, standard_description, content_text, metadata)
          VALUES ($1,$2,$3,$4,$5,$6,$7)
          `,
          [
            tenantId,
            item.id,
            payload.content.curriculumCode ?? null,
            payload.content.standardCode ?? null,
            payload.content.standardDescription ?? null,
            payload.content.contentText ?? null,
            payload.content.metadata ?? null
          ]
        );
      }

      if (payload.purpose) {
        await client.query(
          `
          INSERT INTO item_purposes
            (tenant_id, item_id, purpose_type, description)
          VALUES ($1,$2,$3,$4)
          `,
          [tenantId, item.id, payload.purpose.purposeType, payload.purpose.description ?? null]
        );
      }

      if (payload.version) {
        const versionResult = await client.query(
          `
          INSERT INTO item_versions
            (tenant_id, item_id, version_number, stem, options, answer, explanation, created_by)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
          RETURNING id
          `,
          [
            tenantId,
            item.id,
            payload.version.versionNumber,
            payload.version.stem,
            payload.version.options ?? null,
            payload.version.answer,
            payload.version.explanation ?? null,
            user.id
          ]
        );

        const versionId = versionResult.rows[0]?.id;
        await client.query(
          'UPDATE items SET current_version_id = $1 WHERE id = $2 AND tenant_id = $3',
          [versionId, item.id, tenantId]
        );
      }

      await client.query(
        `
        INSERT INTO item_histories
          (tenant_id, item_id, action, from_status, to_status, note, created_by)
        VALUES ($1,$2,$3,$4,$5,$6,$7)
        `,
        [tenantId, item.id, 'CREATE', null, 'draft', null, user.id]
      );

      await client.query('COMMIT');

      await fastify.auditLog({
        tenantId,
        actorUserId: user.id,
        action: 'ITEM_CREATE',
        entityType: 'item',
        entityId: item.id,
        afterData: payload,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'] ?? null
      });

      reply.code(201).send({ item });
    } catch (error) {
      await client.query('ROLLBACK');
      const message = error instanceof Error ? error.message : 'Item creation failed';
      reply.code(400).send({ message });
    } finally {
      client.release();
    }
  });

  fastify.put<{ Body: ItemUpdatePayload }>('/items/:id', {
    preHandler: [fastify.authenticate, fastify.authorize(AUTHOR_ROLES)]
  }, async (request, reply) => {
    const tenantId = request.tenantId as string;
    const user = request.user as AuthUser;
    const { id } = request.params as { id: string };
    const payload = request.body;

    const itemResult = await fastify.db.query(
      'SELECT * FROM items WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );

    if (itemResult.rowCount === 0) {
      reply.code(404).send({ message: 'Item not found' });
      return;
    }

    const existing = itemResult.rows[0];

    if (!['draft', 'review'].includes(existing.status) && !user.roles.includes('ADMIN')) {
      reply.code(400).send({ message: 'Only draft/review items can be updated' });
      return;
    }

    const client = await fastify.db.connect();
    try {
      await client.query('BEGIN');

      const updated = await client.query(
        `
        UPDATE items
        SET code = $1,
            title = $2,
            subject = $3,
            grade = $4,
            updated_by = $5,
            updated_at = now()
        WHERE id = $6 AND tenant_id = $7
        RETURNING *
        `,
        [
          payload.code ?? existing.code,
          payload.title ?? existing.title,
          payload.subject ?? existing.subject,
          payload.grade ?? existing.grade,
          user.id,
          id,
          tenantId
        ]
      );

      if (payload.content) {
        await client.query(
          `
          INSERT INTO item_contents
            (tenant_id, item_id, curriculum_code, standard_code, standard_description, content_text, metadata)
          VALUES ($1,$2,$3,$4,$5,$6,$7)
          ON CONFLICT (item_id)
          DO UPDATE SET
            curriculum_code = EXCLUDED.curriculum_code,
            standard_code = EXCLUDED.standard_code,
            standard_description = EXCLUDED.standard_description,
            content_text = EXCLUDED.content_text,
            metadata = EXCLUDED.metadata
          `,
          [
            tenantId,
            id,
            payload.content.curriculumCode ?? null,
            payload.content.standardCode ?? null,
            payload.content.standardDescription ?? null,
            payload.content.contentText ?? null,
            payload.content.metadata ?? null
          ]
        );
      }

      if (payload.purpose) {
        await client.query(
          `
          INSERT INTO item_purposes
            (tenant_id, item_id, purpose_type, description)
          VALUES ($1,$2,$3,$4)
          `,
          [tenantId, id, payload.purpose.purposeType, payload.purpose.description ?? null]
        );
      }

      await client.query(
        `
        INSERT INTO item_histories
          (tenant_id, item_id, action, from_status, to_status, note, created_by)
        VALUES ($1,$2,$3,$4,$5,$6,$7)
        `,
        [tenantId, id, 'UPDATE', existing.status, existing.status, null, user.id]
      );

      await client.query('COMMIT');

      await fastify.auditLog({
        tenantId,
        actorUserId: user.id,
        action: 'ITEM_UPDATE',
        entityType: 'item',
        entityId: id,
        beforeData: existing,
        afterData: payload,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'] ?? null
      });

      reply.send({ item: updated.rows[0] });
    } catch (error) {
      await client.query('ROLLBACK');
      const message = error instanceof Error ? error.message : 'Item update failed';
      reply.code(400).send({ message });
    } finally {
      client.release();
    }
  });

  fastify.post<{ Body: VersionPayload }>('/items/:id/versions', {
    preHandler: [fastify.authenticate, fastify.authorize(AUTHOR_ROLES)]
  }, async (request, reply) => {
    const tenantId = request.tenantId as string;
    const user = request.user as AuthUser;
    const { id } = request.params as { id: string };
    const payload = request.body;

    if (!payload || !payload.versionNumber || !payload.stem || !payload.answer) {
      reply.code(400).send({ message: 'versionNumber, stem, answer are required' });
      return;
    }

    const versionResult = await fastify.db.query(
      `
      INSERT INTO item_versions
        (tenant_id, item_id, version_number, stem, options, answer, explanation, created_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING *
      `,
      [
        tenantId,
        id,
        payload.versionNumber,
        payload.stem,
        payload.options ?? null,
        payload.answer,
        payload.explanation ?? null,
        user.id
      ]
    );

    const versionId = versionResult.rows[0]?.id;
    await fastify.db.query(
      'UPDATE items SET current_version_id = $1, updated_by = $2, updated_at = now() WHERE id = $3 AND tenant_id = $4',
      [versionId, user.id, id, tenantId]
    );

    await fastify.db.query(
      `
      INSERT INTO item_histories
        (tenant_id, item_id, action, from_status, to_status, note, created_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      `,
      [tenantId, id, 'VERSION_CREATE', null, null, `version:${payload.versionNumber}`, user.id]
    );

    await fastify.auditLog({
      tenantId,
      actorUserId: user.id,
      action: 'ITEM_VERSION_CREATE',
      entityType: 'item',
      entityId: id,
      afterData: { versionId, versionNumber: payload.versionNumber },
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'] ?? null
    });

    reply.code(201).send({ itemVersion: versionResult.rows[0] });
  });

  const transitionStatus = async (
    request: any,
    reply: any,
    toStatus: string,
    allowedRoles: RoleCode[],
    action: string
  ) => {
    const tenantId = request.tenantId as string;
    const user = request.user as AuthUser;
    const { id } = request.params as { id: string };

    const itemResult = await fastify.db.query(
      'SELECT * FROM items WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );

    if (itemResult.rowCount === 0) {
      reply.code(404).send({ message: 'Item not found' });
      return;
    }

    const item = itemResult.rows[0];

    try {
      ensureStatusTransition(item.status, toStatus);
    } catch (error) {
      reply.code(400).send({ message: error instanceof Error ? error.message : 'Invalid transition' });
      return;
    }

    const updated = await fastify.db.query(
      `
      UPDATE items
      SET status = $1, updated_by = $2, updated_at = now()
      WHERE id = $3 AND tenant_id = $4
      RETURNING *
      `,
      [toStatus, user.id, id, tenantId]
    );

    await fastify.db.query(
      `
      INSERT INTO item_histories
        (tenant_id, item_id, action, from_status, to_status, created_by)
      VALUES ($1,$2,$3,$4,$5,$6)
      `,
      [tenantId, id, action, item.status, toStatus, user.id]
    );

    await fastify.auditLog({
      tenantId,
      actorUserId: user.id,
      action,
      entityType: 'item',
      entityId: id,
      beforeData: { status: item.status },
      afterData: { status: toStatus },
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'] ?? null
    });

    reply.send({ item: updated.rows[0] });
  };

  fastify.post('/items/:id/submit-review', {
    preHandler: [fastify.authenticate, fastify.authorize(AUTHOR_ROLES)]
  }, async (request, reply) => {
    await transitionStatus(request, reply, 'review', AUTHOR_ROLES, 'ITEM_SUBMIT_REVIEW');
  });

  fastify.post('/items/:id/approve', {
    preHandler: [fastify.authenticate, fastify.authorize(REVIEW_ROLES)]
  }, async (request, reply) => {
    await transitionStatus(request, reply, 'approved', REVIEW_ROLES, 'ITEM_APPROVE');
  });

  fastify.post('/items/:id/reject', {
    preHandler: [fastify.authenticate, fastify.authorize(REVIEW_ROLES)]
  }, async (request, reply) => {
    await transitionStatus(request, reply, 'draft', REVIEW_ROLES, 'ITEM_REJECT');
  });

  fastify.post('/items/:id/publish', {
    preHandler: [fastify.authenticate, fastify.authorize(APPROVE_ROLES)]
  }, async (request, reply) => {
    await transitionStatus(request, reply, 'published', APPROVE_ROLES, 'ITEM_PUBLISH');
  });

  fastify.post('/items/:id/retire', {
    preHandler: [fastify.authenticate, fastify.authorize(APPROVE_ROLES)]
  }, async (request, reply) => {
    await transitionStatus(request, reply, 'retired', APPROVE_ROLES, 'ITEM_RETIRE');
  });

  fastify.get('/items/:id/history', { preHandler: fastify.authenticate }, async (request) => {
    const tenantId = request.tenantId as string;
    const { id } = request.params as { id: string };
    const result = await fastify.db.query(
      'SELECT * FROM item_histories WHERE item_id = $1 AND tenant_id = $2 ORDER BY created_at DESC',
      [id, tenantId]
    );
    return { items: result.rows };
  });

  const allowSupplemental = async (request: any, reply: any) => {
    const apiKey = process.env.SUPPLEMENTAL_API_KEY;
    const rawKey = request.headers['x-api-key'];
    const headerKey = Array.isArray(rawKey) ? rawKey[0] : rawKey;

    if (apiKey && headerKey === apiKey) {
      const rawTenant = request.headers['x-tenant-id'];
      const headerTenant = Array.isArray(rawTenant) ? rawTenant[0] : rawTenant;
      if (!headerTenant) {
        reply.code(400).send({ message: 'X-Tenant-Id is required' });
        return;
      }
      request.tenantId = headerTenant;
      return;
    }

    await fastify.authenticate(request, reply);
  };

  fastify.get('/supplemental/items', { preHandler: allowSupplemental }, async (request) => {
    const tenantId = request.tenantId as string;
    const query = request.query as { limit?: string; purposeType?: string };
    const limit = Math.min(Number(query.limit ?? 50), 200);
    const purposeType = query.purposeType ?? 'supplemental';

    const result = await fastify.db.query(
      `
      SELECT i.*, ic.standard_code, ic.standard_description
      FROM items i
      LEFT JOIN item_contents ic ON ic.item_id = i.id
      LEFT JOIN item_purposes ip ON ip.item_id = i.id
      WHERE i.tenant_id = $1 AND i.status = 'published' AND ip.purpose_type = $2
      ORDER BY i.created_at DESC
      LIMIT $3
      `,
      [tenantId, purposeType, limit]
    );

    return { items: result.rows };
  });
};
