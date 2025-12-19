import { vi } from 'vitest';
import { config } from 'dotenv';
import { prisma } from '../../src/helpers/prisma.js';

// Load environment variables
config();

// Set up any other test setup
// For example, you might want to connect to a test database or initialize mocks

// Clean up after tests
afterAll(async () => {
  await prisma.$disconnect();
});

// Mock global objects if needed
global.vi = vi;