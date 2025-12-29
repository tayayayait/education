import { FastifyInstance } from 'fastify';
import ExcelJS from 'exceljs';
import { AuthUser, RoleCode } from '../types';

const ADMIN_ROLES: RoleCode[] = ['ADMIN', 'APPROVER', 'REVIEWER', 'AUTHOR'];

type RequirementPayload = {
  code: string;
  category: string;
  name: string;
  description?: string;
  definition?: string;
  details?: string;
  deliverables?: string;
};

type ImportPayload = {
  format: 'csv' | 'json';
  data: string | RequirementPayload[];
  baselineVersion?: string;
  baselineTitle?: string;
  baselineDescription?: string;
};

type BaselinePayload = {
  version: string;
  title?: string;
  description?: string;
};

type InterpretationPayload = {
  rawText?: string;
  acceptanceCriteria: string;
  rationale?: string;
};

type ChangeRequestPayload = {
  title: string;
  description?: string;
  impactSummary?: string;
};

type ChangeRequestUpdatePayload = {
  status?: 'requested' | 'approved' | 'rejected' | 'implemented';
  approved?: boolean;
  implemented?: boolean;
};

const parseCsv = (input: string): RequirementPayload[] => {
  const lines = input.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return [];

  const parseLine = (line: string) => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = !inQuotes;
        }
        continue;
      }

      if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  };

  const headers = parseLine(lines[0]).map((h, idx) => {
    const cleaned = h.trim();
    return idx === 0 ? cleaned.replace(/^\uFEFF/, '') : cleaned;
  });
  return lines.slice(1).map((line) => {
    const values = parseLine(line);
    const record: Record<string, string> = {};
    headers.forEach((header, idx) => {
      record[header] = values[idx] ?? '';
    });

    return {
      code: record['code'] ?? record['?⑥쥙?甕곕뜇??] ?? '',
      category: record['category'] ?? record['?브쑬履?] ?? '',
      name: record['name'] ?? record['筌뤿굞臾?] ?? '',
      description: record['description'] ?? record['?怨멸쉭??살구'] ?? '',
      definition: record['definition'] ?? record['?類ㅼ벥'] ?? '',
      details: record['details'] ?? record['?紐???곸뒠'] ?? '',
      deliverables: record['deliverables'] ?? record['?怨쀭뀱??] ?? ''
    };
  });
};

const normalizeRequirement = (item: RequirementPayload): RequirementPayload => ({
  code: item.code?.trim(),
  category: item.category?.trim(),
  name: item.name?.trim(),
  description: item.description?.trim() || undefined,
  definition: item.definition?.trim() || undefined,
  details: item.details?.trim() || undefined,
  deliverables: item.deliverables?.trim() || undefined
});

const csvEscape = (value: string) => {
  const needsQuotes = /[",\n]/.test(value);
  const escaped = value.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
};

export const requirementsRoutes = async (fastify: FastifyInstance) => {
  fastify.get('/requirements', { preHandler: fastify.authenticate }, async (request) => {
    const tenantId = request.tenantId as string;
    const { category, search } = request.query as { category?: string; search?: string };

    const filters: string[] = ['tenant_id = $1'];
    const params: Array<string> = [tenantId];
    let idx = 2;

    if (category) {
      filters.push(`category = $${idx}`);
      params.push(category);
      idx += 1;
    }

    if (search) {
      filters.push(`(code ILIKE $${idx} OR name ILIKE $${idx})`);
      params.push(`%${search}%`);
      idx += 1;
    }

    const result = await fastify.db.query(
      `SELECT * FROM requirements WHERE ${filters.join(' AND ')} ORDER BY code`,
      params
    );

    return { items: result.rows };
  });

  fastify.get('/requirements/:id', { preHandler: fastify.authenticate }, async (request, reply) => {
    const tenantId = request.tenantId as string;
    const { id } = request.params as { id: string };

    const result = await fastify.db.query(
      'SELECT * FROM requirements WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );

    if (result.rowCount === 0) {
      reply.code(404).send({ message: 'Requirement not found' });
      return;
    }

    return { item: result.rows[0] };
  });

  fastify.post<{ Body: RequirementPayload }>('/requirements', {
    preHandler: [fastify.authenticate, fastify.authorize(ADMIN_ROLES)]
  }, async (request, reply) => {
    const tenantId = request.tenantId as string;
    const user = request.user as AuthUser;
    const payload = normalizeRequirement(request.body);

    if (!payload.code || !payload.category || !payload.name) {
      reply.code(400).send({ message: 'code, category, name are required' });
      return;
    }

    const result = await fastify.db.query(
      `
      INSERT INTO requirements
        (tenant_id, code, category, name, description, definition, details, deliverables, created_by, updated_by)
      VALUES
        ($1,$2,$3,$4,$5,$6,$7,$8,$9,$9)
      RETURNING *
      `,
      [
        tenantId,
        payload.code,
        payload.category,
        payload.name,
        payload.description ?? null,
        payload.definition ?? null,
        payload.details ?? null,
        payload.deliverables ?? null,
        user.id
      ]
    );

    await fastify.auditLog({
      tenantId,
      actorUserId: user.id,
      action: 'REQUIREMENT_CREATE',
      entityType: 'requirement',
      entityId: result.rows[0].id,
      afterData: payload,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'] ?? null
    });

    reply.code(201).send({ item: result.rows[0] });
  });

  fastify.put<{ Body: RequirementPayload }>('/requirements/:id', {
    preHandler: [fastify.authenticate, fastify.authorize(ADMIN_ROLES)]
  }, async (request, reply) => {
    const tenantId = request.tenantId as string;
    const user = request.user as AuthUser;
    const { id } = request.params as { id: string };
    const payload = normalizeRequirement(request.body);

    if (!payload.code || !payload.category || !payload.name) {
      reply.code(400).send({ message: 'code, category, name are required' });
      return;
    }

    const existing = await fastify.db.query(
      'SELECT * FROM requirements WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );

    if (existing.rowCount === 0) {
      reply.code(404).send({ message: 'Requirement not found' });
      return;
    }

    const result = await fastify.db.query(
      `
      UPDATE requirements
      SET code = $1,
          category = $2,
          name = $3,
          description = $4,
          definition = $5,
          details = $6,
          deliverables = $7,
          updated_by = $8,
          updated_at = now()
      WHERE id = $9 AND tenant_id = $10
      RETURNING *
      `,
      [
        payload.code,
        payload.category,
        payload.name,
        payload.description ?? null,
        payload.definition ?? null,
        payload.details ?? null,
        payload.deliverables ?? null,
        user.id,
        id,
        tenantId
      ]
    );

    await fastify.auditLog({
      tenantId,
      actorUserId: user.id,
      action: 'REQUIREMENT_UPDATE',
      entityType: 'requirement',
      entityId: id,
      beforeData: existing.rows[0],
      afterData: payload,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'] ?? null
    });

    reply.send({ item: result.rows[0] });
  });

  fastify.delete('/requirements/:id', {
    preHandler: [fastify.authenticate, fastify.authorize(['ADMIN', 'APPROVER'])]
  }, async (request, reply) => {
    const tenantId = request.tenantId as string;
    const user = request.user as AuthUser;
    const { id } = request.params as { id: string };

    const existing = await fastify.db.query(
      'SELECT * FROM requirements WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );

    if (existing.rowCount === 0) {
      reply.code(404).send({ message: 'Requirement not found' });
      return;
    }

    await fastify.db.query(
      'DELETE FROM requirements WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );

    await fastify.auditLog({
      tenantId,
      actorUserId: user.id,
      action: 'REQUIREMENT_DELETE',
      entityType: 'requirement',
      entityId: id,
      beforeData: existing.rows[0],
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'] ?? null
    });

    reply.code(204).send();
  });

  fastify.post<{ Body: ImportPayload }>('/requirements/import', {
    preHandler: [fastify.authenticate, fastify.authorize(['ADMIN', 'APPROVER'])]
  }, async (request, reply) => {
    const tenantId = request.tenantId as string;
    const user = request.user as AuthUser;
    const payload = request.body;

    if (!payload || !payload.format) {
      reply.code(400).send({ message: 'format is required' });
      return;
    }

    let records: RequirementPayload[] = [];
    if (payload.format === 'csv') {
      records = parseCsv(typeof payload.data === 'string' ? payload.data : '');
    } else {
      if (typeof payload.data === 'string') {
        try {
          records = JSON.parse(payload.data) as RequirementPayload[];
        } catch {
          reply.code(400).send({ message: 'Invalid JSON payload' });
          return;
        }
      } else if (Array.isArray(payload.data)) {
        records = payload.data;
      }
    }

    const normalized = records
      .map(normalizeRequirement)
      .filter(item => item.code && item.category && item.name);

    if (normalized.length === 0) {
      reply.code(400).send({ message: 'No valid requirements found' });
      return;
    }

    const client = await fastify.db.connect();
    try {
      await client.query('BEGIN');

      for (const item of normalized) {
        await client.query(
          `
          INSERT INTO requirements
            (tenant_id, code, category, name, description, definition, details, deliverables, created_by, updated_by)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$9)
          ON CONFLICT (tenant_id, code)
          DO UPDATE SET
            category = EXCLUDED.category,
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            definition = EXCLUDED.definition,
            details = EXCLUDED.details,
            deliverables = EXCLUDED.deliverables,
            updated_by = EXCLUDED.updated_by,
            updated_at = now()
          `,
          [
            tenantId,
            item.code,
            item.category,
            item.name,
            item.description ?? null,
            item.definition ?? null,
            item.details ?? null,
            item.deliverables ?? null,
            user.id
          ]
        );
      }

      let baselineId: string | null = null;
      if (payload.baselineVersion) {
        const baselineResult = await client.query(
          `
          INSERT INTO requirement_baselines (tenant_id, version, title, description, created_by)
          VALUES ($1,$2,$3,$4,$5)
          RETURNING id
          `,
          [
            tenantId,
            payload.baselineVersion,
            payload.baselineTitle ?? null,
            payload.baselineDescription ?? null,
            user.id
          ]
        );
        baselineId = baselineResult.rows[0]?.id ?? null;

        if (baselineId) {
          await client.query(
            `
            INSERT INTO requirement_baseline_items
              (baseline_id, requirement_id, code, category, name, description, definition, details, deliverables)
            SELECT $1, id, code, category, name, description, definition, details, deliverables
            FROM requirements
            WHERE tenant_id = $2
            `,
            [baselineId, tenantId]
          );
        }
      }

      await client.query('COMMIT');

      await fastify.auditLog({
        tenantId,
        actorUserId: user.id,
        action: 'REQUIREMENT_IMPORT',
        entityType: 'requirement',
        entityId: null,
        afterData: { count: normalized.length, baselineId },
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'] ?? null
      });

      reply.send({ imported: normalized.length, baselineId });
    } catch (error) {
      await client.query('ROLLBACK');
      const message = error instanceof Error ? error.message : 'Import failed';
      reply.code(400).send({ message });
    } finally {
      client.release();
    }
  });

  fastify.post<{ Body: BaselinePayload }>('/requirements/baselines', {
    preHandler: [fastify.authenticate, fastify.authorize(['ADMIN', 'APPROVER'])]
  }, async (request, reply) => {
    const tenantId = request.tenantId as string;
    const user = request.user as AuthUser;
    const { version, title, description } = request.body;

    if (!version) {
      reply.code(400).send({ message: 'version is required' });
      return;
    }

    const client = await fastify.db.connect();
    try {
      await client.query('BEGIN');

      const baselineResult = await client.query(
        `
        INSERT INTO requirement_baselines (tenant_id, version, title, description, created_by)
        VALUES ($1,$2,$3,$4,$5)
        RETURNING id
        `,
        [tenantId, version, title ?? null, description ?? null, user.id]
      );
      const baselineId = baselineResult.rows[0]?.id as string;

      await client.query(
        `
        INSERT INTO requirement_baseline_items
          (baseline_id, requirement_id, code, category, name, description, definition, details, deliverables)
        SELECT $1, id, code, category, name, description, definition, details, deliverables
        FROM requirements
        WHERE tenant_id = $2
        `,
        [baselineId, tenantId]
      );

      await client.query('COMMIT');

      await fastify.auditLog({
        tenantId,
        actorUserId: user.id,
        action: 'REQUIREMENT_BASELINE_CREATE',
        entityType: 'requirement_baseline',
        entityId: baselineId,
        afterData: { version },
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'] ?? null
      });

      reply.code(201).send({ id: baselineId, version });
    } catch (error) {
      await client.query('ROLLBACK');
      const message = error instanceof Error ? error.message : 'Baseline creation failed';
      reply.code(400).send({ message });
    } finally {
      client.release();
    }
  });

  fastify.get('/requirements/baselines', { preHandler: fastify.authenticate }, async (request) => {
    const tenantId = request.tenantId as string;
    const result = await fastify.db.query(
      'SELECT * FROM requirement_baselines WHERE tenant_id = $1 ORDER BY created_at DESC',
      [tenantId]
    );
    return { items: result.rows };
  });

  fastify.post<{ Body: InterpretationPayload }>('/requirements/:id/interpretations', {
    preHandler: [fastify.authenticate, fastify.authorize(['ADMIN', 'APPROVER', 'REVIEWER'])]
  }, async (request, reply) => {
    const tenantId = request.tenantId as string;
    const user = request.user as AuthUser;
    const { id } = request.params as { id: string };
    const { rawText, acceptanceCriteria, rationale } = request.body;

    if (!acceptanceCriteria) {
      reply.code(400).send({ message: 'acceptanceCriteria is required' });
      return;
    }

    const result = await fastify.db.query(
      `
      INSERT INTO requirement_interpretations
        (tenant_id, requirement_id, raw_text, acceptance_criteria, rationale, created_by)
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *
      `,
      [tenantId, id, rawText ?? null, acceptanceCriteria, rationale ?? null, user.id]
    );

    await fastify.auditLog({
      tenantId,
      actorUserId: user.id,
      action: 'REQUIREMENT_INTERPRETATION_CREATE',
      entityType: 'requirement_interpretation',
      entityId: result.rows[0].id,
      afterData: { requirementId: id, acceptanceCriteria },
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'] ?? null
    });

    reply.code(201).send({ item: result.rows[0] });
  });

  fastify.get('/requirements/:id/interpretations', { preHandler: fastify.authenticate }, async (request) => {
    const tenantId = request.tenantId as string;
    const { id } = request.params as { id: string };

    const result = await fastify.db.query(
      `
      SELECT * FROM requirement_interpretations
      WHERE tenant_id = $1 AND requirement_id = $2
      ORDER BY created_at DESC
      `,
      [tenantId, id]
    );

    return { items: result.rows };
  });

  fastify.post<{ Body: ChangeRequestPayload }>('/requirements/:id/change-requests', {
    preHandler: [fastify.authenticate, fastify.authorize(['ADMIN', 'APPROVER', 'REVIEWER'])]
  }, async (request, reply) => {
    const tenantId = request.tenantId as string;
    const user = request.user as AuthUser;
    const { id } = request.params as { id: string };
    const { title, description, impactSummary } = request.body;

    if (!title) {
      reply.code(400).send({ message: 'title is required' });
      return;
    }

    const result = await fastify.db.query(
      `
      INSERT INTO change_requests
        (tenant_id, requirement_id, title, description, impact_summary, requested_by)
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *
      `,
      [tenantId, id, title, description ?? null, impactSummary ?? null, user.id]
    );

    await fastify.auditLog({
      tenantId,
      actorUserId: user.id,
      action: 'CHANGE_REQUEST_CREATE',
      entityType: 'change_request',
      entityId: result.rows[0].id,
      afterData: { requirementId: id, title },
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'] ?? null
    });

    reply.code(201).send({ item: result.rows[0] });
  });

  fastify.get('/requirements/:id/change-requests', { preHandler: fastify.authenticate }, async (request) => {
    const tenantId = request.tenantId as string;
    const { id } = request.params as { id: string };

    const result = await fastify.db.query(
      `
      SELECT * FROM change_requests
      WHERE tenant_id = $1 AND requirement_id = $2
      ORDER BY requested_at DESC
      `,
      [tenantId, id]
    );

    return { items: result.rows };
  });

  fastify.get('/requirements/:id/impact', { preHandler: fastify.authenticate }, async (request) => {
    const tenantId = request.tenantId as string;
    const { id } = request.params as { id: string };

    const result = await fastify.db.query(
      `
      SELECT
        (SELECT COUNT(*) FROM requirement_design_links WHERE tenant_id = $1 AND requirement_id = $2) AS design_count,
        (SELECT COUNT(*) FROM requirement_test_requirement_links WHERE tenant_id = $1 AND requirement_id = $2) AS test_requirement_count,
        (SELECT COUNT(*) FROM test_cases tc
          JOIN requirement_test_requirement_links rtl ON rtl.test_requirement_id = tc.test_requirement_id
          WHERE rtl.tenant_id = $1 AND rtl.requirement_id = $2
        ) AS test_case_count,
        (SELECT COUNT(*) FROM test_results tr
          JOIN test_cases tc ON tc.id = tr.test_case_id
          JOIN requirement_test_requirement_links rtl ON rtl.test_requirement_id = tc.test_requirement_id
          WHERE rtl.tenant_id = $1 AND rtl.requirement_id = $2
        ) AS test_result_count,
        (SELECT COUNT(*) FROM test_results tr
          JOIN test_cases tc ON tc.id = tr.test_case_id
          JOIN requirement_test_requirement_links rtl ON rtl.test_requirement_id = tc.test_requirement_id
          WHERE rtl.tenant_id = $1 AND rtl.requirement_id = $2 AND tr.status = 'pass'
        ) AS passed_count
      `,
      [tenantId, id]
    );

    return { impact: result.rows[0] };
  });

  fastify.patch<{ Body: ChangeRequestUpdatePayload }>('/change-requests/:id', {
    preHandler: [fastify.authenticate, fastify.authorize(['ADMIN', 'APPROVER'])]
  }, async (request, reply) => {
    const tenantId = request.tenantId as string;
    const user = request.user as AuthUser;
    const { id } = request.params as { id: string };
    const { status } = request.body;

    if (!status) {
      reply.code(400).send({ message: 'status is required' });
      return;
    }

    const existing = await fastify.db.query(
      'SELECT * FROM change_requests WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );

    if (existing.rowCount === 0) {
      reply.code(404).send({ message: 'Change request not found' });
      return;
    }

    const approvedAt = status === 'approved' ? new Date() : null;
    const implementedAt = status === 'implemented' ? new Date() : null;

    const result = await fastify.db.query(
      `
      UPDATE change_requests
      SET status = $1,
          approved_by = CASE WHEN $1 IN ('approved','implemented') THEN $2 ELSE approved_by END,
          approved_at = CASE WHEN $1 IN ('approved','implemented') THEN $3 ELSE approved_at END,
          implemented_at = CASE WHEN $1 = 'implemented' THEN $4 ELSE implemented_at END
      WHERE id = $5 AND tenant_id = $6
      RETURNING *
      `,
      [status, user.id, approvedAt, implementedAt, id, tenantId]
    );

    await fastify.auditLog({
      tenantId,
      actorUserId: user.id,
      action: 'CHANGE_REQUEST_UPDATE',
      entityType: 'change_request',
      entityId: id,
      beforeData: existing.rows[0],
      afterData: result.rows[0],
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'] ?? null
    });

    reply.send({ item: result.rows[0] });
  });

  fastify.get('/requirements/coverage', { preHandler: fastify.authenticate }, async (request) => {
    const tenantId = request.tenantId as string;

    const summaryResult = await fastify.db.query(
      `
      WITH with_design AS (
        SELECT DISTINCT requirement_id FROM requirement_design_links WHERE tenant_id = $1
      ),
      with_test AS (
        SELECT DISTINCT requirement_id FROM requirement_test_requirement_links WHERE tenant_id = $1
      ),
      with_pass AS (
        SELECT DISTINCT rtl.requirement_id
        FROM requirement_test_requirement_links rtl
        JOIN test_requirements tr ON tr.id = rtl.test_requirement_id
        JOIN test_cases tc ON tc.test_requirement_id = tr.id
        JOIN test_results trr ON trr.test_case_id = tc.id
        WHERE rtl.tenant_id = $1 AND trr.status = 'pass'
      )
      SELECT
        (SELECT COUNT(*) FROM requirements WHERE tenant_id = $1) AS total,
        (SELECT COUNT(*) FROM with_design) AS with_design,
        (SELECT COUNT(*) FROM with_test) AS with_test,
        (SELECT COUNT(*) FROM with_pass) AS with_pass
      `,
      [tenantId]
    );

    const listResult = await fastify.db.query(
      `
      SELECT r.id, r.code, r.name,
        CASE WHEN rd.requirement_id IS NULL THEN false ELSE true END AS has_design,
        CASE WHEN rt.requirement_id IS NULL THEN false ELSE true END AS has_test,
        CASE WHEN rp.requirement_id IS NULL THEN false ELSE true END AS has_pass
      FROM requirements r
      LEFT JOIN (
        SELECT DISTINCT requirement_id FROM requirement_design_links WHERE tenant_id = $1
      ) rd ON rd.requirement_id = r.id
      LEFT JOIN (
        SELECT DISTINCT requirement_id FROM requirement_test_requirement_links WHERE tenant_id = $1
      ) rt ON rt.requirement_id = r.id
      LEFT JOIN (
        SELECT DISTINCT rtl.requirement_id
        FROM requirement_test_requirement_links rtl
        JOIN test_requirements tr ON tr.id = rtl.test_requirement_id
        JOIN test_cases tc ON tc.test_requirement_id = tr.id
        JOIN test_results trr ON trr.test_case_id = tc.id
        WHERE rtl.tenant_id = $1 AND trr.status = 'pass'
      ) rp ON rp.requirement_id = r.id
      WHERE r.tenant_id = $1
      ORDER BY r.code
      `,
      [tenantId]
    );

    return {
      summary: summaryResult.rows[0],
      items: listResult.rows
    };
  });

  fastify.get('/requirements/noncompliant', { preHandler: fastify.authenticate }, async (request) => {
    const tenantId = request.tenantId as string;

    const result = await fastify.db.query(
      `
      SELECT r.id, r.code, r.name,
        CASE WHEN rd.requirement_id IS NULL THEN false ELSE true END AS has_design,
        CASE WHEN rt.requirement_id IS NULL THEN false ELSE true END AS has_test,
        CASE WHEN rp.requirement_id IS NULL THEN false ELSE true END AS has_pass
      FROM requirements r
      LEFT JOIN (
        SELECT DISTINCT requirement_id FROM requirement_design_links WHERE tenant_id = $1
      ) rd ON rd.requirement_id = r.id
      LEFT JOIN (
        SELECT DISTINCT requirement_id FROM requirement_test_requirement_links WHERE tenant_id = $1
      ) rt ON rt.requirement_id = r.id
      LEFT JOIN (
        SELECT DISTINCT rtl.requirement_id
        FROM requirement_test_requirement_links rtl
        JOIN test_requirements tr ON tr.id = rtl.test_requirement_id
        JOIN test_cases tc ON tc.test_requirement_id = tr.id
        JOIN test_results trr ON trr.test_case_id = tc.id
        WHERE rtl.tenant_id = $1 AND trr.status = 'pass'
      ) rp ON rp.requirement_id = r.id
      WHERE r.tenant_id = $1
        AND (rd.requirement_id IS NULL OR rt.requirement_id IS NULL OR rp.requirement_id IS NULL)
      ORDER BY r.code
      `,
      [tenantId]
    );

    return { items: result.rows };
  });

  fastify.get('/requirements/coverage/export', { preHandler: fastify.authenticate }, async (request, reply) => {
    const tenantId = request.tenantId as string;
    const result = await fastify.db.query(
      `
      SELECT r.code, r.category, r.name,
        CASE WHEN rd.requirement_id IS NULL THEN 'N' ELSE 'Y' END AS has_design,
        CASE WHEN rt.requirement_id IS NULL THEN 'N' ELSE 'Y' END AS has_test,
        CASE WHEN rp.requirement_id IS NULL THEN 'N' ELSE 'Y' END AS has_pass
      FROM requirements r
      LEFT JOIN (
        SELECT DISTINCT requirement_id FROM requirement_design_links WHERE tenant_id = $1
      ) rd ON rd.requirement_id = r.id
      LEFT JOIN (
        SELECT DISTINCT requirement_id FROM requirement_test_requirement_links WHERE tenant_id = $1
      ) rt ON rt.requirement_id = r.id
      LEFT JOIN (
        SELECT DISTINCT rtl.requirement_id
        FROM requirement_test_requirement_links rtl
        JOIN test_requirements tr ON tr.id = rtl.test_requirement_id
        JOIN test_cases tc ON tc.test_requirement_id = tr.id
        JOIN test_results trr ON trr.test_case_id = tc.id
        WHERE rtl.tenant_id = $1 AND trr.status = 'pass'
      ) rp ON rp.requirement_id = r.id
      WHERE r.tenant_id = $1
      ORDER BY r.code
      `,
      [tenantId]
    );

    const header = ['code', 'category', 'name', 'has_design', 'has_test', 'has_pass'];
    const rows = result.rows.map((row) => [
      row.code ?? '',
      row.category ?? '',
      row.name ?? '',
      row.has_design ?? 'N',
      row.has_test ?? 'N',
      row.has_pass ?? 'N'
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map(value => csvEscape(String(value))).join(','))
      .join('\n');

    reply
      .header('Content-Type', 'text/csv; charset=utf-8')
      .header('Content-Disposition', 'attachment; filename="requirement_coverage.csv"')
      .send(`\uFEFF${csv}`);
  });

  fastify.get('/requirements/coverage/export.xlsx', { preHandler: fastify.authenticate }, async (request, reply) => {
    const tenantId = request.tenantId as string;
    const result = await fastify.db.query(
      `
      SELECT r.code, r.category, r.name,
        CASE WHEN rd.requirement_id IS NULL THEN 'N' ELSE 'Y' END AS has_design,
        CASE WHEN rt.requirement_id IS NULL THEN 'N' ELSE 'Y' END AS has_test,
        CASE WHEN rp.requirement_id IS NULL THEN 'N' ELSE 'Y' END AS has_pass
      FROM requirements r
      LEFT JOIN (
        SELECT DISTINCT requirement_id FROM requirement_design_links WHERE tenant_id = $1
      ) rd ON rd.requirement_id = r.id
      LEFT JOIN (
        SELECT DISTINCT requirement_id FROM requirement_test_requirement_links WHERE tenant_id = $1
      ) rt ON rt.requirement_id = r.id
      LEFT JOIN (
        SELECT DISTINCT rtl.requirement_id
        FROM requirement_test_requirement_links rtl
        JOIN test_requirements tr ON tr.id = rtl.test_requirement_id
        JOIN test_cases tc ON tc.test_requirement_id = tr.id
        JOIN test_results trr ON trr.test_case_id = tc.id
        WHERE rtl.tenant_id = $1 AND trr.status = 'pass'
      ) rp ON rp.requirement_id = r.id
      WHERE r.tenant_id = $1
      ORDER BY r.code
      `,
      [tenantId]
    );

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Coverage');
    worksheet.columns = [
      { header: 'code', key: 'code', width: 18 },
      { header: 'category', key: 'category', width: 18 },
      { header: 'name', key: 'name', width: 40 },
      { header: 'has_design', key: 'has_design', width: 12 },
      { header: 'has_test', key: 'has_test', width: 12 },
      { header: 'has_pass', key: 'has_pass', width: 12 }
    ];

    result.rows.forEach((row) => {
      worksheet.addRow({
        code: row.code ?? '',
        category: row.category ?? '',
        name: row.name ?? '',
        has_design: row.has_design ?? 'N',
        has_test: row.has_test ?? 'N',
        has_pass: row.has_pass ?? 'N'
      });
    });

    worksheet.getRow(1).font = { bold: true };
    const buffer = await workbook.xlsx.writeBuffer();
    const content = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);

    reply
      .header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      .header('Content-Disposition', 'attachment; filename=\"requirement_coverage.xlsx\"')
      .send(content);
  });
};
