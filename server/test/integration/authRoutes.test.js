// server/test/integration/authRoutes.test.js
import { describe, test, vi } from 'vitest';
import supertest from 'supertest';
import app from '../../index.js';

vi.mock('../../src/helpers/prisma.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    prisma: {
      user: {
        findUnique: vi.fn().mockResolvedValue({
          id: '1',
          email: 'test@example.com',
          password: '$2a$10$hashedpassword',
          name: 'Test User',
          role: 'user'
        })
      }
    }
  };
});

vi.mock('../../src/helpers/authHelpers.js', () => ({
  comparePassword: vi.fn().mockResolvedValue(true)
}));

const request = supertest(app);

describe('Auth Routes', () => {
  test('POST /api/auth/login succeeds with valid credentials', async () => {
    const response = await request
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
  });
});