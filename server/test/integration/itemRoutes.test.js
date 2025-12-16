// server/test/integration/itemRoutes.test.js
import request from 'supertest';
import app from '../../index.js';
import { prisma } from '../../src/helpers/prisma.js';
import { describe, test, vi, beforeEach } from 'vitest';

// Mock the Prisma client
vi.mock('../../src/helpers/prisma.js', () => ({
  prisma: {
    item: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe('Item Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /items', () => {
    test('should get all items', async () => {
      prisma.item.findMany.mockResolvedValue([
        { id: '1', name: 'Item 1', description: 'Description 1' },
        { id: '2', name: 'Item 2', description: 'Description 2' },
      ]);

      const response = await request(app).get('/items');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
    });
  });

  describe('POST /items', () => {
    test('should create a new item', async () => {
      prisma.item.create.mockResolvedValue({
        id: '1',
        name: 'New Item',
        description: 'New Description',
      });

      const response = await request(app)
        .post('/items')
        .send({
          name: 'New Item',
          description: 'New Description',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('New Item');
    });
  });

  describe('PUT /items/:id', () => {
    test('should update an item', async () => {
      prisma.item.update.mockResolvedValue({
        id: '1',
        name: 'Updated Item',
        description: 'Updated Description',
      });

      const response = await request(app)
        .put('/items/1')
        .send({
          name: 'Updated Item',
          description: 'Updated Description',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', '1');
      expect(response.body.name).toBe('Updated Item');
    });
  });

  describe('DELETE /items/:id', () => {
    test('should delete an item', async () => {
      prisma.item.delete.mockResolvedValue({
        id: '1',
        name: 'Item to delete',
        description: 'Description',
      });

      const response = await request(app).delete('/items/1');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', '1');
    });
  });
});