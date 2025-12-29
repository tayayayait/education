import { Pool } from 'pg';
import crypto from 'crypto';

export type AnalysisRun = {
  id: string;
  tenantId: string;
  runType: string;
};

export const getPool = () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is not set');
  return new Pool({ connectionString });
};

export const getTenantId = () => {
  const tenantId = process.env.TENANT_ID;
  if (!tenantId) throw new Error('TENANT_ID is not set');
  return tenantId;
};

export const hashPayload = (input: string) => {
  return crypto.createHash('sha256').update(input).digest('hex');
};

export const createAnalysisRun = async (
  pool: Pool,
  tenantId: string,
  runType: string,
  params: Record<string, unknown>,
  dataRange: Record<string, unknown>,
  datasetHash: string
) => {
  const result = await pool.query(
    `
    INSERT INTO analysis_runs
      (tenant_id, run_type, params, data_range, dataset_hash, software_version)
    VALUES ($1,$2,$3,$4,$5,$6)
    RETURNING id, tenant_id
    `,
    [tenantId, runType, params, dataRange, datasetHash, process.env.SOFTWARE_VERSION ?? null]
  );

  return {
    id: result.rows[0].id as string,
    tenantId: result.rows[0].tenant_id as string,
    runType
  } satisfies AnalysisRun;
};