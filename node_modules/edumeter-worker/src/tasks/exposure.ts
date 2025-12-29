import { Pool } from 'pg';
import { createAnalysisRun, hashPayload } from './db';

type ExposureRow = {
  item_id: string;
  response_time_ms: number | null;
};

const mean = (values: number[]) => values.reduce((sum, v) => sum + v, 0) / (values.length || 1);

export const runExposure = async (pool: Pool, tenantId: string) => {
  const windowDays = Number(process.env.ANALYTICS_WINDOW_DAYS ?? 30);
  const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString();

  const responses = await pool.query<ExposureRow>(
    `
    SELECT item_id, response_time_ms
    FROM item_responses
    WHERE tenant_id = $1 AND answered_at >= $2
    `,
    [tenantId, since]
  );

  const datasetHash = hashPayload(`${responses.rowCount}:${since}`);
  const analysisRun = await createAnalysisRun(
    pool,
    tenantId,
    'EXPOSURE',
    { windowDays },
    { since },
    datasetHash
  );

  const groups = new Map<string, ExposureRow[]>();
  responses.rows.forEach((row) => {
    const list = groups.get(row.item_id) ?? [];
    list.push(row);
    groups.set(row.item_id, list);
  });

  for (const [itemId, rows] of groups.entries()) {
    const times = rows.map(r => r.response_time_ms ?? 0).filter(v => v > 0);
    await pool.query(
      `
      INSERT INTO item_exposure_stats
        (tenant_id, item_id, analysis_run_id, exposure_count, mean_time_ms)
      VALUES ($1,$2,$3,$4,$5)
      `,
      [tenantId, itemId, analysisRun.id, rows.length, times.length ? mean(times) : null]
    );
  }

  return { analysisRunId: analysisRun.id, itemCount: groups.size };
};