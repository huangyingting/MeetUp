import type { NextApiRequest, NextApiResponse } from 'next';
import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ApiError, emailAddress, hashPassword, passwordInput, record, sameOrigin, text } from '@/lib/backend/security';
import { rateLimit } from '@/lib/backend/api-rate-limit';
import { assertAccountEmailConfigured, emailVerificationRequired, sendAccountEmail } from '@/lib/backend/account-email';

export const config = { api: { bodyParser: { sizeLimit: '16kb' } } };

export default async function signup(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    sameOrigin(req.headers);
    await rateLimit(`signup:ip:${req.socket.remoteAddress || 'unknown'}`, 5, 60 * 60_000);
    await rateLimit('signup:global', 100, 60 * 60_000);
    const body = record(req.body);
    const email = emailAddress(body.email);
    const name = text(body.name, 'Name', 2, 100);
    const city = body.city === undefined ? '' : text(body.city, 'City', 0, 100);
    const verificationRequired = emailVerificationRequired();
    if (verificationRequired) assertAccountEmailConfigured();
    const passwordHash = await hashPassword(passwordInput(body.password));
    const user = await prisma.user.create({
      data: {
        email, name, passwordHash, memberId: randomUUID(), isNew: true,
        city, state: '', country: '', lat: 0, lon: 0, industry: '',
      },
      select: { id: true, memberId: true, name: true, email: true },
    });
    if (verificationRequired) {
      try { await sendAccountEmail({ ...user, passwordHash }, 'verify'); }
      catch (error) {
        if (!(error instanceof ApiError)) throw error;
        return res.status(error.status).json({ error: 'Your account was created, but the verification email could not be delivered. Request another link on the Verify email page.', code: error.code });
      }
    }
    return res.status(201).json({ user: { memberId: user.memberId, name: user.name, email: user.email }, verificationRequired });
  } catch (error) {
    if (error instanceof ApiError) return res.status(error.status).json({ error: error.message, code: error.code });
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return res.status(409).json({ error: 'An account with this email already exists', code: 'EMAIL_IN_USE' });
    }
    console.error('Signup failed', error instanceof Error ? error.name : 'Unknown error');
    return res.status(500).json({ error: 'Could not create account', code: 'INTERNAL_SERVER_ERROR' });
  }
}
