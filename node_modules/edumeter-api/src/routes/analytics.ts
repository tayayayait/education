import { FastifyInstance } from 'fastify';
import { AuthUser, RoleCode } from '../types';

const ANALYTICS_ROLES: RoleCode[] = ['ADMIN', 'APPROVER', 'REVIEWER'];

type IngestPayload = {
  students?: Array<{
    externalId?: string;
    name?: string;
    grade?: string;
    classCode?: string;
    attributes?: unknown;
  }>;
  assessments?: Array<{
    name: string;
    purpose?: string;
  }>;
  sessions?: Array<{
    assessmentName?: string;
    studentExternalId?: string;
    startedAt?: string;
    completedAt?: string;
    metadata?: unknown;
  }>;
  responses?: Array<{
    sessionIndex: number;
    itemId: string;
    responseValue?: string;
    isCorrect?: boolean;
    responseTimeMs?: number;
    answeredAt?: string;
  }>;
  surveys?: Array<{
    sessionIndex: number;
    questionCode: string;
    responseValue?: string;
  }>;
};

export const analyticsRoutes = async (fastify: FastifyInstance) => {
  fastify.post<{ Body: IngestPayload }>('/analytics/ingest', {
    preHandler: [fastify.authenticate, fastify.authorize(['ADMIN', 'APPROVER'])]
  }, async (request, reply) => {
    const tenantId = request.tenantId as string;
    const user = request.user as AuthUser;
    const payload = request.body;

    const client = await fastify.db.connect();
    try {
      await client.query('BEGIN');

      const studentMap = new Map<string, string>();
      if (payload.students) {
        for (const student of payload.students) {
          const result = await client.query(
            `
            INSERT INTO students
              (tenant_id, external_id, name, grade, class_code, attributes)
            VALUES ($1,$2,$3,$4,$5,$6)
            RETURNING id
            `,
            [
              tenantId,
              student.externalId ?? null,
              student.name ?? null,
              student.grade ?? null,
              student.classCode ?? null,
              student.attributes ?? null
            ]
          );
          if (student.externalId) {
            studentMap.set(student.externalId, result.rows[0].id);
          }
        }
      }

      const assessmentMap = new Map<string, string>();
      if (payload.assessments) {
        for (const assessment of payload.assessments) {
          const result = await client.query(
            `
            INSERT INTO assessments (tenant_id, name, purpose)
            VALUES ($1,$2,$3)
            RETURNING id
            `,
            [tenantId, assessment.name, assessment.purpose ?? null]
          );
          assessmentMap.set(assessment.name, result.rows[0].id);
        }
      }

      const sessionIds: string[] = [];
      if (payload.sessions) {
        for (const session of payload.sessions) {
          const assessmentId = session.assessmentName ? assessmentMap.get(session.assessmentName) : null;
          const studentId = session.studentExternalId ? studentMap.get(session.studentExternalId) : null;
          const result = await client.query(
            `
            INSERT INTO test_sessions
              (tenant_id, assessment_id, student_id, started_at, completed_at, metadata)
            VALUES ($1,$2,$3,$4,$5,$6)
            RETURNING id
            `,
            [
              tenantId,
              assessmentId ?? null,
              studentId ?? null,
              session.startedAt ?? null,
              session.completedAt ?? null,
              session.metadata ?? null
            ]
          );
          sessionIds.push(result.rows[0].id);
        }
      }

      if (payload.responses) {
        for (const response of payload.responses) {
          const sessionId = sessionIds[response.sessionIndex];
          if (!sessionId) continue;
          await client.query(
            `
            INSERT INTO item_responses
              (tenant_id, session_id, item_id, response_value, is_correct, response_time_ms, answered_at)
            VALUES ($1,$2,$3,$4,$5,$6,$7)
            `,
            [
              tenantId,
              sessionId,
              response.itemId,
              response.responseValue ?? null,
              response.isCorrect ?? null,
              response.responseTimeMs ?? null,
              response.answeredAt ?? null
            ]
          );
        }
      }

      if (payload.surveys) {
        for (const survey of payload.surveys) {
          const sessionId = sessionIds[survey.sessionIndex];
          if (!sessionId) continue;
          await client.query(
            `
            INSERT INTO survey_responses
              (tenant_id, session_id, question_code, response_value)
            VALUES ($1,$2,$3,$4)
            `,
            [tenantId, sessionId, survey.questionCode, survey.responseValue ?? null]
          );
        }
      }

      await client.query('COMMIT');

      await fastify.auditLog({
        tenantId,
        actorUserId: user.id,
        action: 'ANALYTICS_INGEST',
        entityType: 'analytics_ingest',
        entityId: null,
        afterData: {
          students: payload.students?.length ?? 0,
          assessments: payload.assessments?.length ?? 0,
          sessions: payload.sessions?.length ?? 0,
          responses: payload.responses?.length ?? 0,
          surveys: payload.surveys?.length ?? 0
        },
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'] ?? null
      });

      reply.code(201).send({ ok: true });
    } catch (error) {
      await client.query('ROLLBACK');
      const message = error instanceof Error ? error.message : 'Ingest failed';
      reply.code(400).send({ message });
    } finally {
      client.release();
    }
  });

  fastify.get('/analytics/runs', { preHandler: fastify.authenticate }, async (request) => {
    const tenantId = request.tenantId as string;
    const { runType } = request.query as { runType?: string };

    const params: string[] = [tenantId];
    let query = 'SELECT * FROM analysis_runs WHERE tenant_id = $1';
    if (runType) {
      params.push(runType);
      query += ' AND run_type = $2';
    }
    query += ' ORDER BY created_at DESC';

    const result = await fastify.db.query(query, params);
    return { items: result.rows };
  });

  fastify.get('/analytics/ctt', { preHandler: fastify.authenticate }, async (request) => {
    const tenantId = request.tenantId as string;
    const { itemId } = request.query as { itemId?: string };

    const params: string[] = [tenantId];
    let query = 'SELECT * FROM item_ctt_stats WHERE tenant_id = $1';
    if (itemId) {
      params.push(itemId);
      query += ' AND item_id = $2';
    }
    query += ' ORDER BY created_at DESC';

    const result = await fastify.db.query(query, params);
    return { items: result.rows };
  });

  fastify.get('/analytics/irt', { preHandler: fastify.authenticate }, async (request) => {
    const tenantId = request.tenantId as string;
    const { itemId } = request.query as { itemId?: string };

    const params: string[] = [tenantId];
    let query = 'SELECT * FROM item_irt_params WHERE tenant_id = $1';
    if (itemId) {
      params.push(itemId);
      query += ' AND item_id = $2';
    }
    query += ' ORDER BY created_at DESC';

    const result = await fastify.db.query(query, params);
    return { items: result.rows };
  });

  fastify.get('/analytics/exposures', { preHandler: fastify.authenticate }, async (request) => {
    const tenantId = request.tenantId as string;
    const { itemId } = request.query as { itemId?: string };

    const params: string[] = [tenantId];
    let query = 'SELECT * FROM item_exposure_stats WHERE tenant_id = $1';
    if (itemId) {
      params.push(itemId);
      query += ' AND item_id = $2';
    }
    query += ' ORDER BY created_at DESC';

    const result = await fastify.db.query(query, params);
    return { items: result.rows };
  });

  fastify.get('/analytics/detections', { preHandler: fastify.authenticate }, async (request) => {
    const tenantId = request.tenantId as string;
    const { status } = request.query as { status?: string };

    const params: string[] = [tenantId];
    let query = 'SELECT * FROM item_detection_results WHERE tenant_id = $1';
    if (status) {
      params.push(status);
      query += ' AND status = $2';
    }
    query += ' ORDER BY created_at DESC';

    const result = await fastify.db.query(query, params);
    return { items: result.rows };
  });

  fastify.post('/analytics/detections/:id/action', {
    preHandler: [fastify.authenticate, fastify.authorize(ANALYTICS_ROLES)]
  }, async (request, reply) => {
    const tenantId = request.tenantId as string;
    const user = request.user as AuthUser;
    const { id } = request.params as { id: string };
    const { actionType, note } = request.body as { actionType: string; note?: string };

    if (!actionType) {
      reply.code(400).send({ message: 'actionType is required' });
      return;
    }

    const detectionResult = await fastify.db.query(
      'SELECT * FROM item_detection_results WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );

    if (detectionResult.rowCount === 0) {
      reply.code(404).send({ message: 'Detection not found' });
      return;
    }

    const detection = detectionResult.rows[0];

    await fastify.db.query(
      `
      INSERT INTO item_detection_actions
        (tenant_id, detection_id, action_type, note, action_status, created_by)
      VALUES ($1,$2,$3,$4,'completed',$5)
      `,
      [tenantId, id, actionType, note ?? null, user.id]
    );

    if (actionType === 'RETIRE') {
      await fastify.db.query(
        `
        UPDATE items SET status = 'retired', updated_by = $1, updated_at = now()
        WHERE id = $2 AND tenant_id = $3
        `,
        [user.id, detection.item_id, tenantId]
      );
    }

    await fastify.auditLog({
      tenantId,
      actorUserId: user.id,
      action: 'DETECTION_ACTION',
      entityType: 'item_detection',
      entityId: id,
      afterData: { actionType },
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'] ?? null
    });

    reply.code(201).send({ ok: true });
  });
};