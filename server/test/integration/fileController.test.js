// server/test/integration/fileController.test.js
import request from 'supertest';
import app from '../../index.js';
import { prisma } from '../../src/helpers/prisma.js';
import { fileService } from '../../src/services/fileService.js';
import { describe, test, vi, beforeEach } from 'vitest';

// Mock the Prisma client and fileService
vi.mock('../../src/helpers/prisma.js', () => ({
  prisma: {
    file: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock('../../src/services/fileService.js', () => ({
  fileService: {
    uploadFile: vi.fn(),
    deleteFile: vi.fn(),
  },
}));

describe('File Controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /files', () => {
    test('should get all files', async () => {
      prisma.file.findMany.mockResolvedValue([
        { id: '1', fileName: 'file1.jpg', url: 'https://example.com/file1.jpg' },
        { id: '2', fileName: 'file2.jpg', url: 'https://example.com/file2.jpg' },
      ]);

      const response = await request(app).get('/files');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
    });
  });

  describe('POST /files', () => {
    test('should upload a file', async () => {
      fileService.uploadFile.mockResolvedValue({
        id: '1',
        fileName: 'uploaded.jpg',
        url: 'https://example.com/uploaded.jpg',
      });

      const response = await request(app)
        .post('/files')
        .attach('file', 'test/fixtures/test.jpg');

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.fileName).toBe('uploaded.jpg');
    });
  });

  describe('PUT /files/:id', () => {
    test('should update a file', async () => {
      prisma.file.update.mockResolvedValue({
        id: '1',
        fileName: 'updated.jpg',
        url: 'https://example.com/updated.jpg',
      });

      const response = await request(app)
        .put('/files/1')
        .send({
          fileName: 'updated.jpg',
          url: 'https://example.com/updated.jpg',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', '1');
      expect(response.body.fileName).toBe('updated.jpg');
    });
  });

  describe('DELETE /files/:id', () => {
    test('should delete a file', async () => {
      prisma.file.delete.mockResolvedValue({
        id: '1',
        fileName: 'fileToDelete.jpg',
        url: 'https://example.com/fileToDelete.jpg',
      });

      const response = await request(app).delete('/files/1');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', '1');
    });
  });
});