import NextAuth, { type NextAuthOptions } from 'next-auth';
import type { NextApiRequest, NextApiResponse } from 'next';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import { emailAddress, sameOrigin, verifyPassword, ApiError } from '@/lib/backend/security';
import { rateLimit } from '@/lib/backend/api-rate-limit';
import { emailVerificationRequired } from '@/lib/backend/account-email';

function secret(): string | undefined {
  const value = process.env.NEXTAUTH_SECRET;
  if (process.env.NODE_ENV === 'production' && (!value || value.length < 32 || /meetup-clone|super-secret|changeme|example/i.test(value))) {
    throw new Error('Set a unique NEXTAUTH_SECRET of at least 32 characters in production');
  }
  return value;
}

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt', maxAge: 60 * 60 * 24 * 7 },
  pages: { signIn: '/login' },
  providers: [
    CredentialsProvider({
      name: 'Meetup Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // Do not trust proxy-controlled forwarding headers as a client identity.
        await rateLimit('signin:global', 300, 60_000);
        let email: string;
        try { email = emailAddress(credentials?.email); } catch { return null; }
        await rateLimit(`signin:email:${email}`, 10, 15 * 60_000);
        const password = credentials?.password;
        if (typeof password !== 'string' || password.length > 128) return null;
        const user = await prisma.user.findUnique({ where: { email }, omit: { passwordHash: false } });
        if (!await verifyPassword(password, user?.passwordHash) || !user) return null;
        if (emailVerificationRequired() && !user.emailVerified) return null;
        return { id: user.id, name: user.name, email: user.email, image: user.image, memberId: user.memberId, authVersion: user.passwordHash?.split('$')[4] };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) { token.uid = user.id; token.memberId = user.memberId; token.authVersion = user.authVersion; }
      else if (token.uid) {
        const current = await prisma.user.findUnique({ where: { id: token.uid }, select: { passwordHash: true, emailVerified: true } });
        if (!token.authVersion || token.authVersion !== current?.passwordHash?.split('$')[4] || (emailVerificationRequired() && !current?.emailVerified)) {
          token.uid = undefined;
          token.memberId = undefined;
          token.authVersion = undefined;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = typeof token.uid === 'string' ? token.uid : '';
        session.user.memberId = typeof token.memberId === 'string' ? token.memberId : '';
      }
      return session;
    },
  },
  secret: secret(),
};

const handler = NextAuth(authOptions);
export default async function authHandler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  try {
    if (req.method === 'POST') sameOrigin(req.headers);
    return await handler(req, res);
  } catch (error) {
    if (error instanceof ApiError) return res.status(error.status).json({ error: error.message, code: error.code });
    console.error('Authentication request failed', error instanceof Error ? error.name : 'Unknown error');
    return res.status(500).json({ error: 'Authentication request failed' });
  }
}
