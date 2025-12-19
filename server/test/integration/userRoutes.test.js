import { describe, test, vi, expect } from 'vitest';
import request from 'supertest';
import app from '../../index.js';

vi.mock('../../src/helpers/authMiddleware.js', () => ({
  requireSignin: (req, res, next) => {
    req.user = { id: 'admin-user-id', role: 'ADMIN' };
    next();
  },
  optionalSignin: (req, res, next) => next(),
  isAdmin: (req, res, next) => next(),
  isSuperAdmin: (req, res, next) => next(),
}));

vi.mock('../../src/helpers/prisma.js', () => ({
  default: {
    user: {
      findMany: vi.fn().mockResolvedValue([{ id: '1', email: 'user1@example.com', role: 'USER' }]),
      findUnique: vi.fn().mockResolvedValue({ id: 'target-id', role: 'USER' }),
      delete: vi.fn().mockResolvedValue({ id: 'target-id' }),
    },
    auditLog: { create: vi.fn() }
  }
}));

describe('User Routes', () => {
  test('GET /api/users works', async () => {
    const response = await request(app).get('/api/users');
    expect(response.status).toBe(200);
  });

  test('DELETE /api/users/:id works', async () => {
    // The ID in URL must NOT match the mock user ID in middleware (admin-user-id)
    const response = await request(app).delete('/api/users/target-id');
    expect(response.status).toBe(200);
  });
});