import { FastifyInstance } from 'fastify';
import { AuthUser, RoleCode } from '../types';
import { generateItemsWithLlm, LlmGenerationItem, validateItemWithLlm } from '../utils/llm';

const TEMPLATE_ROLES: RoleCode[] = ['AUTHOR', 'REVIEWER', 'APPROVER', 'ADMIN'];
const REVIEW_ROLES: RoleCode[] = ['REVIEWER', 'APPROVER', 'ADMIN'];
const APPROVE_ROLES: RoleCode[] = ['APPROVER', 'ADMIN'];

type TemplatePayload = {
  code: string;
  name: string;
  subject?: string;
  grade?: string;
  difficulty?: string;
  intent?: string;
  coreConcept?: string;
  template: string;
};

type RunPayload = {
  templateId: string;
  count: number;
  modelName?: string;
  modelVersion?: string;
  parameters?: Record<string, unknown>;
};

type ReviewPayload = {
  decision: 'accept' | 'reject';
  note?: string;
};

type ApprovePayload = {
  note?: string;
};

type UsagePayload = {
  itemId?: string;
  usedIn?: string;
};

const runBasicValidations = (item: LlmGenerationItem) => {
  const results: Array<{ rule: string; status: 'pass' | 'fail'; message?: string }> = [];
  const stem = item.stem?.trim() ?? '';
  const answer = item.answer?.trim() ?? '';

  if (stem.length < 10) {
    results.push({ rule: 'STEM_LENGTH', status: 'fail', message: '지문 길이가 너무 짧습니다.' });
  } else {
    results.push({ rule: 'STEM_LENGTH', status: 'pass' });
  }

  if (!answer) {
    results.push({ rule: 'ANSWER_PRESENT', status: 'fail', message: '정답이 없습니다.' });
  } else {
    results.push({ rule: 'ANSWER_PRESENT', status: 'pass' });
  }

  if (Array.isArray(item.options) && item.options.length > 0) {
    const uniqueOptions = new Set(item.options);
    if (uniqueOptions.size !== item.options.length) {
      results.push({ rule: 'OPTIONS_UNIQUE', status: 'fail', message: '보기 항목이 중복되었습니다.' });
    } else {
      results.push({ rule: 'OPTIONS_UNIQUE', status: 'pass' });
    }

    if (!item.options.includes(answer)) {
      results.push({ rule: 'ANSWER_IN_OPTIONS', status: 'fail', message: '정답이 보기에 없습니다.' });
    } else {
      results.push({ rule: 'ANSWER_IN_OPTIONS', status: 'pass' });
    }
  }

  return results;
};

