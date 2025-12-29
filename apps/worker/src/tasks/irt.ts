import { Pool } from 'pg';
import { createAnalysisRun, hashPayload } from './db';

type ResponseRow = {
  item_id: string;
  session_id: string;
  is_correct: boolean | null;
};

type ThetaRow = {
  sessionId: string;
  theta: number;
};

const mean = (values: number[]) => values.reduce((sum, v) => sum + v, 0) / (values.length || 1);

const stddev = (values: number[]) => {
  if (values.length <= 1) return 0;
  const avg = mean(values);
  const variance = values.reduce((sum, v) => sum + (v - avg) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
};

const sigmoid = (z: number) => {
  if (z > 35) return 1;
  if (z < -35) return 0;
  return 1 / (1 + Math.exp(-z));
};

type IrtParams = {
  a: number;
  b: number;
};

const estimate2pl = (data: Array<{ theta: number; y: number }>, options: {
  maxIters: number;
  lr: number;
  tol: number;
  l2: number;
  minA: number;
  maxA: number;
  minB: number;
  maxB: number;
}) => {
  let a = 1;
  let b = 0;
  const n = data.length || 1;

  for (let iter = 0; iter < options.maxIters; iter += 1) {
    let gradA = 0;
    let gradB = 0;

    for (const point of data) {
      const p = sigmoid(a * (point.theta - b));
      const diff = point.y - p;
      gradA += diff * (point.theta - b);
      gradB += diff * (-a);
    }

    gradA -= options.l2 * a;
    gradB -= options.l2 * b;

    const stepA = (options.lr * gradA) / n;
    const stepB = (options.lr * gradB) / n;

    a += stepA;
    b += stepB;

    if (!Number.isFinite(a) || !Number.isFinite(b)) {
      a = 1;
      b = 0;
      break;
    }

    a = Math.min(Math.max(a, options.minA), options.maxA);
    b = Math.min(Math.max(b, options.minB), options.maxB);

    if (Math.abs(stepA) + Math.abs(stepB) < options.tol) {
      break;
    }
  }

  return { a, b } satisfies IrtParams;
};

export const runIrt = async (pool: Pool, tenantId: string) => {
  const windowDays = Number(process.env.ANALYTICS_WINDOW_DAYS ?? 30);
  const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString();

  const responses = await pool.query<ResponseRow>(
    `
    SELECT item_id, session_id, is_correct
    FROM item_responses
    WHERE tenant_id = $1 AND answered_at >= $2
    `,
    [tenantId, since]
  );

  const datasetHash = hashPayload(`${responses.rowCount}:${since}`);
  const analysisRun = await createAnalysisRun(
    pool,
    tenantId,
    'IRT',
    { model: '2PL', method: 'gradient', windowDays },
    { since },
    datasetHash
  );

  const sessionStats = new Map<string, { total: number; correct: number }>();
  for (const row of responses.rows) {
    const stats = sessionStats.get(row.session_id) ?? { total: 0, correct: 0 };
    stats.total += 1;
    if (row.is_correct) stats.correct += 1;
    sessionStats.set(row.session_id, stats);
  }

  const scores = Array.from(sessionStats.values()).map(stat => stat.correct);
  const scoreMean = mean(scores);
  const scoreStd = stddev(scores) || 1;

  const thetaMap = new Map<string, number>();
  sessionStats.forEach((stat, sessionId) => {
    thetaMap.set(sessionId, (stat.correct - scoreMean) / scoreStd);
  });

  const grouped = new Map<string, Array<{ theta: number; y: number }>>();
  for (const row of responses.rows) {
    const theta = thetaMap.get(row.session_id) ?? 0;
    const y = row.is_correct ? 1 : 0;
    const list = grouped.get(row.item_id) ?? [];
    list.push({ theta, y });
    grouped.set(row.item_id, list);
  }

  const minResponses = Number(process.env.IRT_MIN_RESPONSES ?? 30);
  const maxIters = Number(process.env.IRT_MAX_ITERS ?? 250);
  const lr = Number(process.env.IRT_LR ?? 0.05);
  const tol = Number(process.env.IRT_TOL ?? 0.0005);
  const l2 = Number(process.env.IRT_L2 ?? 0.01);

  const options = {
    maxIters,
    lr,
    tol,
    l2,
    minA: 0.2,
    maxA: 3,
    minB: -4,
    maxB: 4
  };

  let savedCount = 0;

  for (const [itemId, data] of grouped.entries()) {
    if (data.length < minResponses) continue;
    const params = estimate2pl(data, options);

    await pool.query(
      `
      INSERT INTO item_irt_params
        (tenant_id, item_id, analysis_run_id, model, a_param, b_param, c_param, d_param, estimation_method, n)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      `,
      [tenantId, itemId, analysisRun.id, '2PL', params.a, params.b, 0, 1, 'gradient_2pl', data.length]
    );
    savedCount += 1;
  }

  return { analysisRunId: analysisRun.id, itemCount: savedCount };
};
