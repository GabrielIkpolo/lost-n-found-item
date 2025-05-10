import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Exporting the prisma client to be used across the application
export default prisma;
