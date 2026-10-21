import type { GetServerSideProps } from 'next';
import { prisma } from '@/lib/prisma';
import { getActiveUser } from '@/lib/auth-helper';

export const getAccountServerSideProps = (async (ctx) => {
  const current = await getActiveUser(ctx.req, ctx.res);
  if (!current) return { redirect: { destination: `/login?callbackUrl=${encodeURIComponent(ctx.resolvedUrl)}`, permanent: false } };
  const section = ctx.resolvedUrl.split('?')[0].endsWith('/privacy') ? 'privacy' : ctx.resolvedUrl.split('?')[0].endsWith('/interests') ? 'interests' : ctx.resolvedUrl.split('?')[0].endsWith('/management') ? 'security' : 'profile';
  const [topics, followed] = await Promise.all([
    prisma.topic.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    prisma.userTopic.findMany({ where: { userId: current.id }, select: { topicId: true } }),
  ]);
  return { props: { section, topics, followedIds: followed.map(topic => topic.topicId), user: { id: current.id, memberId: current.memberId, name: current.name, image: current.image, email: current.email, emailVerified: Boolean(current.emailVerified), city: current.city, state: current.state, country: current.country, bio: current.bio, showGroups: current.showGroups, showInterests: current.showInterests, whoCanContact: current.whoCanContact } } };
}) satisfies GetServerSideProps;
