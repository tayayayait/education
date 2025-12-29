import Fastify from 'fastify';
import cors from '@fastify/cors';
import dbPlugin from './plugins/db';
import authPlugin from './plugins/auth';
import auditPlugin from './plugins/audit';
import { authRoutes } from './routes/auth';
import { healthRoutes } from './routes/health';
import { requirementsRoutes } from './routes/requirements';
import { designRoutes } from './routes/design';
import { testRoutes } from './routes/tests';
import { itemRoutes } from './routes/items';
import { analyticsRoutes } from './routes/analytics';
import { migrationRoutes } from './routes/migration';
import { generationRoutes } from './routes/generation';

const server = Fastify({
  logger: true
});

const start = async () => {
  await server.register(cors, {
    origin: true,
    credentials: true
  });

  await server.register(dbPlugin);
  await server.register(auditPlugin);
  await server.register(authPlugin);

  await server.register(healthRoutes, { prefix: '/api' });
  await server.register(authRoutes, { prefix: '/api/auth' });
  await server.register(requirementsRoutes, { prefix: '/api' });
  await server.register(designRoutes, { prefix: '/api' });
  await server.register(testRoutes, { prefix: '/api' });
  await server.register(itemRoutes, { prefix: '/api' });
  await server.register(analyticsRoutes, { prefix: '/api' });
  await server.register(migrationRoutes, { prefix: '/api' });
  await server.register(generationRoutes, { prefix: '/api' });

  const port = Number(process.env.PORT ?? 4000);
  const host = process.env.HOST ?? '0.0.0.0';

  try {
    await server.listen({ port, host });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
