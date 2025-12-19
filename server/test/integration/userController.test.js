import { describe, test, vi, beforeEach, expect } from 'vitest';
import request from 'supertest';
import app from '../../index.js';

vi.mock('../../src/helpers/authMiddleware.js', () => ({
  requireSignin: (req, res, next) => {
    req.user = { id: 'admin-id', role: 'ADMIN' };
    next();
  },
  optionalSignin: (req, res, next) => {
    req.user = { id: 'admin-id', role: 'ADMIN' };
    next();
  },
  isAdmin: (req, res, next) => next(),
  isSuperAdmin: (req, res, next) => next(),
}));

vi.mock('../../src/helpers/prisma.js', () => ({
  default: {
    user: {
      // findUnique must return a user object so the controller doesn't 404
      findUnique: vi.fn().mockResolvedValue({ 
        id: 'target-id', 
        name: 'Target User', 
        role: 'USER' 
      }),
      findMany: vi.fn().mockResolvedValue([{ id: '1', email: 'user1@example.com', role: 'USER' }]),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn().mockResolvedValue({ 
        id: 'target-id', 
        name: 'Target User', 
        role: 'USER' 
      }),
    },
    auditLog: { create: vi.fn().mockResolvedValue({}) }
  }
}));

describe('User Controller', () => {
  test('GET /api/users should get all users', async () => {
    const response = await request(app).get('/api/users');
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
  });

  test('DELETE /api/users/:id should delete a user', async () => {
    const response = await request(app).delete('/api/users/target-id');
    expect(response.status).toBe(200);
    expect(response.body.message).toContain('successfully');
  });
});