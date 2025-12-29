import { getPool, getTenantId } from './tasks/db';
import { runCtt } from './tasks/ctt';
import { runIrt } from './tasks/irt';
import { runExposure } from './tasks/exposure';
import { runDetection } from './tasks/detection';
import { runItemImport } from './tasks/migration';

const args = process.argv.slice(2);
const taskIndex = args.findIndex(arg => arg === '--task');
const task = taskIndex >= 0 ? args[taskIndex + 1] : 'ctt';

const getArg = (name: string) => {
  const idx = args.findIndex(arg => arg === name);
  return idx >= 0 ? args[idx + 1] : undefined;
};

const run = async () => {
  const pool = getPool();
  const tenantId = getTenantId();

  try {
    switch (task) {
      case 'ctt':
        console.log(await runCtt(pool, tenantId));
        break;
      case 'irt':
        console.log(await runIrt(pool, tenantId));
        break;
      case 'exposure':
        console.log(await runExposure(pool, tenantId));
        break;
      case 'detect':
        console.log(await runDetection(pool, tenantId));
        break;
      case 'import': {
        const jobId = getArg('--job');
        const filePath = getArg('--file');
        if (!jobId || !filePath) {
          throw new Error('Missing --job or --file for import task');
        }
        await runItemImport(pool, { jobId, filePath, tenantId, userId: process.env.USER_ID });
        console.log({ jobId, status: 'completed' });
        break;
      }
      default:
        throw new Error(`Unknown task: ${task}`);
    }
  } finally {
    await pool.end();
  }
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});