import { Pool } from 'pg';
import { createAnalysisRun, hashPayload } from './db';

type CttRow = {
  item_id: string;
  p_value: number | null;
  created_at: string;
  rn: number;
};

type IrtRow = {
  item_id: string;
  a_param: number | null;
  b_param: number | null;
  created_at: string;
  rn: number;
};

type ExposureRow = {
  item_id: string;
  exposure_count: number;
  mean_time_ms: number | null;
};

type ResponseRow = {
  item_id: string;
  is_correct: boolean | null;
  group_label: string | null;
};

export const runDetection = async (pool: Pool, tenantId: string) => {
  const windowDays = Number(process.env.ANALYTICS_WINDOW_DAYS ?? 30);
  const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString();

  const ipdThreshold = Number(process.env.IPD_THRESHOLD ?? 0.2);
  const ipdAThreshold = Number(process.env.IPD_A_THRESHOLD ?? 0.3);
  const ipdBThreshold = Number(process.env.IPD_B_THRESHOLD ?? 0.3);
  const difThreshold = Number(process.env.DIF_THRESHOLD ?? 0.2);
  const difMinResponses = Number(process.env.DIF_MIN_RESPONSES ?? 30);
  const exposureThreshold = Number(process.env.EXPOSURE_THRESHOLD ?? 200);
  const timeThreshold = Number(process.env.TIME_THRESHOLD_MS ?? 120000);

  const cttResults = await pool.query<CttRow>(
    `
    WITH ranked AS (
      SELECT item_id, p_value, created_at,
        ROW_NUMBER() OVER (PARTITION BY item_id ORDER BY created_at DESC) AS rn
      FROM item_ctt_stats
      WHERE tenant_id = $1
    )
    SELECT item_id, p_value, created_at, rn
    FROM ranked
    WHERE rn <= 2
    ORDER BY item_id, rn
    `,
    [tenantId]
  );

  const irtResults = await pool.query<IrtRow>(
    `
    WITH ranked AS (
      SELECT item_id, a_param, b_param, created_at,
        ROW_NUMBER() OVER (PARTITION BY item_id ORDER BY created_at DESC) AS rn
      FROM item_irt_params
      WHERE tenant_id = $1
    )
    SELECT item_id, a_param, b_param, created_at, rn
    FROM ranked
    WHERE rn <= 2
    ORDER BY item_id, rn
    `,
    [tenantId]
  );

  const exposureResults = await pool.query<ExposureRow>(
    `
    SELECT DISTINCT ON (item_id) item_id, exposure_count, mean_time_ms
    FROM item_exposure_stats
    WHERE tenant_id = $1
    ORDER BY item_id, created_at DESC
    `,
    [tenantId]
  );

  const detectionHash = hashPayload(`${cttResults.rowCount}:${irtResults.rowCount}:${exposureResults.rowCount}:${since}`);
  const analysisRun = await createAnalysisRun(
    pool,
    tenantId,
    'DETECTION',
    { ipdThreshold, ipdAThreshold, ipdBThreshold, difThreshold, difMinResponses, exposureThreshold, timeThreshold, windowDays },
    { since },
    detectionHash
  );

  const cttMap = new Map<string, CttRow[]>();
  cttResults.rows.forEach((row) => {
    const list = cttMap.get(row.item_id) ?? [];
    list.push(row);
    cttMap.set(row.item_id, list);
  });

  let ipdCount = 0;
  for (const [itemId, rows] of cttMap.entries()) {
    if (rows.length < 2) continue;
    const sorted = rows.sort((a, b) => a.rn - b.rn);
    const latest = sorted[0];
    const previous = sorted[1];
    const diff = Math.abs((latest.p_value ?? 0) - (previous.p_value ?? 0));
    if (diff >= ipdThreshold) {
      await pool.query(
        `
        INSERT INTO item_detection_results
          (tenant_id, item_id, detection_type, metric_name, metric_value, threshold, status, details, analysis_run_id)
        VALUES ($1,$2,'IPD','p_diff',$3,$4,'flagged',$5,$6)
        `,
        [tenantId, itemId, diff, ipdThreshold, { latest: latest.p_value, previous: previous.p_value }, analysisRun.id]
      );
      ipdCount += 1;
    }
  }

  const irtMap = new Map<string, IrtRow[]>();
  irtResults.rows.forEach((row) => {
    const list = irtMap.get(row.item_id) ?? [];
    list.push(row);
    irtMap.set(row.item_id, list);
  });

  for (const [itemId, rows] of irtMap.entries()) {
    if (rows.length < 2) continue;
    const sorted = rows.sort((a, b) => a.rn - b.rn);
    const latest = sorted[0];
    const previous = sorted[1];

    const aDiff = Math.abs((latest.a_param ?? 0) - (previous.a_param ?? 0));
    const bDiff = Math.abs((latest.b_param ?? 0) - (previous.b_param ?? 0));

    if (aDiff >= ipdAThreshold) {
      await pool.query(
        `
        INSERT INTO item_detection_results
          (tenant_id, item_id, detection_type, metric_name, metric_value, threshold, status, details, analysis_run_id)
        VALUES ($1,$2,'IPD','a_diff',$3,$4,'flagged',$5,$6)
        `,
        [tenantId, itemId, aDiff, ipdAThreshold, { latest: latest.a_param, previous: previous.a_param }, analysisRun.id]
      );
    }

    if (bDiff >= ipdBThreshold) {
      await pool.query(
        `
        INSERT INTO item_detection_results
          (tenant_id, item_id, detection_type, metric_name, metric_value, threshold, status, details, analysis_run_id)
        VALUES ($1,$2,'IPD','b_diff',$3,$4,'flagged',$5,$6)
        `,
        [tenantId, itemId, bDiff, ipdBThreshold, { latest: latest.b_param, previous: previous.b_param }, analysisRun.id]
      );
    }
  }

  let exposureCount = 0;
  let timeCount = 0;
  for (const row of exposureResults.rows) {
    if (row.exposure_count >= exposureThreshold) {
      await pool.query(
        `
        INSERT INTO item_detection_results
          (tenant_id, item_id, detection_type, metric_name, metric_value, threshold, status, details, analysis_run_id)
        VALUES ($1,$2,'EXPOSURE','count',$3,$4,'flagged',$5,$6)
        `,
        [tenantId, row.item_id, row.exposure_count, exposureThreshold, {}, analysisRun.id]
      );
      exposureCount += 1;
    }

    if (row.mean_time_ms && row.mean_time_ms >= timeThreshold) {
      await pool.query(
        `
        INSERT INTO item_detection_results
          (tenant_id, item_id, detection_type, metric_name, metric_value, threshold, status, details, analysis_run_id)
        VALUES ($1,$2,'TIME','mean_time_ms',$3,$4,'flagged',$5,$6)
        `,
        [tenantId, row.item_id, row.mean_time_ms, timeThreshold, {}, analysisRun.id]
      );
      timeCount += 1;
    }
  }

  const responses = await pool.query<ResponseRow>(
    `
    SELECT r.item_id, r.is_correct, COALESCE(s.attributes->>'group', 'unknown') AS group_label
    FROM item_responses r
    LEFT JOIN test_sessions ts ON ts.id = r.session_id
    LEFT JOIN students s ON s.id = ts.student_id
    WHERE r.tenant_id = $1 AND r.answered_at >= $2
    `,
    [tenantId, since]
  );

  const difMap = new Map<string, Map<string, { total: number; correct: number }>>();
  responses.rows.forEach((row) => {
    const group = row.group_label ?? 'unknown';
    const groupStats = difMap.get(row.item_id) ?? new Map();
    const stats = groupStats.get(group) ?? { total: 0, correct: 0 };
    stats.total += 1;
    if (row.is_correct) stats.correct += 1;
    groupStats.set(group, stats);
    difMap.set(row.item_id, groupStats);
  });

  let difCount = 0;
  for (const [itemId, groupStats] of difMap.entries()) {
    const eligible = Array.from(groupStats.entries())
      .filter(([, stats]) => stats.total >= difMinResponses)
      .map(([group, stats]) => ({ group, stats }));

    if (eligible.length < 2) continue;

    const pValues = eligible.map(({ stats }) => (stats.total === 0 ? 0 : stats.correct / stats.total));
    const maxP = Math.max(...pValues);
    const minP = Math.min(...pValues);
    const diff = Math.abs(maxP - minP);

    if (diff >= difThreshold) {
      const details = eligible.reduce<Record<string, { total: number; correct: number }>>((acc, { group, stats }) => {
        acc[group] = stats;
        return acc;
      }, {});

      await pool.query(
        `
        INSERT INTO item_detection_results
          (tenant_id, item_id, detection_type, metric_name, metric_value, threshold, status, details, analysis_run_id)
        VALUES ($1,$2,'DIF','p_diff',$3,$4,'flagged',$5,$6)
        `,
        [tenantId, itemId, diff, difThreshold, { groupStats: details }, analysisRun.id]
      );
      difCount += 1;
    }
  }

  return {
    analysisRunId: analysisRun.id,
    ipdCount,
    difCount,
    exposureCount,
    timeCount
  };
};
