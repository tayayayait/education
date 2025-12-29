import { FastifyInstance } from 'fastify';
import { AuthUser, RoleCode } from '../types';

const ALLOWED_ROLES: RoleCode[] = ['ADMIN', 'APPROVER', 'REVIEWER'];

type TestRequirementPayload = {
  code: string;
  name: string;
  description?: string;
};

type TestCasePayload = {
  testRequirementId: string;
  name: string;
  steps?: string;
  expectedResult?: string;
};

type TestRunPayload = {
  name: string;
  status?: 'planned' | 'in_progress' | 'completed';
};

type TestResultPayload = {
  testCaseId: string;
  testRunId: string;
  status: 'pass' | 'fail' | 'blocked';
  actualResult?: string;
};

type TestEvidencePayload = {
  testResultId: string;
  fileName: string;
  fileUrl: string;
};

type TestLinkPayload = {
  testRequirementId: string;
};

export const testRoutes = async (fastify: FastifyInstance) => {
  fastify.get('/test-requirements', { preHandler: fastify.authenticate }, async (request) => {
    const tenantId = request.tenantId as string;
    const result = await fastify.db.query(
      'SELECT * FROM test_requirements WHERE tenant_id = $1 ORDER BY code',
      [tenantId]
    );
    return { items: result.rows };
  });

  fastify.get('/requirements/:id/test-links', { preHandler: fastify.authenticate }, async (request) => {
    const tenantId = request.tenantId as string;
    const { id } = request.params as { id: string };
    const result = await fastify.db.query(
      `
      SELECT tr.*
      FROM requirement_test_requirement_links rtl
      JOIN test_requirements tr ON tr.id = rtl.test_requirement_id
      WHERE rtl.tenant_id = $1 AND rtl.requirement_id = $2
      ORDER BY tr.code
      `,
      [tenantId, id]
    );
    return { items: result.rows };
  });

  fastify.post<{ Body: TestRequirementPayload }>('/test-requirements', {
    preHandler: [fastify.authenticate, fastify.authorize(ALLOWED_ROLES)]
  }, async (request, reply) => {
    const tenantId = request.tenantId as string;
    const user = request.user as AuthUser;
    const { code, name, description } = request.body;

    if (!code || !name) {
      reply.code(400).send({ message: 'code and name are required' });
      return;
    }

    const result = await fastify.db.query(
      `
      INSERT INTO test_requirements (tenant_id, code, name, description, created_by)
      VALUES ($1,$2,$3,$4,$5)
      RETURNING *
      `,
      [tenantId, code, name, description ?? null, user.id]
    );

    await fastify.auditLog({
      tenantId,
      actorUserId: user.id,
      action: 'TEST_REQUIREMENT_CREATE',
      entityType: 'test_requirement',
      entityId: result.rows[0].id,
      afterData: { code, name },
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'] ?? null
    });

    reply.code(201).send({ item: result.rows[0] });
  });

  fastify.post<{ Body: TestLinkPayload }>('/requirements/:id/test-links', {
    preHandler: [fastify.authenticate, fastify.authorize(ALLOWED_ROLES)]
  }, async (request, reply) => {
    const tenantId = request.tenantId as string;
    const user = request.user as AuthUser;
    const { id } = request.params as { id: string };
    const { testRequirementId } = request.body;

    if (!testRequirementId) {
      reply.code(400).send({ message: 'testRequirementId is required' });
      return;
    }

    await fastify.db.query(
      `
      INSERT INTO requirement_test_requirement_links
        (requirement_id, test_requirement_id, tenant_id)
      VALUES ($1,$2,$3)
      ON CONFLICT DO NOTHING
      `,
      [id, testRequirementId, tenantId]
    );

    await fastify.auditLog({
      tenantId,
      actorUserId: user.id,
      action: 'REQUIREMENT_TEST_LINK',
      entityType: 'requirement',
      entityId: id,
      afterData: { testRequirementId },
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'] ?? null
    });

    reply.code(201).send({ ok: true });
  });

  fastify.post<{ Body: TestCasePayload }>('/test-cases', {
    preHandler: [fastify.authenticate, fastify.authorize(ALLOWED_ROLES)]
  }, async (request, reply) => {
    const tenantId = request.tenantId as string;
    const user = request.user as AuthUser;
    const { testRequirementId, name, steps, expectedResult } = request.body;

    if (!testRequirementId || !name) {
      reply.code(400).send({ message: 'testRequirementId and name are required' });
      return;
    }

    const result = await fastify.db.query(
      `
      INSERT INTO test_cases
        (tenant_id, test_requirement_id, name, steps, expected_result, created_by)
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *
      `,
      [tenantId, testRequirementId, name, steps ?? null, expectedResult ?? null, user.id]
    );

    await fastify.auditLog({
      tenantId,
      actorUserId: user.id,
      action: 'TEST_CASE_CREATE',
      entityType: 'test_case',
      entityId: result.rows[0].id,
      afterData: { testRequirementId, name },
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'] ?? null
    });

    reply.code(201).send({ item: result.rows[0] });
  });

  fastify.get('/test-cases', { preHandler: fastify.authenticate }, async (request) => {
    const tenantId = request.tenantId as string;
    const { testRequirementId } = request.query as { testRequirementId?: string };

    const params: string[] = [tenantId];
    let query = 'SELECT * FROM test_cases WHERE tenant_id = $1';
    if (testRequirementId) {
      params.push(testRequirementId);
      query += ` AND test_requirement_id = $2`;
    }
    query += ' ORDER BY created_at DESC';

    const result = await fastify.db.query(query, params);
    return { items: result.rows };
  });

  fastify.post<{ Body: TestRunPayload }>('/test-runs', {
    preHandler: [fastify.authenticate, fastify.authorize(ALLOWED_ROLES)]
  }, async (request, reply) => {
    const tenantId = request.tenantId as string;
    const user = request.user as AuthUser;
    const { name, status } = request.body;

    if (!name) {
      reply.code(400).send({ message: 'name is required' });
      return;
    }

    const result = await fastify.db.query(
      `
      INSERT INTO test_runs (tenant_id, name, status, executed_by, executed_at)
      VALUES ($1,$2,$3,$4,$5)
      RETURNING *
      `,
      [tenantId, name, status ?? 'planned', user.id, status ? new Date() : null]
    );

    await fastify.auditLog({
      tenantId,
      actorUserId: user.id,
      action: 'TEST_RUN_CREATE',
      entityType: 'test_run',
      entityId: result.rows[0].id,
      afterData: { name, status },
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'] ?? null
    });

    reply.code(201).send({ item: result.rows[0] });
  });

  fastify.get('/test-runs', { preHandler: fastify.authenticate }, async (request) => {
    const tenantId = request.tenantId as string;
    const result = await fastify.db.query(
      'SELECT * FROM test_runs WHERE tenant_id = $1 ORDER BY created_at DESC',
      [tenantId]
    );
    return { items: result.rows };
  });

  fastify.post<{ Body: TestResultPayload }>('/test-results', {
    preHandler: [fastify.authenticate, fastify.authorize(ALLOWED_ROLES)]
  }, async (request, reply) => {
    const tenantId = request.tenantId as string;
    const user = request.user as AuthUser;
    const { testCaseId, testRunId, status, actualResult } = request.body;

    if (!testCaseId || !testRunId || !status) {
      reply.code(400).send({ message: 'testCaseId, testRunId, status are required' });
      return;
    }

    const result = await fastify.db.query(
      `
      INSERT INTO test_results
        (tenant_id, test_case_id, test_run_id, status, actual_result, created_by)
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *
      `,
      [tenantId, testCaseId, testRunId, status, actualResult ?? null, user.id]
    );

    await fastify.auditLog({
      tenantId,
      actorUserId: user.id,
      action: 'TEST_RESULT_CREATE',
      entityType: 'test_result',
      entityId: result.rows[0].id,
      afterData: { testCaseId, testRunId, status },
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'] ?? null
    });

    reply.code(201).send({ item: result.rows[0] });
  });

  fastify.get('/test-results', { preHandler: fastify.authenticate }, async (request) => {
    const tenantId = request.tenantId as string;
    const { testCaseId, testRunId } = request.query as { testCaseId?: string; testRunId?: string };

    const params: string[] = [tenantId];
    let idx = 2;
    let query = 'SELECT * FROM test_results WHERE tenant_id = $1';

    if (testCaseId) {
      params.push(testCaseId);
      query += ` AND test_case_id = $${idx}`;
      idx += 1;
    }

    if (testRunId) {
      params.push(testRunId);
      query += ` AND test_run_id = $${idx}`;
      idx += 1;
    }

    query += ' ORDER BY created_at DESC';

    const result = await fastify.db.query(query, params);
    return { items: result.rows };
  });

  fastify.post<{ Body: TestEvidencePayload }>('/test-evidence', {
    preHandler: [fastify.authenticate, fastify.authorize(ALLOWED_ROLES)]
  }, async (request, reply) => {
    const tenantId = request.tenantId as string;
    const user = request.user as AuthUser;
    const { testResultId, fileName, fileUrl } = request.body;

    if (!testResultId || !fileName || !fileUrl) {
      reply.code(400).send({ message: 'testResultId, fileName, fileUrl are required' });
      return;
    }

    const result = await fastify.db.query(
      `
      INSERT INTO test_evidence
        (tenant_id, test_result_id, file_name, file_url, created_by)
      VALUES ($1,$2,$3,$4,$5)
      RETURNING *
      `,
      [tenantId, testResultId, fileName, fileUrl, user.id]
    );

    await fastify.auditLog({
      tenantId,
      actorUserId: user.id,
      action: 'TEST_EVIDENCE_CREATE',
      entityType: 'test_evidence',
      entityId: result.rows[0].id,
      afterData: { testResultId, fileName },
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'] ?? null
    });

    reply.code(201).send({ item: result.rows[0] });
  });

  fastify.get('/test-evidence', { preHandler: fastify.authenticate }, async (request) => {
    const tenantId = request.tenantId as string;
    const { testResultId } = request.query as { testResultId?: string };

    const params: string[] = [tenantId];
    let query = 'SELECT * FROM test_evidence WHERE tenant_id = $1';
    if (testResultId) {
      params.push(testResultId);
      query += ' AND test_result_id = $2';
    }
    query += ' ORDER BY created_at DESC';

    const result = await fastify.db.query(query, params);
    return { items: result.rows };
  });
};
