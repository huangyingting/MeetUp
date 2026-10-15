import type { GetServerSideProps } from 'next';
import { FindExperience } from './index';
import { prisma } from '@/lib/prisma';
import { getActiveUser } from '@/lib/auth-helper';

export default function FindSlugPage(props: any) {
  return <FindExperience {...props} />;
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const user = await getActiveUser(ctx.req, ctx.res);
  const slugArr = (ctx.params?.slug as string[]) || [];
  const firstSegment = slugArr[0] || '';

  const events = await prisma.event.findMany({
    where: { status: 'UPCOMING' },
    include: {
      group: { include: { topics: { include: { topic: { include: { category: true } } } } } },
      rsvps: true,
    },
    orderBy: { dateTime: 'asc' },
  });

  const groups = await prisma.group.findMany({
    where: { isDraft: false },
    include: { topics: { include: { topic: { include: { category: true } } } } },
    orderBy: { membersCount: 'desc' },
  });

  const categories = await prisma.topicCategory.findMany({
    orderBy: { name: 'asc' },
  });

  const saved = user
    ? await prisma.savedEvent.findMany({ where: { userId: user.id } })
    : [];

  const isOnlineRoute = firstSegment === 'online-events';
  const locationLabel = firstSegment.startsWith('us--')
    ? firstSegment
        .replace('us--', '')
        .split('--')
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .reverse()
        .join(', ')
    : (ctx.query.location as string) || 'San Francisco, CA';

  return {
    props: {
      user: JSON.parse(JSON.stringify(user)),
      events: JSON.parse(JSON.stringify(events)),
      groups: JSON.parse(JSON.stringify(groups)),
      categories: JSON.parse(JSON.stringify(categories)),
      initialSource: ctx.query.source === 'GROUPS' ? 'GROUPS' : 'EVENTS',
      initialKeywords: (ctx.query.keywords as string) || '',
      initialLocation: locationLabel,
      initialType: isOnlineRoute ? 'ONLINE' : 'ALL',
      initialCategory: (ctx.query.category as string) || 'all',
      initialDistance: (ctx.query.distance as string) || '25 miles',
      initialSavedIds: saved.map((s) => s.eventId),
    },
  };
};
