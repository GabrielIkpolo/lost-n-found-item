// server/test/integration/authController.test.js
import { describe, test, vi, beforeEach, expect } from 'vitest';
import supertest from 'supertest';
import app from '../../index.js';

// Define the mock functions as mutable variables that will be reassigned in vi.mock
let mockFindUnique;
let mockCreate;
// Complete Prisma mock
vi.mock('../../src/helpers/prisma.js', () => {
  // Re-define/re-assign the mock functions inside the factory to avoid hoisting issues
  mockFindUnique = vi.fn();
  mockCreate = vi.fn().mockImplementation((data) =>
    Promise.resolve({
      id: '1',
      // Ensure we spread data.data correctly as Prisma create accepts an object under 'data'
      ...data.data,
  createdAt: new Date(),
  updatedAt: new Date()
    })
  );

  const prismaMock = {
    user: {
      findUnique: mockFindUnique,
      create: mockCreate,
    },
  };
  return {
    // Mock the default export of prisma.js
    default: prismaMock,
    prisma: prismaMock,
  };
});

// Mock authHelpers
vi.mock('../../src/helpers/authHelpers.js', () => ({
  hashPassword: vi.fn().mockResolvedValue('$2a$10$hashedpassword'),
  comparePassword: vi.fn().mockResolvedValue(true)
}));

const request = supertest(app);

// Mock user object for login tests
const mockUser = {
  id: '1',
  email: 'test@example.com',
  password: '$2a$10$hashedpassword',
  name: 'Test User',
  role: 'USER',
  provider: 'LOCAL',
  emailVerified: true,
  createdAt: new Date(),
  updatedAt: new Date()
};

describe('Auth Controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock behavior for findUnique: no user exists (for registration tests)
    mockFindUnique.mockResolvedValue(null);
  });

  test('POST /api/auth/register creates user', async () => {
    const response = await request
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        role: 'user'
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('message');
  });

  test('POST /api/auth/login returns token', async () => {
    // Mock user exists and is verified for successful login
    mockFindUnique.mockResolvedValue(mockUser);

    const response = await request
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('accessToken');
    expect(response.body.user.role).toBe('USER');
  });
});

