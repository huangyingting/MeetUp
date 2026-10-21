import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { ApiError, emailAddress, passwordInput, record, sameOrigin, text } from '@/lib/backend/security';
import { rateLimit } from '@/lib/backend/api-rate-limit';
import { assertAccountEmailConfigured, consumeAccountToken, sendAccountEmail } from '@/lib/backend/account-email';

export const config = { api: { bodyParser: { sizeLimit: '16kb' } } };

export default async function accountAction(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    sameOrigin(req.headers);
    await rateLimit(`account-action:ip:${req.socket.remoteAddress || 'unknown'}`, 20, 60 * 60_000);
    await rateLimit('account-action:global', 200, 60 * 60_000);
    const body = record(req.body);
    if (body.action === 'request-reset' || body.action === 'request-verification') {
      assertAccountEmailConfigured();
      const email = emailAddress(body.email);
      await rateLimit(`account-action:${body.action}:${email}`, 3, 60 * 60_000);
      const user = await prisma.user.findUnique({ where: { email }, select: { id: true, email: true, emailVerified: true, passwordHash: true } });
      if (user && (body.action === 'request-reset' || !user.emailVerified)) {
        await sendAccountEmail(user, body.action === 'request-reset' ? 'reset' : 'verify');
      }
      return res.status(202).json({ message: 'If this account needs a link, an email has been sent. Check your inbox and spam folder.' });
    }
    if (body.action === 'verify-email' || body.action === 'reset-password') {
      const token = text(body.token, 'Link token', 64, 64);
      const password = body.action === 'reset-password' ? passwordInput(body.password) : undefined;
      await consumeAccountToken(token, body.action === 'verify-email' ? 'verify' : 'reset', password);
      return res.status(200).json({ message: body.action === 'verify-email' ? 'Email verified. You can now log in.' : 'Password reset. Log in with your new password.' });
    }
    throw new ApiError(400, 'Unknown account action');
  } catch (error) {
    if (error instanceof ApiError) return res.status(error.status).json({ error: error.message, code: error.code });
    console.error('Account action failed', error instanceof Error ? error.name : 'Unknown error');
    return res.status(500).json({ error: 'The account request could not be completed. Please try again.' });
  }
}
