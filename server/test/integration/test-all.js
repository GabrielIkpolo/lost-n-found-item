// server/test/integration/test-all.js
import { describe, test } from 'vitest';
import { request } from 'supertest';
import app from '../../index.js';
import { describe, test, vi, beforeEach } from 'vitest';

// Test that our app is set up correctly
describe('App Setup', () => {
  test('should respond with 200 on GET /', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Server is running');
  });
});