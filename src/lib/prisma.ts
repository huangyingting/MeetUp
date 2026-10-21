import { PrismaClient } from '@prisma/client';
import { createPrismaAdapter } from './prisma-adapter.mjs';

function createClient() {
  return new PrismaClient({
    adapter: createPrismaAdapter(),
    omit: { user: { passwordHash: true } },
    log: ['error'],
  });
}

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createClient> | undefined;
};

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
