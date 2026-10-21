import type { GetServerSideProps } from 'next';
import { prisma } from '@/lib/prisma';
import { getActiveUser } from '@/lib/auth-helper';
import { publicViewer } from '@/lib/presentation';

export const getEventServerSideProps = (async (ctx) => {
  const user = await getActiveUser(ctx.req, ctx.res);
  const result = await prisma.event.findFirst({
    where: { eventId: String(ctx.params?.eventId || ''), group: { urlname: String(ctx.params?.groupUrlname || ''), isDraft: false } },
    include: {
      group: { select: { id: true, name: true, urlname: true, isPrivate: true, organizerId: true } },
      host: { select: { name: true, image: true, memberId: true } },
      rsvps: { where: { status: 'YES' }, select: { userId: true, guestsCount: true, user: { select: { name: true, image: true, memberId: true } } } },
    },
  });
  if (!result) return { notFound: true };
  const membership = user ? await prisma.groupMembership.findUnique({ where: { userId_groupId: { userId: user.id, groupId: result.groupId } } }) : null;
  if (result.group.isPrivate && membership?.status !== 'ACTIVE' && result.group.organizerId !== user?.id) return { notFound: true };
  const going = result.rsvps.some(rsvp => rsvp.userId === user?.id);
  const saved = user ? await prisma.savedEvent.findUnique({ where: { userId_eventId: { userId: user.id, eventId: result.id } } }) : null;
  return { props: {
    user: publicViewer(user), going, saved: Boolean(saved),
    attendees: result.rsvps.map(rsvp => rsvp.user),
    showAttendees: ctx.resolvedUrl.split('?')[0].endsWith('/attendees'),
    event: {
      id: result.id, eventId: result.eventId, title: result.title, description: result.description, dateTime: result.dateTime.toISOString(), endTime: result.endTime.toISOString(),
      timezone: result.timezone, eventType: result.eventType, venueName: result.venueName, venueAddress: result.venueAddress, venueCity: result.venueCity,
      onlineUrl: going || result.hostId === user?.id ? result.onlineUrl : null, maxTickets: result.maxTickets,
      coverImage: result.coverImage, status: result.status, group: result.group, host: result.host,
      canManage: result.group.organizerId === user?.id,
      attendeeCount: result.rsvps.reduce((count, rsvp) => count + 1 + rsvp.guestsCount, 0),
    },
  } };
}) satisfies GetServerSideProps;
