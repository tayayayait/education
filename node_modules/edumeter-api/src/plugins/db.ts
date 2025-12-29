import fp from 'fastify-plugin';
import { Pool } from 'pg';

const dbPlugin = fp(async (fastify) => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }

  const pool = new Pool({ connectionString });

  fastify.decorate('db', pool);

  fastify.addHook('onClose', async (app) => {
    await app.db.end();
  });
});

export default dbPlugin;