import { FastifyInstance } from 'fastify';
import { hashPassword, verifyPassword } from '../utils/password';
import { RoleCode } from '../types';

type RegisterBody = {
  tenantName: string;
  name: string;
  email: string;
  password: string;
};

type LoginBody = {
  tenantId: string;
  email: string;
  password: string;
};

const ROLE_ADMIN: RoleCode = 'ADMIN';

export const authRoutes = async (fastify: FastifyInstance) => {
  fastify.post<{ Body: RegisterBody }>('/register', async (request, reply) => {
    const { tenantName, name, email, password } = request.body;

    if (!tenantName || !name || !email || !password) {
      reply.code(400).send({ message: 'Missing required fields' });
      return;
    }

    const client = await fastify.db.connect();
    try {
      await client.query('BEGIN');

      const tenantResult = await client.query(
        'INSERT INTO tenants (name) VALUES ($1) RETURNING id',
        [tenantName]
      );
      const tenantId = tenantResult.rows[0]?.id as string;

      const passwordHash = await hashPassword(password);
      const userResult = await client.query(
        `
        INSERT INTO users (tenant_id, name, email, password_hash)
        VALUES ($1, $2, $3, $4)
        RETURNING id, email, name
        `,
        [tenantId, name, email, passwordHash]
      );

      const userId = userResult.rows[0]?.id as string;

      const roleResult = await client.query(
        'SELECT id FROM roles WHERE code = $1',
        [ROLE_ADMIN]
      );
      const roleId = roleResult.rows[0]?.id as string | undefined;

      if (!roleId) {
        throw new Error('Role ADMIN not found. Run migrations.');
      }

      await client.query(
        `
        INSERT INTO user_roles (user_id, tenant_id, role_id)
        VALUES ($1, $2, $3)
        `,
        [userId, tenantId, roleId]
      );

      await client.query('COMMIT');

      const token = fastify.jwt.sign({
        id: userId,
        tenantId,
        email,
        name,
        roles: [ROLE_ADMIN]
      });

      await fastify.auditLog({
        tenantId,
        actorUserId: userId,
        action: 'AUTH_REGISTER',
        entityType: 'user',
        entityId: userId,
        afterData: { email, name, roles: [ROLE_ADMIN] },
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'] ?? null
      });

      reply.send({
        token,
        user: { id: userId, tenantId, email, name, roles: [ROLE_ADMIN] }
      });
    } catch (error) {
      await client.query('ROLLBACK');
      const message = error instanceof Error ? error.message : 'Registration failed';
      reply.code(400).send({ message });
    } finally {
      client.release();
    }
  });

  fastify.post<{ Body: LoginBody }>('/login', async (request, reply) => {
    const { tenantId, email, password } = request.body;

    if (!tenantId || !email || !password) {
      reply.code(400).send({ message: 'Missing required fields' });
      return;
    }

    const userResult = await fastify.db.query(
      `
      SELECT id, tenant_id, name, email, password_hash, is_active
      FROM users
      WHERE tenant_id = $1 AND email = $2
      `,
      [tenantId, email]
    );

    const user = userResult.rows[0];
    if (!user || !user.is_active) {
      reply.code(401).send({ message: 'Invalid credentials' });
      return;
    }

    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      reply.code(401).send({ message: 'Invalid credentials' });
      return;
    }

    const rolesResult = await fastify.db.query(
      `
      SELECT r.code
      FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = $1 AND ur.tenant_id = $2
      `,
      [user.id, tenantId]
    );

    const roles = rolesResult.rows.map(row => row.code as RoleCode);

    const token = fastify.jwt.sign({
      id: user.id,
      tenantId: user.tenant_id,
      email: user.email,
      name: user.name,
      roles
    });

    await fastify.auditLog({
      tenantId: user.tenant_id,
      actorUserId: user.id,
      action: 'AUTH_LOGIN',
      entityType: 'user',
      entityId: user.id,
      afterData: { email: user.email, roles },
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'] ?? null
    });

    reply.send({
      token,
      user: {
        id: user.id,
        tenantId: user.tenant_id,
        email: user.email,
        name: user.name,
        roles
      }
    });
  });

  fastify.get('/me', { preHandler: fastify.authenticate }, async (request) => {
    return { user: request.user };
  });
};