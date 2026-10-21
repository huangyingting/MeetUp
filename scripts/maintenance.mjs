import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { createPrismaAdapter } from '../src/lib/prisma-adapter.mjs';

const prisma = new PrismaClient({ adapter: createPrismaAdapter() });
try {
  const now = new Date();
  const [limits, tokens] = await prisma.$transaction([
    prisma.apiRateLimit.deleteMany({ where: { resetAt: { lt: now } } }),
    prisma.verificationToken.deleteMany({ where: { expires: { lt: now } } }),
  ]);
  console.log(`Removed ${limits.count} expired rate-limit entries and ${tokens.count} expired account tokens.`);
} finally {
  await prisma.$disconnect();
}
