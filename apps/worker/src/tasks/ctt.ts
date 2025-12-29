import { Pool } from 'pg';
import { createAnalysisRun, hashPayload } from './db';

type ResponseRow = {
  item_id: string;
  session_id: string;
  is_correct: boolean | null;
  response_time_ms: number | null;
};

const mean = (values: number[]) => values.reduce((sum, v) => sum + v, 0) / (values.length || 1);
const stddev = (values: number[]) => {
  if (values.length <= 1) return 0;
  const avg = mean(values);
  const variance = values.reduce((sum, v) => sum + (v - avg) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
};

export const runCtt = async (pool: Pool, tenantId: string) => {
  const windowDays = Number(process.env.ANALYTICS_WINDOW_DAYS ?? 30);
  const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString();

  const responses = await pool.query<ResponseRow>(
    `
    SELECT item_id, session_id, is_correct, response_time_ms
    FROM item_responses
    WHERE tenant_id = $1 AND answered_at >= $2
    `,
    [tenantId, since]
  );

  const datasetHash = hashPayload(`${responses.rowCount}:${since}`);
  const analysisRun = await createAnalysisRun(
    pool,
    tenantId,
    'CTT',
    { windowDays },
    { since },
    datasetHash
  );

  const sessionTotals = new Map<string, number>();
  for (const row of responses.rows) {
    if (!row.is_correct) continue;
    sessionTotals.set(row.session_id, (sessionTotals.get(row.session_id) ?? 0) + 1);
  }

  const itemGroups = new Map<string, ResponseRow[]>();
  responses.rows.forEach((row) => {
    const list = itemGroups.get(row.item_id) ?? [];
    list.push(row);
    itemGroups.set(row.item_id, list);
  });

  for (const [itemId, rows] of itemGroups.entries()) {
    const n = rows.length;
    const correctRows = rows.filter(r => r.is_correct);
    const p = n === 0 ? 0 : correctRows.length / n;
    const times = rows.map(r => r.response_time_ms ?? 0).filter(v => v > 0);

    const totals = rows.map(r => sessionTotals.get(r.session_id) ?? 0);
    const totalStd = stddev(totals);
    const meanCorrect = mean(correctRows.map(r => sessionTotals.get(r.session_id) ?? 0));
    const meanIncorrect = mean(rows.filter(r => !r.is_correct).map(r => sessionTotals.get(r.session_id) ?? 0));
    const q = 1 - p;
    const pointBiserial = totalStd === 0 ? 0 : ((meanCorrect - meanIncorrect) * Math.sqrt(p * q)) / totalStd;

    await pool.query(
      `
      INSERT INTO item_ctt_stats
        (tenant_id, item_id, analysis_run_id, n, p_value, discrimination, point_biserial, mean_time_ms, std_time_ms)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      `,
      [
        tenantId,
        itemId,
        analysisRun.id,
        n,
        p,
        pointBiserial,
        pointBiserial,
        times.length ? mean(times) : null,
        times.length ? stddev(times) : null
      ]
    );
  }

  return { analysisRunId: analysisRun.id, itemCount: itemGroups.size };
};