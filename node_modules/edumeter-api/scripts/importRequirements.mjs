import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Client } from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputPath = process.argv[2];
if (!inputPath) {
  console.error('Usage: node importRequirements.mjs <file.(json|csv)> <baselineVersion?>');
  process.exit(1);
}

const baselineVersion = process.argv[3];

const connectionString = process.env.DATABASE_URL;
const tenantId = process.env.TENANT_ID;
const userId = process.env.USER_ID;

if (!connectionString || !tenantId || !userId) {
  console.error('DATABASE_URL, TENANT_ID, USER_ID are required');
  process.exit(1);
}

const csvToRecords = (input) => {
  const lines = input.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return [];

  const parseLine = (line) => {
    const result = [];
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
    const row = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] ?? '';
    });
    return {
      code: row.code ?? row['?⑥쥙?甕곕뜇??] ?? '',
      category: row.category ?? row['?브쑬履?] ?? '',
      name: row.name ?? row['筌뤿굞臾?] ?? '',
      description: row.description ?? row['?怨멸쉭??살구'] ?? '',
      definition: row.definition ?? row['?類ㅼ벥'] ?? '',
      details: row.details ?? row['?紐???곸뒠'] ?? '',
      deliverables: row.deliverables ?? row['?怨쀭뀱??] ?? ''
    };
  });
};

const normalize = (item) => ({
  code: item.code?.trim(),
  category: item.category?.trim(),
  name: item.name?.trim(),
  description: item.description?.trim() || null,
  definition: item.definition?.trim() || null,
  details: item.details?.trim() || null,
  deliverables: item.deliverables?.trim() || null
});

const run = async () => {
  const ext = path.extname(inputPath).toLowerCase();
  const raw = fs.readFileSync(path.resolve(process.cwd(), inputPath), 'utf-8');

  const records = ext === '.json'
    ? JSON.parse(raw)
    : csvToRecords(raw);

  const normalized = records.map(normalize).filter((r) => r.code && r.category && r.name);

  if (normalized.length === 0) {
    throw new Error('No valid requirements found');
  }

  const client = new Client({ connectionString });
  await client.connect();

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
          item.description,
          item.definition,
          item.details,
          item.deliverables,
          userId
        ]
      );
    }

    if (baselineVersion) {
      const baselineResult = await client.query(
        `
        INSERT INTO requirement_baselines (tenant_id, version, title, created_by)
        VALUES ($1,$2,$3,$4)
        RETURNING id
        `,
        [tenantId, baselineVersion, 'Baseline v1', userId]
      );
      const baselineId = baselineResult.rows[0]?.id;

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

    await client.query('COMMIT');
    console.log(`Imported ${normalized.length} requirements.`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    await client.end();
  }
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
