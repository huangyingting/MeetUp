import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'Meetup Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'wlfjck@gmail.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase() || 'wlfjck@gmail.com';
        let user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          user = await prisma.user.findFirst({ where: { memberId: '484670701' } });
        }
        if (!user) return null;
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          memberId: user.memberId,
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.uid = user.id;
        token.memberId = (user as any).memberId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.uid;
        (session.user as any).memberId = token.memberId || '484670701';
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || 'meetup-clone-super-secret-nextauth-key-2026',
};

export default NextAuth(authOptions);
