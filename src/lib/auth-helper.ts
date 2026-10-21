import type { NextApiRequest, NextApiResponse, GetServerSidePropsContext } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export async function getActiveUser(
  req?: NextApiRequest | GetServerSidePropsContext['req'],
  res?: NextApiResponse | GetServerSidePropsContext['res']
) {
  res?.setHeader('Cache-Control', 'private, no-store, max-age=0');
  if (req && res) {
    const session = await getServerSession(req, res, authOptions);
    if (session?.user?.id) {
      return prisma.user.findUnique({
        where: { id: session.user.id },
        omit: { passwordHash: true },
        include: {
          topics: { include: { topic: true } },
          memberships: { include: { group: true } },
        },
      });
    }
  }
  return null;
}
