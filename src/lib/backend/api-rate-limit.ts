import { prisma } from '@/lib/prisma';
import { consumeRateLimit } from './rate-limit';

// The schema-owned ApiRateLimit table is required; storage failures fail closed.
export async function rateLimit(key: string, limit: number, windowMs: number): Promise<void> {
  await consumeRateLimit(prisma, key, limit, windowMs);
}
