import { FastifyInstance } from 'fastify';

export const healthRoutes = async (fastify: FastifyInstance) => {
  fastify.get('/health', async () => ({ status: 'ok' }));
};