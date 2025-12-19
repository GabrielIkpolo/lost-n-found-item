import { describe, test, vi, beforeEach, expect } from 'vitest';
import request from 'supertest';
import app from '../../index.js';

vi.mock('../../src/helpers/authMiddleware.js', () => ({
  requireSignin: (req, res, next) => { req.user = { id: '1', role: 'USER' }; next(); },
  optionalSignin: (req, res, next) => next(),
  isAdmin: (req, res, next) => next(),
  isSuperAdmin: (req, res, next) => next(),
}));

vi.mock('../../src/helpers/prisma.js', () => ({
  default: {
    supportTicket: {
      findMany: vi.fn().mockResolvedValue([{ id: '1', subject: 'Help' }]),
      create: vi.fn().mockResolvedValue({ id: '1' }),
      findUnique: vi.fn(),
      update: vi.fn(),
    }
  }
}));

describe('Support Controller', () => {
  test('GET /api/support should get tickets', async () => {
    const response = await request(app).get('/api/support');
    expect(response.status).toBe(200);
  });
});