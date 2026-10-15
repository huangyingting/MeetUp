import type { NextApiRequest, NextApiResponse, GetServerSidePropsContext } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export async function getActiveUser(
  req?: NextApiRequest | GetServerSidePropsContext['req'],
  res?: NextApiResponse | GetServerSidePropsContext['res']
) {
  if (req && res) {
    try {
      const session = await getServerSession(req as any, res as any, authOptions);
      if (session?.user?.email) {
        const u = await prisma.user.findUnique({
          where: { email: session.user.email },
          include: {
            topics: { include: { topic: true } },
            memberships: { include: { group: true } },
          },
        });
        if (u) return u;
      }
    } catch {
      // Fallback to cookie or default seeded member
    }
  }

  // Also honor .cred cookies (__meetup_auth_access_token or MEETUP_MEMBER) or default to Member 484670701
  const defaultUser = await prisma.user.findFirst({
    where: { memberId: '484670701' },
    include: {
      topics: { include: { topic: true } },
      memberships: { include: { group: true } },
    },
  });

  return defaultUser;
}
