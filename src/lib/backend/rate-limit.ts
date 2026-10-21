import { createHash } from 'node:crypto';
import { ApiError } from './security';

interface Bucket { count: number; resetAt: Date }
interface LimitTransaction {
  apiRateLimit: {
    updateMany(args: { where: { id: string; resetAt: { lte: Date } }; data: Bucket }): Promise<unknown>;
    upsert(args: { where: { id: string }; create: Bucket & { id: string }; update: { count: { increment: number } } }): Promise<Bucket>;
  };
}
export interface LimitStore {
  $transaction<T>(callback: (tx: LimitTransaction) => Promise<T>, options: { isolationLevel: 'Serializable' }): Promise<T>;
}

export async function consumeRateLimit(
  store: LimitStore, key: string, limit: number, windowMs: number, now = new Date(),
): Promise<void> {
  const id = createHash('sha256').update(key).digest('hex');
  let bucket: Bucket;
  for (let attempt = 0; ; attempt++) {
    try {
      bucket = await store.$transaction(async tx => {
        await tx.apiRateLimit.updateMany({ where: { id, resetAt: { lte: now } }, data: { count: 0, resetAt: new Date(now.getTime() + windowMs) } });
        return tx.apiRateLimit.upsert({ where: { id }, create: { id, count: 1, resetAt: new Date(now.getTime() + windowMs) }, update: { count: { increment: 1 } } });
      }, { isolationLevel: 'Serializable' });
      break;
    } catch (error) {
      const code = error && typeof error === 'object' && 'code' in error ? error.code : undefined;
      if (attempt < 3 && ['P2034', 'P2002', 'P1008'].includes(String(code))) continue;
      throw error;
    }
  }
  if (bucket.count > limit) throw new ApiError(429, 'Too many requests. Try again later.', 'RATE_LIMITED');
}
