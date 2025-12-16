// server/test/integration/userRoutes.test.js
import request from 'supertest';
import app from '../../index.js';
import { prisma } from '../../src/helpers/prisma.js';
import { describe, test, vi, beforeEach } from 'vitest';

// Mock the Prisma client
vi.mock('../../src/helpers/prisma.js', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe('User Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /users', () => {
    test('should get all users', async () => {
      prisma.user.findMany.mockResolvedValue([
        { id: '1', email: 'user1@example.com', role: 'user' },
        { id: '2', email: 'user2@example.com', role: 'user' },
      ]);

      const response = await request(app).get('/users');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body).toContainEqual({ id: '1', email: 'user1@example.com', role: 'user' });
    });
  });

  describe('GET /users/:id', () => {
    test('should get a user by id', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: '1',
        email: 'user1@example.com',
        role: 'user',
      });

      const response = await request(app).get('/users/1');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', '1');
      expect(response.body.email).toBe('user1@example.com');
    });
  });

  describe('POST /users', () => {
    test('should create a new user', async () => {
      prisma.user.create.mockResolvedValue({
        id: '1',
        email: 'newuser@example.com',
        role: 'user',
      });

      const response = await request(app)
        .post('/users')
        .send({
          email: 'newuser@example.com',
          role: 'user',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toBe('newuser@example.com');
    });
  });

  describe('PUT /users/:id', () => {
    test('should update a user', async () => {
      prisma.user.update.mockResolvedValue({
        id: '1',
        email: 'updateduser@example.com',
        role: 'admin',
      });

      const response = await request(app)
        .put('/users/1')
        .send({
          email: 'updateduser@example.com',
          role: 'admin',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', '1');
      expect(response.body.email).toBe('updateduser@example.com');
      expect(response.body.role).toBe('admin');
    });
  });

  describe('DELETE /users/:id', () => {
    test('should delete a user', async () => {
      prisma.user.delete.mockResolvedValue({
        id: '1',
        email: 'user1@example.com',
        role: 'user',
      });

      const response = await request(app).delete('/users/1');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', '1');
      expect(response.body.email).toBe('user1@example.com');
    });
  });
});