export const generationRoutes = async (fastify: FastifyInstance) => {
  fastify.get('/prompt-templates', { preHandler: fastify.authenticate }, async (request) => {
    const tenantId = request.tenantId as string;
    const query = request.query as { code?: string; active?: string };

    const params: string[] = [tenantId];
    let sql = 'SELECT * FROM prompt_templates WHERE tenant_id = $1';
    if (query.code) {
      params.push(query.code);
      sql += ` AND code = $2`;
    }
    if (query.active) {
      params.push(query.active === 'true');
      sql += query.code ? ` AND is_active = $3` : ` AND is_active = $2`;
    }
    sql += ' ORDER BY code, version DESC';

    const result = await fastify.db.query(sql, params);
    return { items: result.rows };
  });

  fastify.post<{ Body: TemplatePayload }>('/prompt-templates', {
    preHandler: [fastify.authenticate, fastify.authorize(TEMPLATE_ROLES)]
  }, async (request, reply) => {
    const tenantId = request.tenantId as string;
    const user = request.user as AuthUser;
    const payload = request.body;

    if (!payload.code || !payload.name || !payload.template) {
      reply.code(400).send({ message: 'code, name, template are required' });
      return;
    }

    const latest = await fastify.db.query(
      'SELECT * FROM prompt_templates WHERE tenant_id = $1 AND code = $2 ORDER BY version DESC LIMIT 1',
      [tenantId, payload.code]
    );

    const nextVersion = latest.rowCount > 0 ? (latest.rows[0].version as number) + 1 : 1;

    if (latest.rowCount > 0) {
      await fastify.db.query(
        'UPDATE prompt_templates SET is_active = false WHERE tenant_id = $1 AND code = $2',
        [tenantId, payload.code]
      );
    }

    const result = await fastify.db.query(
      `
      INSERT INTO prompt_templates
        (tenant_id, code, name, subject, grade, difficulty, intent, core_concept, template, version, is_active, created_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,true,$11)
      RETURNING *
      `,
      [
        tenantId,
        payload.code,
        payload.name,
        payload.subject ?? null,
        payload.grade ?? null,
        payload.difficulty ?? null,
        payload.intent ?? null,
        payload.coreConcept ?? null,
        payload.template,
        nextVersion,
        user.id
      ]
    );

    await fastify.auditLog({
      tenantId,
      actorUserId: user.id,
      action: 'PROMPT_TEMPLATE_CREATE',
      entityType: 'prompt_template',
      entityId: result.rows[0].id,
      afterData: { code: payload.code, version: nextVersion },
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'] ?? null
    });

    reply.code(201).send({ item: result.rows[0] });
  });

  fastify.post<{ Body: RunPayload }>('/generation/runs', {
    preHandler: [fastify.authenticate, fastify.authorize(TEMPLATE_ROLES)]
  }, async (request, reply) => {
    const tenantId = request.tenantId as string;
    const user = request.user as AuthUser;
    const payload = request.body;

    if (!payload.templateId || !payload.count) {
      reply.code(400).send({ message: 'templateId and count are required' });
      return;
    }

    const templateResult = await fastify.db.query(
      'SELECT * FROM prompt_templates WHERE id = $1 AND tenant_id = $2',
      [payload.templateId, tenantId]
    );

    if (templateResult.rowCount === 0) {
      reply.code(404).send({ message: 'Template not found' });
      return;
    }

    const template = templateResult.rows[0];
    const promptSnapshot = template.template;

    const runParams = {
      ...(payload.parameters ?? {}),
      count: payload.count
    };

    const runResult = await fastify.db.query(
      `
      INSERT INTO generation_runs
        (tenant_id, prompt_template_id, status, model_name, model_version, parameters, prompt_snapshot, requested_by)
      VALUES ($1,$2,'running',$3,$4,$5,$6,$7)
      RETURNING *
      `,
      [
        tenantId,
        payload.templateId,
        payload.modelName ?? process.env.LLM_MODEL ?? 'unknown',
        payload.modelVersion ?? null,
        runParams,
        promptSnapshot,
        user.id
      ]
    );

    const run = runResult.rows[0];
    const generatedItems: any[] = [];

    try {
      const llmItems = await generateItemsWithLlm({
        template,
        count: payload.count,
        modelName: payload.modelName,
        parameters: payload.parameters
      });

      if (llmItems.length === 0) {
        throw new Error('LLM returned no valid items');
      }

      for (let i = 0; i < llmItems.length; i += 1) {
        const item = llmItems[i];

        const itemResult = await fastify.db.query(
          `
          INSERT INTO generation_items
            (tenant_id, run_id, sequence, status, stem, options, answer, explanation, metadata)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
          RETURNING *
          `,
          [
            tenantId,
            run.id,
            i + 1,
            'generated',
            item.stem,
            item.options ?? null,
            item.answer,
            item.explanation ?? null,
            {
              subject: template.subject,
              grade: template.grade,
              difficulty: template.difficulty,
              intent: template.intent,
              coreConcept: template.core_concept
            }
          ]
        );

        const genItem = itemResult.rows[0];
        const validations = runBasicValidations(item);

        let llmIssues: { rule: string; message: string }[] = [];
        try {
          llmIssues = await validateItemWithLlm({
            item,
            template,
            modelName: payload.modelName,
            parameters: payload.parameters
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'LLM validation failed';
          llmIssues = [{ rule: 'LLM_ERROR', message }];
        }

        if (llmIssues.length === 0) {
          validations.push({ rule: 'LLM_CHECK', status: 'pass' });
        } else {
          llmIssues.forEach(issue => {
            validations.push({ rule: `LLM_${issue.rule}`, status: 'fail', message: issue.message });
          });
        }

        const hasFail = validations.some(v => v.status === 'fail');

        for (const validation of validations) {
          await fastify.db.query(
            `
            INSERT INTO generation_validations
              (tenant_id, generation_item_id, rule_name, status, message)
            VALUES ($1,$2,$3,$4,$5)
            `,
            [tenantId, genItem.id, validation.rule, validation.status, validation.message ?? null]
          );
        }

        const nextStatus = hasFail ? 'validation_failed' : 'ready_for_review';
        await fastify.db.query(
          'UPDATE generation_items SET status = $1 WHERE id = $2',
          [nextStatus, genItem.id]
        );

        generatedItems.push({ ...genItem, status: nextStatus });
      }

      await fastify.db.query('UPDATE generation_runs SET status = $1 WHERE id = $2', ['generated', run.id]);

      await fastify.auditLog({
        tenantId,
        actorUserId: user.id,
        action: 'GENERATION_RUN_CREATE',
        entityType: 'generation_run',
        entityId: run.id,
        afterData: { count: payload.count, templateId: payload.templateId },
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'] ?? null
      });

      reply.code(201).send({ run, items: generatedItems });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Generation failed';
      await fastify.db.query(
        `UPDATE generation_runs
         SET status = $1,
             parameters = COALESCE(parameters, '{}'::jsonb) || jsonb_build_object('lastError', $2)
         WHERE id = $3`,
        ['failed', message, run.id]
      );
      reply.code(400).send({ message });
    }
  });

  fastify.get('/generation/runs', { preHandler: fastify.authenticate }, async (request) => {
    const tenantId = request.tenantId as string;
    const result = await fastify.db.query(
      'SELECT * FROM generation_runs WHERE tenant_id = $1 ORDER BY created_at DESC',
      [tenantId]
    );
    return { items: result.rows };
  });

  fastify.get('/generation/items', { preHandler: fastify.authenticate }, async (request) => {
    const tenantId = request.tenantId as string;
    const { status } = request.query as { status?: string };
    const params: string[] = [tenantId];
    let query = 'SELECT * FROM generation_items WHERE tenant_id = $1';
    if (status) {
      params.push(status);
      query += ' AND status = $2';
    }
    query += ' ORDER BY created_at DESC';

    const result = await fastify.db.query(query, params);
    return { items: result.rows };
  });

  fastify.get('/generation/items/:id', { preHandler: fastify.authenticate }, async (request, reply) => {
    const tenantId = request.tenantId as string;
    const { id } = request.params as { id: string };
    const itemResult = await fastify.db.query(
      'SELECT * FROM generation_items WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );
    if (itemResult.rowCount === 0) {
      reply.code(404).send({ message: 'Generated item not found' });
      return;
    }

    const validations = await fastify.db.query(
      'SELECT * FROM generation_validations WHERE generation_item_id = $1 ORDER BY created_at DESC',
      [id]
    );
    const reviews = await fastify.db.query(
      'SELECT * FROM generation_reviews WHERE generation_item_id = $1 ORDER BY created_at DESC',
      [id]
    );

    reply.send({
      item: itemResult.rows[0],
      validations: validations.rows,
      reviews: reviews.rows
    });
  });

  fastify.post<{ Body: ReviewPayload }>('/generation/items/:id/review', {
    preHandler: [fastify.authenticate, fastify.authorize(REVIEW_ROLES)]
  }, async (request, reply) => {
    const tenantId = request.tenantId as string;
    const user = request.user as AuthUser;
    const { id } = request.params as { id: string };
    const payload = request.body;

    if (!payload.decision) {
      reply.code(400).send({ message: 'decision is required' });
      return;
    }

    const itemResult = await fastify.db.query(
      'SELECT * FROM generation_items WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );

    if (itemResult.rowCount === 0) {
      reply.code(404).send({ message: 'Generated item not found' });
      return;
    }

    const nextStatus = payload.decision === 'accept' ? 'reviewed' : 'rejected';

    await fastify.db.query(
      'UPDATE generation_items SET status = $1 WHERE id = $2',
      [nextStatus, id]
    );

    await fastify.db.query(
      `
      INSERT INTO generation_reviews
        (tenant_id, generation_item_id, reviewer_id, decision, note)
      VALUES ($1,$2,$3,$4,$5)
      `,
      [tenantId, id, user.id, payload.decision, payload.note ?? null]
    );

    await fastify.auditLog({
      tenantId,
      actorUserId: user.id,
      action: 'GENERATION_REVIEW',
      entityType: 'generation_item',
      entityId: id,
      afterData: { decision: payload.decision },
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'] ?? null
    });

    reply.send({ status: nextStatus });
  });

  fastify.post<{ Body: ApprovePayload }>('/generation/items/:id/approve', {
    preHandler: [fastify.authenticate, fastify.authorize(APPROVE_ROLES)]
  }, async (request, reply) => {
    const tenantId = request.tenantId as string;
    const user = request.user as AuthUser;
    const { id } = request.params as { id: string };

    const itemResult = await fastify.db.query(
      'SELECT * FROM generation_items WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );

    if (itemResult.rowCount === 0) {
      reply.code(404).send({ message: 'Generated item not found' });
      return;
    }

    const genItem = itemResult.rows[0];
    const metadata = genItem.metadata ?? {};

    const client = await fastify.db.connect();
    try {
      await client.query('BEGIN');

      const code = `GEN-${genItem.id.slice(0, 8)}`;

      const itemResultDb = await client.query(
        `
        INSERT INTO items
          (tenant_id, code, title, subject, grade, status, created_by, updated_by)
        VALUES ($1,$2,$3,$4,$5,'approved',$6,$6)
        RETURNING *
        `,
        [
          tenantId,
          code,
          `자동생성 문항 ${genItem.sequence}`,
          metadata.subject ?? '미정',
          metadata.grade ?? '미정',
          user.id
        ]
      );

      const item = itemResultDb.rows[0];

      await client.query(
        `
        INSERT INTO item_contents
          (tenant_id, item_id, standard_code, standard_description)
        VALUES ($1,$2,$3,$4)
        ON CONFLICT (item_id)
        DO UPDATE SET standard_code = EXCLUDED.standard_code,
                      standard_description = EXCLUDED.standard_description
        `,
        [tenantId, item.id, metadata.standardCode ?? null, metadata.standardDescription ?? null]
      );

      await client.query(
        `
        INSERT INTO item_purposes
          (tenant_id, item_id, purpose_type)
        VALUES ($1,$2,$3)
        `,
        [tenantId, item.id, metadata.purposeType ?? 'supplemental']
      );

      const versionResult = await client.query(
        `
        INSERT INTO item_versions
          (tenant_id, item_id, version_number, stem, options, answer, explanation, created_by)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        RETURNING id
        `,
        [tenantId, item.id, 1, genItem.stem, genItem.options ?? null, genItem.answer, genItem.explanation ?? null, user.id]
      );

      await client.query(
        'UPDATE items SET current_version_id = $1 WHERE id = $2 AND tenant_id = $3',
        [versionResult.rows[0]?.id, item.id, tenantId]
      );

      await client.query(
        `
        INSERT INTO item_histories
          (tenant_id, item_id, action, from_status, to_status, note, created_by)
        VALUES ($1,$2,'GENERATED_APPROVED',null,'approved',$3,$4)
        `,
        [tenantId, item.id, request.body?.note ?? null, user.id]
      );

      await client.query(
        'UPDATE generation_items SET status = $1, item_id = $2 WHERE id = $3',
        ['approved', item.id, id]
      );

      await client.query('COMMIT');

      await fastify.auditLog({
        tenantId,
        actorUserId: user.id,
        action: 'GENERATION_APPROVE',
        entityType: 'generation_item',
        entityId: id,
        afterData: { itemId: item.id },
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'] ?? null
      });

      reply.send({ itemId: item.id });
    } catch (error) {
      await client.query('ROLLBACK');
      const message = error instanceof Error ? error.message : 'Approval failed';
      reply.code(400).send({ message });
    } finally {
      client.release();
    }
  });

  fastify.post<{ Body: UsagePayload }>('/generation/items/:id/usage', {
    preHandler: [fastify.authenticate, fastify.authorize(TEMPLATE_ROLES)]
  }, async (request, reply) => {
    const tenantId = request.tenantId as string;
    const user = request.user as AuthUser;
    const { id } = request.params as { id: string };
    const payload = request.body;

    await fastify.db.query(
      `
      INSERT INTO generation_usages
        (tenant_id, generation_item_id, item_id, used_in)
      VALUES ($1,$2,$3,$4)
      `,
      [tenantId, id, payload.itemId ?? null, payload.usedIn ?? null]
    );

    await fastify.auditLog({
      tenantId,
      actorUserId: user.id,
      action: 'GENERATION_USAGE',
      entityType: 'generation_item',
      entityId: id,
      afterData: { usedIn: payload.usedIn },
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'] ?? null
    });

    reply.code(201).send({ ok: true });
  });
};
