import type { GetServerSideProps } from 'next';
import { getActiveUser } from '@/lib/auth-helper';
import { prisma } from '@/lib/prisma';

export default function MembershipDetails() { return null; }

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const viewer = await getActiveUser(ctx.req, ctx.res);
  const memberId = String(ctx.params?.memberId || '');
  const groupId = String(ctx.params?.groupId || '');
  const membership = await prisma.groupMembership.findFirst({ where: { user: { memberId }, group: { groupId, isDraft: false }, status: 'ACTIVE' }, include: { group: { select: { id: true, urlname: true, isPrivate: true } } } });
  if (!membership) return { notFound: true };
  if (membership.group.isPrivate) {
    const access = viewer ? await prisma.groupMembership.findUnique({ where: { userId_groupId: { userId: viewer.id, groupId: membership.group.id } } }) : null;
    if (access?.status !== 'ACTIVE') return { notFound: true };
  }
  return { redirect: { destination: `/${membership.group.urlname}/members`, permanent: false } };
};
