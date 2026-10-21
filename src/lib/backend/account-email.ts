import { createHash, randomBytes } from 'node:crypto';
import nodemailer from 'nodemailer';
import { prisma } from '@/lib/prisma';
import { ApiError, hashPassword, passwordInput } from './security';

export type AccountPurpose = 'verify' | 'reset';
const loopback = new Set(['localhost', '127.0.0.1', '[::1]']);

export function applicationOrigin(): string {
  const configured = process.env.NEXTAUTH_URL || (process.env.NODE_ENV !== 'production' ? 'http://localhost:3000' : '');
  try {
    const url = new URL(configured);
    if (url.username || url.password || (!loopback.has(url.hostname) && url.protocol !== 'https:') || !['http:', 'https:'].includes(url.protocol)) throw new Error('Invalid origin');
    return url.origin;
  } catch {
    throw new ApiError(503, 'Configure NEXTAUTH_URL with the HTTPS application origin', 'SERVICE_UNAVAILABLE');
  }
}

export function emailVerificationRequired(): boolean {
  return !loopback.has(new URL(applicationOrigin()).hostname) || Boolean(process.env.EMAIL_SERVER || process.env.EMAIL_FROM);
}

function mailConfiguration() {
  try {
    const server = new URL(process.env.EMAIL_SERVER || '');
    const from = process.env.EMAIL_FROM || '';
    if (!['smtp:', 'smtps:'].includes(server.protocol) || !from.includes('@') || /[\r\n]/.test(from)) throw new Error('Invalid mail configuration');
    return {
      from,
      options: {
        host: server.hostname,
        port: Number(server.port || (server.protocol === 'smtps:' ? 465 : 587)),
        secure: server.protocol === 'smtps:',
        requireTLS: !loopback.has(server.hostname) && server.protocol !== 'smtps:',
        ...(server.username ? { auth: { user: decodeURIComponent(server.username), pass: decodeURIComponent(server.password) } } : {}),
        connectionTimeout: 10_000, greetingTimeout: 10_000, socketTimeout: 20_000,
      },
    };
  } catch {
    throw new ApiError(503, 'Account email delivery is not configured. Contact the site operator.', 'SERVICE_UNAVAILABLE');
  }
}

export function assertAccountEmailConfigured(): void {
  applicationOrigin();
  mailConfiguration();
}

export function accountTokenDigest(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function sendAccountEmail(user: { id: string; email: string; passwordHash: string | null }, purpose: AccountPurpose): Promise<void> {
  const { from, options } = mailConfiguration();
  const token = randomBytes(32).toString('hex');
  const identifier = `${purpose}:${user.id}:${user.passwordHash?.split('$')[4] || ''}`;
  const digest = accountTokenDigest(token);
  await prisma.verificationToken.create({
    data: { identifier, token: digest, expires: new Date(Date.now() + (purpose === 'verify' ? 24 * 60 * 60_000 : 30 * 60_000)) },
  });
  const link = `${applicationOrigin()}/${purpose === 'verify' ? 'verify-email' : 'reset-password'}#token=${token}`;
  const transport = nodemailer.createTransport(options);
  try {
    const result = await transport.sendMail({
      from, to: { address: user.email, name: '' },
      subject: purpose === 'verify' ? 'Verify your Meetup email address' : 'Reset your Meetup password',
      text: `${purpose === 'verify' ? 'Confirm your email address to finish creating your account.' : 'A password reset was requested for your account.'}\n\n${link}\n\nThis single-use link expires in ${purpose === 'verify' ? '24 hours' : '30 minutes'}. If you did not request this, ignore this email.`,
      disableFileAccess: true, disableUrlAccess: true,
    });
    if (result.rejected.length || result.accepted.length !== 1) throw new Error('Recipient not accepted');
  } catch (error) {
    await prisma.verificationToken.deleteMany({ where: { token: digest } });
    console.error('Account email delivery failed', error instanceof Error ? error.name : 'Unknown error');
    throw new ApiError(503, 'The email could not be delivered. Please request another link shortly.', 'SERVICE_UNAVAILABLE');
  } finally {
    transport.close();
  }
}

export async function consumeAccountToken(token: string, purpose: AccountPurpose, newPassword?: string): Promise<void> {
  if (!/^[a-f0-9]{64}$/.test(token)) throw new ApiError(400, 'This link is invalid or has expired. Request a new one.');
  const digest = accountTokenDigest(token);
  const passwordHash = purpose === 'reset' ? await hashPassword(passwordInput(newPassword)) : undefined;
  await prisma.$transaction(async tx => {
    const entry = await tx.verificationToken.findUnique({ where: { token: digest } });
    const [tokenPurpose, userId, version] = entry?.identifier.split(':') || [];
    if (!entry || entry.expires <= new Date() || tokenPurpose !== purpose) throw new ApiError(400, 'This link is invalid or has expired. Request a new one.');
    const user = await tx.user.findUnique({ where: { id: userId }, select: { id: true, passwordHash: true } });
    if (!user || user.passwordHash?.split('$')[4] !== version) throw new ApiError(400, 'This link is invalid or has expired. Request a new one.');
    const consumed = await tx.verificationToken.deleteMany({ where: { token: digest, expires: { gt: new Date() } } });
    if (consumed.count !== 1) throw new ApiError(400, 'This link has already been used.');
    await tx.user.update({ where: { id: user.id }, data: { emailVerified: new Date(), ...(passwordHash ? { passwordHash } : {}) } });
    await tx.verificationToken.deleteMany({ where: { identifier: entry.identifier } });
  }, { isolationLevel: 'Serializable' });
}
