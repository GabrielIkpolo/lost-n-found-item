// server/test/integration/supportController.test.js
import request from 'supertest';
import app from '../../index.js';
import { prisma } from '../../src/helpers/prisma.js';
import { describe, test, vi, beforeEach } from 'vitest';

// Mock the Prisma client
vi.mock('../../src/helpers/prisma.js', () => ({
  prisma: {
    support: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe('Support Controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /support', () => {
    test('should get all support tickets', async () => {
      prisma.support.findMany.mockResolvedValue([
        { id: '1', title: 'Ticket 1', description: 'Description 1' },
        { id: '2', title: 'Ticket 2', description: 'Description 2' },
      ]);

      const response = await request(app).get('/support');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
    });
  });

  describe('POST /support', () => {
    test('should create a new support ticket', async () => {
      prisma.support.create.mockResolvedValue({
        id: '1',
        title: 'New Ticket',
        description: 'New Description',
      });

      const response = await request(app)
        .post('/support')
        .send({
          title: 'New Ticket',
          description: 'New Description',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe('New Ticket');
    });
  });

  describe('PUT /support/:id', () => {
    test('should update a support ticket', async () => {
      prisma.support.update.mockResolvedValue({
        id: '1',
        title: 'Updated Ticket',
        description: 'Updated Description',
      });

      const response = await request(app)
        .put('/support/1')
        .send({
          title: 'Updated Ticket',
          description: 'Updated Description',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', '1');
      expect(response.body.title).toBe('Updated Ticket');
    });
  });

  describe('DELETE /support/:id', () => {
    test('should delete a support ticket', async () => {
      prisma.support.delete.mockResolvedValue({
        id: '1',
        title: 'Ticket to delete',
        description: 'Description',
      });

      const response = await request(app).delete('/support/1');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', '1');
    });
  });
});