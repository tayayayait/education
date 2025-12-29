import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Client } from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrationsDir = path.resolve(__dirname, '../migrations');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

const client = new Client({ connectionString });

const ensureMigrationsTable = async () => {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    );
  `);
};

const getAppliedMigrations = async () => {
  const result = await client.query('SELECT version FROM schema_migrations');
  return new Set(result.rows.map(row => row.version));
};

const run = async () => {
  await client.connect();
  await ensureMigrationsTable();

  const applied = await getAppliedMigrations();
  const files = fs
    .readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();

  for (const file of files) {
    if (applied.has(file)) continue;

    const fullPath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(fullPath, 'utf-8');

    console.log(`Applying ${file}...`);
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (version) VALUES ($1)', [file]);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`Failed to apply ${file}`);
      throw error;
    }
  }

  console.log('Migrations complete.');
  await client.end();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});