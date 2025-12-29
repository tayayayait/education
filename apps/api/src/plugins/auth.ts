import fp from 'fastify-plugin';
import jwtPlugin from '@fastify/jwt';
import { AuthUser } from '../types';

const authPlugin = fp(async (fastify) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not set');
  }

  await fastify.register(jwtPlugin, {
    secret
  });

  fastify.decorate('authenticate', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch {
      reply.code(401).send({ message: 'Unauthorized' });
      return;
    }

    const payload = request.user as AuthUser | undefined;
    if (!payload || !payload.tenantId) {
      reply.code(401).send({ message: 'Invalid token' });
      return;
    }

    const rawHeader = request.headers['x-tenant-id'];
    const headerTenant = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;
    if (headerTenant && headerTenant !== payload.tenantId) {
      reply.code(403).send({ message: 'Tenant mismatch' });
      return;
    }

    request.user = payload;
    request.tenantId = payload.tenantId;
  });

  fastify.decorate('authorize', (allowed) => async (request, reply) => {
    const user = request.user;
    if (!user) {
      reply.code(401).send({ message: 'Unauthorized' });
      return;
    }

    const hasRole = user.roles.some(role => allowed.includes(role));
    if (!hasRole) {
      reply.code(403).send({ message: 'Forbidden' });
      return;
    }
  });
});

export default authPlugin;
