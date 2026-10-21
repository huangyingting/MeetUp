import type { GetServerSideProps } from 'next';
import { prisma } from '@/lib/prisma';
import { getActiveUser } from '@/lib/auth-helper';
import { publicViewer } from '@/lib/presentation';

export const getCommunityServerSideProps = (async (ctx) => {
  const user = await getActiveUser(ctx.req, ctx.res);
  const urlname = String(ctx.params?.groupUrlname || '');
  const group = await prisma.group.findUnique({
    where: { urlname },
    include: {
      organizer: { select: { id: true, name: true, memberId: true, image: true } },
      topics: { include: { topic: { select: { name: true, urlkey: true } } } },
    },
  });
  if (!group || (group.isDraft && group.organizerId !== user?.id)) return { notFound: true };
  if (ctx.params?.albumId) {
    const album = await prisma.photoAlbum.findFirst({ where: { albumId: String(ctx.params.albumId), groupId: group.id }, select: { id: true } });
    if (!album) return { notFound: true };
  }
  const membership = user ? await prisma.groupMembership.findUnique({ where: { userId_groupId: { userId: user.id, groupId: group.id } } }) : null;
  const isMember = membership?.status === 'ACTIVE';
  const canView = !group.isPrivate || isMember || group.organizerId === user?.id;
  const activeTab = ctx.resolvedUrl.split('?')[0].slice(urlname.length + 1).replace(/\/$/, '');
  const past = activeTab === '/events/past';
  const memberCount = await prisma.groupMembership.count({ where: { groupId: group.id, status: 'ACTIVE' } });
  const [events, members, pendingMembers, discussions, photos, reviews] = await Promise.all([
    canView ? prisma.event.findMany({ where: { groupId: group.id, status: past ? { in: ['UPCOMING', 'PAST'] } : 'UPCOMING', dateTime: past ? { lt: new Date() } : { gte: new Date() } }, include: { rsvps: { where: { status: 'YES' }, select: { guestsCount: true } } }, orderBy: { dateTime: past ? 'desc' : 'asc' }, take: 100 }) : [],
    canView ? prisma.groupMembership.findMany({ where: { groupId: group.id, status: 'ACTIVE' }, select: { role: true, user: { select: { name: true, memberId: true, image: true } } }, take: 100 }) : [],
    group.organizerId === user?.id ? prisma.groupMembership.findMany({ where: { groupId: group.id, status: 'PENDING' }, select: { id: true, user: { select: { name: true, image: true } } }, take: 100 }) : [],
    canView ? prisma.discussion.findMany({ where: { groupId: group.id }, include: { author: { select: { name: true, image: true } } }, orderBy: { createdAt: 'desc' }, take: 50 }) : [],
    canView ? prisma.photo.findMany({ where: { album: { groupId: group.id, ...(ctx.params?.albumId ? { albumId: String(ctx.params.albumId) } : {}) } }, select: { id: true, url: true, caption: true }, take: 100 }) : [],
    canView ? prisma.groupReview.findMany({ where: { groupId: group.id }, select: { id: true, comment: true, rating: true, author: { select: { name: true } } }, take: 50 }) : [],
  ]);
  return { props: {
    user: publicViewer(user),
    group: { id: group.id, groupId: group.groupId, name: group.name, urlname: group.urlname, description: canView ? group.description : '', city: group.city, state: group.state, isPrivate: group.isPrivate, isDraft: group.isDraft, coverImage: group.coverImage, organizerId: group.organizerId, organizer: group.organizer, topics: group.topics.map(item => item.topic), rating: group.rating, ratingsCount: group.ratingsCount, memberCount },
    events: events.map(event => ({ id: event.id, eventId: event.eventId, title: event.title, dateTime: event.dateTime.toISOString(), timezone: event.timezone, eventType: event.eventType, venueName: event.venueName, attendees: event.rsvps.reduce((count, rsvp) => count + 1 + rsvp.guestsCount, 0) })),
    members: members.map(member => ({ ...member.user, role: member.role })),
    discussions: discussions.map(discussion => ({ id: discussion.id, title: discussion.title, body: discussion.body, author: discussion.author, createdAt: discussion.createdAt.toISOString() })),
    photos, reviews, pendingMembers, membershipStatus: membership?.status || null, isMember, canView, activeTab,
  } };
}) satisfies GetServerSideProps;
