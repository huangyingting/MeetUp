import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { access, mkdir } from 'node:fs/promises';
import { constants } from 'node:fs';
import { uploadDirectory } from '@/lib/backend/media';
import { assertAccountEmailConfigured, emailVerificationRequired } from '@/lib/backend/account-email';

export default async function health(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ status: 'method_not_allowed' });
  }
  try {
    if (emailVerificationRequired()) assertAccountEmailConfigured();
    const storage = uploadDirectory();
    await mkdir(storage, { recursive: true, mode: 0o700 });
    await access(storage, constants.W_OK | constants.R_OK | constants.X_OK);
    await prisma.$queryRaw`SELECT 1`;
    return res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('Readiness check failed', error instanceof Error ? error.name : 'Unknown error');
    return res.status(503).json({ status: 'unavailable' });
  }
}
