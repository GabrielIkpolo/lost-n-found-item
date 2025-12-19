// // server/test/integration/authRoutes.test.js
// import { describe, test, vi } from 'vitest';
// import supertest from 'supertest';
// import app from '../../index.js';

// // Mock bcrypt to ensure password comparison succeeds
// vi.mock('bcrypt', () => ({
//   compare: vi.fn().mockResolvedValue(true)
// }));

// const prismaMock = {
//   user: {
//         findUnique: vi.fn().mockResolvedValue({
//           id: '1',
//           email: 'test@example.com',
//           password: '$2a$10$hashedpassword',
//           name: 'Test User',
//       role: 'USER',
//       provider: 'LOCAL',
//       emailVerified: true,
//           createdAt: new Date(),
//           updatedAt: new Date()
//         })
//       }
//   };
// vi.mock('../../src/helpers/prisma.js', () => {
//   return {
//     default: prismaMock,
//     prisma: prismaMock,
//   };
// });

// vi.mock('../../src/helpers/authHelpers.js', () => ({
//   comparePassword: vi.fn().mockResolvedValue(true)
// }));

// const request = supertest(app);

// describe('Auth Routes', () => {
//   test('POST /api/auth/login succeeds with valid credentials', async () => {
//     const response = await request
//       .post('/api/auth/login')
//       .send({
//         email: 'test@example.com',
//         password: 'password123'
//       });

//     expect(response.status).toBe(200);
//     expect(response.body).toHaveProperty('token');
//   });
// });


import { describe, test, vi, expect } from 'vitest';
import supertest from 'supertest';
import app from '../../index.js';

vi.mock('../../src/helpers/prisma.js', () => ({
  default: {
    user: {
      findUnique: vi.fn().mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        password: '$2a$10$hashedpassword',
        name: 'Test User',
        role: 'USER',
        provider: 'LOCAL',
        emailVerified: true,
      })
    }
  }
}));

vi.mock('bcrypt', () => ({
  default: { compare: vi.fn().mockResolvedValue(true) },
  compare: vi.fn().mockResolvedValue(true)
}));

const request = supertest(app);

describe('Auth Routes', () => {
  test('POST /api/auth/login succeeds with valid credentials', async () => {
    const response = await request
      .post('/api/auth/login') // Added /api/auth
      .send({
        email: 'test@example.com',
        password: 'password123'
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('accessToken'); // Changed from token to accessToken
  });
});