// server/test/integration/authController.test.js
import { describe, test, vi, beforeEach } from 'vitest';
import supertest from 'supertest';
import app from '../../index.js';

// Complete Prisma mock
vi.mock('../../src/helpers/prisma.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    prisma: {
      user: {
        findUnique: vi.fn().mockResolvedValue({
          id: '1',
          email: 'test@example.com',
          password: '$2a$10$hashedpassword', // Mock bcrypt hash
          name: 'Test User',
          role: 'user',
          createdAt: new Date(),
          updatedAt: new Date()
        }),
        create: vi.fn().mockImplementation((data) => 
          Promise.resolve({
            id: '1',
            ...data.data,
            createdAt: new Date(),
            updatedAt: new Date()
          })
        ),
      },
    },
  };
});

// Mock authHelpers
vi.mock('../../src/helpers/authHelpers.js', () => ({
  hashPassword: vi.fn().mockResolvedValue('$2a$10$hashedpassword'),
  comparePassword: vi.fn().mockResolvedValue(true)
}));

const request = supertest(app);

describe('Auth Controller', () => {
  beforeEach(() => vi.clearAllMocks());

  test('POST /api/auth/register creates user', async () => {
    const response = await request
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User', // Required field
        role: 'user'       // Required field
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
  });

  test('POST /api/auth/login returns token', async () => {
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