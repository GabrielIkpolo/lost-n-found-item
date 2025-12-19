import { describe, test, vi, beforeEach, expect } from 'vitest';
import request from 'supertest';
import app from '../../index.js';

vi.mock('../../src/helpers/authMiddleware.js', () => ({
  requireSignin: (req, res, next) => { req.user = { id: '1' }; next(); },
  optionalSignin: (req, res, next) => next(),
  isAdmin: (req, res, next) => next(),
  isSuperAdmin: (req, res, next) => next(),
}));

vi.mock('../../src/helpers/prisma.js', () => ({
  default: {
    item: {
      findMany: vi.fn().mockResolvedValue([{ id: '1', title: 'Item 1' }]),
      count: vi.fn().mockResolvedValue(1),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    auditLog: { create: vi.fn() }
  }
}));

describe('Item Routes', () => {
  test('GET /api/items should get all items', async () => {
    const response = await request(app).get('/api/items');
    expect(response.status).toBe(200);
    expect(response.body.items).toBeDefined();
  });
});