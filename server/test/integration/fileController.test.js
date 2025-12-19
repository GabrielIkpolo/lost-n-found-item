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
    file: {
      findMany: vi.fn().mockResolvedValue([{ id: '1', filename: 'test.jpg' }]),
      findUnique: vi.fn(),
      delete: vi.fn(),
      create: vi.fn(),
    }
  }
}));

describe('File Controller', () => {
  test('GET /api/files should get all files', async () => {
    const response = await request(app).get('/api/files');
    expect(response.status).toBe(200);
  });
});