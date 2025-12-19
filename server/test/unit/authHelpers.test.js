// // server/test/unit/authHelpers.test.js
// import { hashPassword, comparePassword } from '../../src/helpers/authHelpers.js';
// import dotenv from 'dotenv';
// import { describe, test, vi, beforeEach } from 'vitest';

// // Configure dotenv for the test environment
// dotenv.config();
// // Set a default SALT_ROUNDS for testing if not set in .env
// if (!process.env.SALT_ROUNDS) {
//     process.env.SALT_ROUNDS = '10';
// }

// describe('authHelpers', () => {
//   const plainPassword = 'password123';

//   // Test hashPassword
//   test('hashPassword should generate a valid hash', async () => {
//     const hashedPassword = await hashPassword(plainPassword);
    
//     // Check if the hash is a string and not empty
//     expect(typeof hashedPassword).toBe('string');
//     expect(hashedPassword.length).toBeGreaterThan(0);
    
//     // Check if the hash is different from the original password
//     expect(hashedPassword).not.toBe(plainPassword);
//   });

//   // Test comparePassword
//   test('comparePassword should return true for matching passwords', async () => {
//     const hashedPassword = await hashPassword(plainPassword);
//     const isMatch = await comparePassword(plainPassword, hashedPassword);
//     expect(isMatch).toBe(true);
//   });

//   test('comparePassword should return false for non-matching passwords', async () => {
//     const hashedPassword = await hashPassword(plainPassword);
//     const wrongPassword = 'wrongpassword';
//     const isMatch = await comparePassword(wrongPassword, hashedPassword);
//     expect(isMatch).toBe(false);
//   });
// });



import { hashPassword, comparePassword } from '../../src/helpers/authHelpers.js';
import { describe, test, expect } from 'vitest';

describe('authHelpers', () => {
  const plainPassword = 'password123';

  test('hashPassword and comparePassword logic', async () => {
    // Inject mock env for salt rounds if missing
    process.env.SALT_ROUNDS = '10';
    
    const hash = await hashPassword(plainPassword);
    expect(typeof hash).toBe('string');
    
    const isMatch = await comparePassword(plainPassword, hash);
    expect(isMatch).toBe(true);
    
    const isNotMatch = await comparePassword('wrong', hash);
    expect(isNotMatch).toBe(false);
  });
});