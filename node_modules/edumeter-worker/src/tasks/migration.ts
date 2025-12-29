import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';

export type ImportOptions = {
  jobId: string;
  filePath: string;
  tenantId: string;
  userId?: string;
};

type ImportItem = {
  code: string;
  title: string;
  subject: string;
  grade: string;
  standardCode?: string;
  standardDescription?: string;
  purposeType?: string;
  stem?: string;
  answer?: string;
};

const validateItem = (item: ImportItem) => {
  return item.code && item.title && item.subject && item.grade;
};

export const runItemImport = async (pool: Pool, options: ImportOptions) => {
  const raw = fs.readFileSync(path.resolve(process.cwd(), options.filePath), 'utf-8');
  const items = JSON.parse(raw) as ImportItem[];

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      'UPDATE item_migration_jobs SET status = $1, started_at = now() WHERE id = $2 AND tenant_id = $3',
      ['running', options.jobId, options.tenantId]
    );

    for (const item of items) {
      if (!validateItem(item)) continue;

      const existing = await client.query(
        'SELECT * FROM items WHERE tenant_id = $1 AND code = $2',
        [options.tenantId, item.code]
      );

      let itemId: string;
      let action = 'create';

      if (existing.rowCount > 0) {
        itemId = existing.rows[0].id;
        action = 'update';
        await client.query(
          `
          UPDATE items
          SET title = $1, subject = $2, grade = $3, updated_at = now()
          WHERE id = $4 AND tenant_id = $5
          `,
          [item.title, item.subject, item.grade, itemId, options.tenantId]
        );
      } else {
        const inserted = await client.query(
          `
          INSERT INTO items (tenant_id, code, title, subject, grade, status)
          VALUES ($1,$2,$3,$4,$5,'draft')
          RETURNING id
          `,
          [options.tenantId, item.code, item.title, item.subject, item.grade]
        );
        itemId = inserted.rows[0].id;
      }

      if (item.standardCode || item.standardDescription) {
        await client.query(
          `
          INSERT INTO item_contents
            (tenant_id, item_id, standard_code, standard_description)
          VALUES ($1,$2,$3,$4)
          ON CONFLICT (item_id)
          DO UPDATE SET standard_code = EXCLUDED.standard_code,
                        standard_description = EXCLUDED.standard_description
          `,
          [options.tenantId, itemId, item.standardCode ?? null, item.standardDescription ?? null]
        );
      }

      if (item.purposeType) {
        await client.query(
          `
          INSERT INTO item_purposes
            (tenant_id, item_id, purpose_type)
          VALUES ($1,$2,$3)
          `,
          [options.tenantId, itemId, item.purposeType]
        );
      }

      if (item.stem && item.answer) {
        const versionNumber = 1;
        await client.query(
          `
          INSERT INTO item_versions
            (tenant_id, item_id, version_number, stem, answer)
          VALUES ($1,$2,$3,$4,$5)
          ON CONFLICT (item_id, version_number) DO NOTHING
          `,
          [options.tenantId, itemId, versionNumber, item.stem, item.answer]
        );
      }

      await client.query(
        `
        INSERT INTO item_migration_logs
          (job_id, tenant_id, item_id, action, before_data, after_data)
        VALUES ($1,$2,$3,$4,$5,$6)
        `,
        [options.jobId, options.tenantId, itemId, action, existing.rows[0] ?? null, item]
      );
    }

    await client.query(
      'UPDATE item_migration_jobs SET status = $1, completed_at = now() WHERE id = $2 AND tenant_id = $3',
      ['completed', options.jobId, options.tenantId]
    );

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    await client.query(
      'UPDATE item_migration_jobs SET status = $1, completed_at = now() WHERE id = $2 AND tenant_id = $3',
      ['failed', options.jobId, options.tenantId]
    );
    throw error;
  } finally {
    client.release();
  }
};