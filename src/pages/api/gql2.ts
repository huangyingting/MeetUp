import type { NextApiRequest, NextApiResponse } from 'next';
import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getActiveUser } from '@/lib/auth-helper';
import { ApiError, hashPassword, integer, passwordInput, record, sameOrigin, text, verifyPassword, webUrl } from '@/lib/backend/security';
import { rateLimit } from '@/lib/backend/api-rate-limit';

type ActiveUser = NonNullable<Awaited<ReturnType<typeof getActiveUser>>>;
type Db = Prisma.TransactionClient | typeof prisma;
const profile = { id: true, memberId: true, name: true, image: true, city: true, state: true, bio: true } satisfies Prisma.UserSelect;
const privateProfile = {
  ...profile, email: true, country: true, lat: true, lon: true, isNew: true,
  isMeetupPlus: true, meetupPlusPlan: true, organizerPlan: true, showGroups: true,
  showInterests: true, relationshipStatusPublic: true, whoCanContact: true,
  sendFewerEmails: true, turnOffAllEmails: true, theme: true, language: true, timezone: true,
} satisfies Prisma.UserSelect;
const publicReads = new Set(['findTopics', 'getRecommendedNewTopics', 'getLocationSearch']);
const unsupported = new Set([
  'donateToGroup', 'subscribeMeetupPlus', 'addPaymentMethod', 'deletePaymentMethod',
  'createOAuthApp', 'deleteOAuthApp', 'generateAiGroupDescription', 'generateGroupDescriptionAI',
  'subscribeOrganizer', 'checkout', 'createPayment', 'likeDiscussion',
]);

async function atomic<T>(fn: (tx: Db) => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try { return await prisma.$transaction(fn, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }); }
    catch (error) {
      if (attempt < 3 && error instanceof Prisma.PrismaClientKnownRequestError && ['P2034', 'P1008'].includes(error.code)) continue;
      throw error;
    }
  }
}

async function groupById(tx: Db, value: unknown) {
  const id = text(value, 'Group ID');
  const group = await tx.group.findFirst({ where: { OR: [{ id }, { groupId: id }, { urlname: id }] } });
  if (!group) throw new ApiError(404, 'Group not found', 'NOT_FOUND');
  return group;
}

async function membership(tx: Db, userId: string, groupId: string) {
  const member = await tx.groupMembership.findUnique({ where: { userId_groupId: { userId, groupId } } });
  if (!member || member.status !== 'ACTIVE') throw new ApiError(403, 'Active group membership required', 'FORBIDDEN');
  return member;
}

async function syncMemberCount(tx: Db, groupId: string) {
  const count = await tx.groupMembership.count({ where: { groupId, status: 'ACTIVE' } });
  return tx.group.update({ where: { id: groupId }, data: { membersCount: count } });
}

function groupLink(urlname: string): string {
  return `/${encodeURIComponent(urlname)}`;
}

function eventLink(urlname: string, eventId: string): string {
  return `${groupLink(urlname)}/events/${encodeURIComponent(eventId)}`;
}

async function notify(tx: Db, userIds: string[], title: string, body: string, link: string) {
  const recipients = [...new Set(userIds)];
  for (let offset = 0; offset < recipients.length; offset += 500) {
    await tx.notification.createMany({
      data: recipients.slice(offset, offset + 500).map(userId => ({ userId, title, body, link, isRead: false })),
    });
  }
}

async function notifyGroup(tx: Db, groupId: string, title: string, body: string, link: string) {
  const members = await tx.groupMembership.findMany({ where: { groupId, status: 'ACTIVE' }, select: { userId: true } });
  await notify(tx, members.map(member => member.userId), title, body, link);
}

function bool(value: unknown, field: string): boolean {
  if (typeof value !== 'boolean') throw new ApiError(400, `${field} must be a boolean`);
  return value;
}

function date(value: unknown, field: string): Date {
  const iso = text(value, field, 20, 40);
  const parsed = new Date(iso);
  if (!/^\d{4}-\d\d-\d\dT.*(?:Z|[+-]\d\d:\d\d)$/.test(iso) || !Number.isFinite(parsed.getTime())) {
    throw new ApiError(400, `${field} must be an ISO timestamp including timezone`);
  }
  return parsed;
}

function jsonConfig(value: unknown, field: string): string {
  let parsed: unknown = value;
  if (typeof value === 'string') {
    try { parsed = JSON.parse(value); } catch { throw new ApiError(400, `${field} must be valid JSON`); }
  }
  record(parsed);
  const encoded = JSON.stringify(parsed);
  if (encoded.length > 5000) throw new ApiError(400, `${field} is too large`);
  return encoded;
}

export async function executeOperation(operation: unknown, activeUser: ActiveUser | null) {
  const op = record(operation);
  const name = text(op.operationName, 'Operation name', 1, 100);
  const vars = op.variables === undefined ? {} : record(op.variables);
  const input = vars.input === undefined ? vars : record(vars.input);
  if (!publicReads.has(name) && !activeUser) throw new ApiError(401, 'Sign in to continue', 'UNAUTHENTICATED');
  if (unsupported.has(name)) throw new ApiError(503, name === 'likeDiscussion' ? 'Discussion likes are not available' : 'This feature is not configured', 'SERVICE_UNAVAILABLE');

  if (name === 'findTopics' || name === 'getRecommendedNewTopics') {
    const query = vars.query ?? input.query ?? '';
    const q = text(query, 'Query', 0, 100);
    const topics = await prisma.topic.findMany({
      where: q ? { OR: [{ name: { contains: q } }, { description: { contains: q } }] } : {},
      include: { category: true }, orderBy: { followersCount: 'desc' }, take: 100,
    });
    return { data: { topics } };
  }
  if (name === 'getLocationSearch') {
    const q = text(vars.query ?? input.query ?? '', 'Query', 0, 100);
    const groups = await prisma.group.findMany({
      where: { isDraft: false, city: { contains: q } },
      select: { city: true, state: true, country: true, lat: true, lon: true },
      distinct: ['city', 'state', 'country'], take: 20,
    });
    return { data: { locations: groups.map(g => ({ ...g, display: [g.city, g.state, g.country].filter(Boolean).join(', '), slug: [g.country, g.state, g.city].filter(Boolean).join('--').toLowerCase().replace(/\s+/g, '-') })) } };
  }
  if (!activeUser) throw new ApiError(401, 'Sign in to continue', 'UNAUTHENTICATED');
  const user = activeUser;

  switch (name) {
    case 'getSelf':
    case 'getForceOnboardingSelfData': {
      const [draft, unreadNotifications, unreadMessages] = await Promise.all([
        prisma.group.findFirst({ where: { organizerId: user.id, isDraft: true } }),
        prisma.notification.count({ where: { userId: user.id, isRead: false } }),
        prisma.message.count({ where: { receiverId: user.id, isRead: false } }),
      ]);
      return { data: { self: {
        __typename: 'Member', id: user.memberId, dbId: user.id, name: user.name,
        email: user.email, bio: user.bio, city: user.city, state: user.state, country: user.country,
        lat: user.lat, lon: user.lon, image: user.image, isNew: user.isNew,
        isMeetupPlus: user.isMeetupPlus, meetupPlusPlan: user.meetupPlusPlan, organizerPlan: user.organizerPlan,
        onboardingCompletedAt: user.onboardingCompletedAt, groupDraftCompletedAt: user.groupDraftCompletedAt,
        hasGroupDraft: Boolean(draft), draftGroup: draft, unreadNotifications, unreadMessages,
      } } };
    }
    case 'getMemberActionLastOccurrence': {
      const action = input.action;
      if (!['onboarding_completed', 'group_draft_completed'].includes(String(action))) throw new ApiError(400, 'Unknown member action');
      const ts = action === 'onboarding_completed' ? user.onboardingCompletedAt : user.groupDraftCompletedAt;
      return { data: { self: { id: user.memberId, memberActionLastOccurrence: ts?.toISOString() ?? null } } };
    }
    case 'recordMemberAction': {
      const action = input.action;
      if (!['onboarding_completed', 'group_draft_completed'].includes(String(action))) throw new ApiError(400, 'Unknown member action');
      const now = new Date();
      const updated = await prisma.user.update({
        where: { id: user.id },
        data: action === 'onboarding_completed' ? { isNew: false, onboardingCompletedAt: now } : { groupDraftCompletedAt: now },
        select: privateProfile,
      });
      return { data: { recordMemberAction: { memberAction: { action, lastOccurrenceTime: now.toISOString() }, self: updated } } };
    }
    case 'changePassword': {
      await rateLimit(`password:${user.id}`, 5, 15 * 60_000);
      const currentPassword = input.currentPassword;
      if (typeof currentPassword !== 'string' || currentPassword.length < 1 || currentPassword.length > 128) throw new ApiError(400, 'Current password is required');
      const newPassword = passwordInput(input.newPassword);
      const stored = await prisma.user.findUnique({ where: { id: user.id }, select: { passwordHash: true } });
      if (!await verifyPassword(currentPassword, stored?.passwordHash)) throw new ApiError(400, 'Current password is incorrect');
      const passwordHash = await hashPassword(newPassword);
      const changed = await prisma.user.updateMany({ where: { id: user.id, passwordHash: stored?.passwordHash }, data: { passwordHash } });
      if (changed.count !== 1) throw new ApiError(409, 'Password changed concurrently; sign in again', 'CONFLICT');
      return { data: { changePassword: { success: true } } };
    }
    case 'updateMemberData':
    case 'updateAccountSettings': {
      for (const field of ['email', 'isMeetupPlus', 'meetupPlusPlan', 'organizerPlan', 'passwordHash', 'memberId', 'id']) {
        if (field in input) throw new ApiError(400, `${field} cannot be changed with this operation`);
      }
      const data: Prisma.UserUpdateInput = {};
      const strings = ['name', 'bio', 'city', 'state', 'country', 'birthDate', 'gender', 'phone', 'whatsappPhone', 'relationshipStatus', 'industry', 'whoCanContact', 'theme', 'language', 'timezone'] as const;
      for (const field of strings) {
        if (input[field] !== undefined) data[field] = text(input[field], field, field === 'name' ? 2 : 0, field === 'bio' ? 5000 : 200);
      }
      if (input.whoCanContact !== undefined && !['ANYONE', 'SHARED_GROUPS', 'ORGANIZERS_ONLY', 'NOBODY'].includes(String(input.whoCanContact))) throw new ApiError(400, 'Invalid contact preference');
      if (input.theme !== undefined && !['light', 'dark', 'system'].includes(String(input.theme))) throw new ApiError(400, 'Invalid theme');
      if (input.timezone !== undefined) {
        try { new Intl.DateTimeFormat('en', { timeZone: String(input.timezone) }); } catch { throw new ApiError(400, 'Invalid timezone'); }
      }
      const booleans = ['showGroups', 'showInterests', 'relationshipStatusPublic', 'sendFewerEmails', 'turnOffAllEmails'] as const;
      for (const field of booleans) if (input[field] !== undefined) data[field] = bool(input[field], field);
      for (const field of ['lookingFor', 'peopleToMeet', 'hangoutStyles', 'lifeStages'] as const) {
        if (input[field] !== undefined) {
          const items = input[field];
          if (!Array.isArray(items) || items.length > 30) throw new ApiError(400, `${field} must be a list of at most 30 items`);
          data[field] = JSON.stringify(items.map(item => text(item, field, 1, 100)));
        }
      }
      for (const field of ['emailUpdatesConfig', 'socialLinks'] as const) if (input[field] !== undefined) data[field] = jsonConfig(input[field], field);
      if (!Object.keys(data).length) throw new ApiError(400, 'No supported fields provided');
      const member = await prisma.user.update({ where: { id: user.id }, data, select: privateProfile });
      return { data: { updateMemberData: { member }, ...(name === 'updateAccountSettings' ? { updateAccountSettings: { member } } : {}) } };
    }
    case 'followTopics': {
      const ids = input.topicIds;
      if (!Array.isArray(ids) || ids.length > 50) throw new ApiError(400, 'topicIds must be a list of at most 50 topics');
      await atomic(async tx => {
        for (const value of ids) {
          const id = text(value, 'Topic ID');
          const topic = await tx.topic.findFirst({ where: { OR: [{ id }, { topicId: id }, { urlkey: id }] } });
          if (!topic) throw new ApiError(404, 'Topic not found', 'NOT_FOUND');
          await tx.userTopic.upsert({ where: { userId_topicId: { userId: user.id, topicId: topic.id } }, update: {}, create: { userId: user.id, topicId: topic.id } });
        }
      });
      const topics = await prisma.userTopic.findMany({ where: { userId: user.id }, include: { topic: true } });
      return { data: { followTopics: { topics: topics.map(t => t.topic) } } };
    }
    case 'unfollowTopic': {
      const id = text(input.topicId, 'Topic ID');
      const topic = await prisma.topic.findFirst({ where: { OR: [{ id }, { topicId: id }, { urlkey: id }] } });
      if (!topic) throw new ApiError(404, 'Topic not found', 'NOT_FOUND');
      await prisma.userTopic.deleteMany({ where: { userId: user.id, topicId: topic.id } });
      return { data: { unfollowTopic: { success: true } } };
    }
    case 'saveEvent':
    case 'unsaveEvent': {
      const id = text(input.eventId, 'Event ID');
      const ev = await prisma.event.findFirst({ where: { OR: [{ id }, { eventId: id }] }, include: { group: true } });
      if (!ev || ev.group.isDraft) throw new ApiError(404, 'Event not found', 'NOT_FOUND');
      if (ev.group.isPrivate) await membership(prisma, user.id, ev.groupId);
      if (name === 'saveEvent') await prisma.savedEvent.upsert({ where: { userId_eventId: { userId: user.id, eventId: ev.id } }, update: {}, create: { userId: user.id, eventId: ev.id } });
      else await prisma.savedEvent.deleteMany({ where: { userId: user.id, eventId: ev.id } });
      return { data: { [name]: { saved: name === 'saveEvent', eventId: ev.eventId } } };
    }
    case 'rsvpEvent':
    case 'rsvpToEvent': {
      const id = text(input.eventId, 'Event ID');
      const status = input.response ?? input.status ?? 'YES';
      if (!['YES', 'NO'].includes(String(status))) throw new ApiError(400, 'RSVP status must be YES or NO');
      const guests = integer(input.guestsCount ?? 0, 'Guests', 0, 100);
      const share = bool(input.optToShareEmail ?? input.sharedEmail ?? false, 'Share email');
      const result = await atomic(async tx => {
        const event = await tx.event.findFirst({ where: { OR: [{ id }, { eventId: id }] }, include: { group: true } });
        if (!event || event.group.isDraft) throw new ApiError(404, 'Event not found', 'NOT_FOUND');
        const previous = await tx.eventRsvp.findUnique({ where: { userId_eventId: { userId: user.id, eventId: event.id } } });
        const member = await tx.groupMembership.findUnique({ where: { userId_groupId: { userId: user.id, groupId: event.groupId } } });
        if (event.group.isPrivate && member?.status !== 'ACTIVE') throw new ApiError(403, 'Active group membership required', 'FORBIDDEN');
        if (member && !['ACTIVE', 'LEFT'].includes(member.status)) throw new ApiError(403, 'Group membership is restricted', 'FORBIDDEN');
        if (status === 'YES') {
          if (!['UPCOMING', 'ACTIVE'].includes(event.status) || event.dateTime.getTime() <= Date.now()) throw new ApiError(409, 'This event is not accepting RSVPs', 'CONFLICT');
          if (event.feeAmount !== 0) throw new ApiError(503, 'Paid event registration is not available', 'SERVICE_UNAVAILABLE');
          if ((!event.allowGuests && guests > 0) || guests > event.maxGuests) throw new ApiError(400, 'Guest count exceeds the event guest limit');
          const occupied = await tx.eventRsvp.aggregate({ where: { eventId: event.id, status: 'YES', userId: { not: user.id } }, _count: { _all: true }, _sum: { guestsCount: true } });
          if (occupied._count._all + (occupied._sum.guestsCount ?? 0) + 1 + guests > event.maxTickets) throw new ApiError(409, 'This event does not have enough available places', 'EVENT_FULL');
          await tx.groupMembership.upsert({
            where: { userId_groupId: { userId: user.id, groupId: event.groupId } },
            update: { status: 'ACTIVE' }, create: { userId: user.id, groupId: event.groupId, role: event.group.organizerId === user.id ? 'ORGANIZER' : 'MEMBER' },
          });
          await syncMemberCount(tx, event.groupId);
        }
        const data = { status: String(status), guestsCount: status === 'YES' ? guests : 0, optToShareEmail: share };
        const rsvp = await tx.eventRsvp.upsert({ where: { userId_eventId: { userId: user.id, eventId: event.id } }, update: data, create: { userId: user.id, eventId: event.id, ...data } });
        const changed = status === 'YES'
          ? previous?.status !== 'YES' || previous.guestsCount !== guests
          : previous?.status === 'YES';
        if (changed) {
          const link = eventLink(event.group.urlname, event.eventId);
          await notify(tx, [user.id], status === 'YES' ? 'RSVP confirmed' : 'RSVP cancelled',
            status === 'YES' ? `You are attending ${event.title}${guests ? ` with ${guests} guest(s)` : ''}.` : `Your RSVP for ${event.title} has been cancelled.`, link);
          if (event.group.organizerId !== user.id) {
            await notify(tx, [event.group.organizerId], 'Event RSVP updated',
              `${user.name} ${status === 'YES' ? 'is attending' : 'cancelled their RSVP for'} ${event.title}.`, link);
          }
        }
        return { rsvp, event };
      });
      return { data: { [name]: result } };
    }
    case 'joinGroup':
    case 'leaveGroup': {
      const result = await atomic(async tx => {
        const group = await groupById(tx, input.groupId ?? input.urlname);
        if (group.isDraft) throw new ApiError(404, 'Group not found', 'NOT_FOUND');
        if (name === 'leaveGroup') {
          if (group.organizerId === user.id) throw new ApiError(409, 'Organizers cannot leave their group', 'CONFLICT');
          await tx.groupMembership.deleteMany({ where: { userId: user.id, groupId: group.id, status: { in: ['ACTIVE', 'PENDING', 'LEFT'] } } });
          const cancelled = await tx.eventRsvp.findMany({
            where: { userId: user.id, status: 'YES', event: { groupId: group.id, dateTime: { gt: new Date() } } },
            select: { event: { select: { title: true, eventId: true } } },
          });
          await tx.eventRsvp.updateMany({ where: { userId: user.id, event: { groupId: group.id, dateTime: { gt: new Date() } } }, data: { status: 'NO', guestsCount: 0 } });
          for (const rsvp of cancelled) {
            await notify(tx, [user.id], 'RSVP cancelled', `Your RSVP for ${rsvp.event.title} was cancelled because you left ${group.name}.`, eventLink(group.urlname, rsvp.event.eventId));
          }
          await syncMemberCount(tx, group.id);
          return { success: true };
        }
        const existing = await tx.groupMembership.findUnique({ where: { userId_groupId: { userId: user.id, groupId: group.id } } });
        if (existing && !['ACTIVE', 'LEFT', 'PENDING'].includes(existing.status)) throw new ApiError(403, 'Group membership is restricted', 'FORBIDDEN');
        const status = group.isPrivate && group.organizerId !== user.id && existing?.status !== 'ACTIVE' ? 'PENDING' : 'ACTIVE';
        const member = await tx.groupMembership.upsert({
          where: { userId_groupId: { userId: user.id, groupId: group.id } }, update: { status },
          create: { userId: user.id, groupId: group.id, status, role: group.organizerId === user.id ? 'ORGANIZER' : 'MEMBER' },
        });
        if (status === 'PENDING' && existing?.status !== 'PENDING') {
          await notify(tx, [group.organizerId], 'Membership request', `${user.name} requested to join ${group.name}.`, groupLink(group.urlname));
          await notify(tx, [user.id], 'Membership request sent', `Your request to join ${group.name} is awaiting organizer review.`, groupLink(group.urlname));
        }
        return { membership: member, group: await syncMemberCount(tx, group.id) };
      });
      return { data: { [name]: result } };
    }
    case 'reviewMembershipRequest': {
      const membershipId = text(input.membershipId, 'Membership ID');
      const approve = bool(input.approve, 'Approve');
      const result = await atomic(async tx => {
        const group = await groupById(tx, input.groupId);
        if (group.organizerId !== user.id) throw new ApiError(403, 'Only the organizer can review membership requests', 'FORBIDDEN');
        const request = await tx.groupMembership.findFirst({ where: { id: membershipId, groupId: group.id } });
        if (!request) throw new ApiError(404, 'Membership request not found', 'NOT_FOUND');
        if (request.status !== 'PENDING' || request.userId === group.organizerId) throw new ApiError(409, 'Only pending membership requests can be reviewed', 'CONFLICT');
        const member = await tx.groupMembership.update({ where: { id: request.id }, data: { status: approve ? 'ACTIVE' : 'REJECTED' } });
        const updatedGroup = await syncMemberCount(tx, group.id);
        await notify(tx, [request.userId], approve ? 'Membership approved' : 'Membership request declined',
          `Your request to join ${group.name} was ${approve ? 'approved' : 'declined'}.`, groupLink(group.urlname));
        return { membership: member, group: updatedGroup };
      });
      return { data: { reviewMembershipRequest: result } };
    }
    case 'updateGroupMembership': {
      const group = await groupById(prisma, input.groupId);
      await membership(prisma, user.id, group.id);
      if ('role' in input || 'status' in input || 'userId' in input) throw new ApiError(400, 'Membership roles and status cannot be changed here');
      const data: Prisma.GroupMembershipUpdateInput = {};
      if (input.groupBio !== undefined) data.groupBio = text(input.groupBio, 'Group bio', 0, 2000);
      if (input.emailNotificationsConfig !== undefined) data.emailNotificationsConfig = jsonConfig(input.emailNotificationsConfig, 'Notification settings');
      const updated = await prisma.groupMembership.update({ where: { userId_groupId: { userId: user.id, groupId: group.id } }, data });
      return { data: { updateGroupMembership: updated } };
    }
    case 'addGroupPhoto':
    case 'uploadPhoto': {
      const result = await atomic(async tx => {
        const group = await groupById(tx, input.groupId ?? input.urlname);
        await membership(tx, user.id, group.id);
        const url = webUrl(input.url ?? input.imageUrl, 'Photo URL');
        if (!url.startsWith('https://')) throw new ApiError(400, 'External photo links must use HTTPS');
        let album = input.albumId ? await tx.photoAlbum.findFirst({ where: { id: text(input.albumId, 'Album ID'), groupId: group.id } }) : await tx.photoAlbum.findFirst({ where: { groupId: group.id } });
        if (input.albumId && !album) throw new ApiError(404, 'Album not found', 'NOT_FOUND');
        if (!album) album = await tx.photoAlbum.create({ data: { albumId: randomUUID(), groupId: group.id, title: `${group.name} photos`, photosCount: 0 } });
        const photo = await tx.photo.create({ data: { photoId: randomUUID(), albumId: album.id, uploadedById: user.id, url, caption: text(input.caption ?? '', 'Caption', 0, 1000) } });
        await tx.photoAlbum.update({ where: { id: album.id }, data: { photosCount: { increment: 1 } } });
        return photo;
      });
      return { data: { [name]: name === 'uploadPhoto' ? { photo: result } : result } };
    }
    case 'createDiscussion': {
      const group = await groupById(prisma, input.groupId ?? input.urlname);
      await membership(prisma, user.id, group.id);
      const discussion = await prisma.discussion.create({
        data: { groupId: group.id, authorId: user.id, title: text(input.title, 'Title', 3, 200), body: text(input.body, 'Body', 1, 10000), isPinned: false, likesCount: 0 },
        include: { author: { select: profile }, comments: { include: { author: { select: profile } } } },
      });
      return { data: { createDiscussion: discussion } };
    }
    case 'addDiscussionComment': {
      const discussion = await prisma.discussion.findUnique({ where: { id: text(input.discussionId, 'Discussion ID') } });
      if (!discussion) throw new ApiError(404, 'Discussion not found', 'NOT_FOUND');
      await membership(prisma, user.id, discussion.groupId);
      const comment = await prisma.discussionComment.create({ data: { discussionId: discussion.id, authorId: user.id, body: text(input.body, 'Body', 1, 10000) }, include: { author: { select: profile } } });
      return { data: { addDiscussionComment: comment } };
    }
    case 'saveGroupDraft': {
      const draft = await atomic(async tx => {
        const existing = input.groupId ? await groupById(tx, input.groupId) : await tx.group.findFirst({ where: { organizerId: user.id, isDraft: true } });
        if (existing && (existing.organizerId !== user.id || !existing.isDraft)) throw new ApiError(403, 'Only your own draft can be edited', 'FORBIDDEN');
        const name = text(input.name ?? existing?.name, 'Group name', 3, 120);
        const data = {
          name, description: text(input.description ?? existing?.description ?? '', 'Description', 0, 10000),
          city: text(input.city ?? existing?.city ?? user.city, 'City', 0, 100),
          state: text(input.state ?? existing?.state ?? user.state, 'State', 0, 100),
          country: text(input.country ?? existing?.country ?? user.country, 'Country', 0, 100),
          isPrivate: input.isPrivate === undefined ? existing?.isPrivate ?? false : bool(input.isPrivate, 'Private group'),
          draftStep: integer(input.step ?? existing?.draftStep ?? 1, 'Step', 1, 10),
          ...(input.coverImage !== undefined ? { coverImage: input.coverImage === '' ? '' : webUrl(input.coverImage, 'Cover image') } : {}),
        };
        const group = existing ? await tx.group.update({ where: { id: existing.id }, data }) : await tx.group.create({
          data: { ...data, groupId: randomUUID(), urlname: `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'group'}-${randomUUID().slice(0, 8)}`, organizerId: user.id, isDraft: true, coverImage: data.coverImage ?? '', rating: 0, ratingsCount: 0, membersCount: 0, fundraisingGoal: 0, fundraisingRaised: 0, lat: 0, lon: 0 },
        });
        if (input.topicIds !== undefined) {
          if (!Array.isArray(input.topicIds) || input.topicIds.length > 20) throw new ApiError(400, 'topicIds must contain at most 20 topics');
          await tx.groupTopic.deleteMany({ where: { groupId: group.id } });
          for (const value of input.topicIds) {
            const id = text(value, 'Topic ID');
            const topic = await tx.topic.findFirst({ where: { OR: [{ id }, { topicId: id }] } });
            if (!topic) throw new ApiError(404, 'Topic not found', 'NOT_FOUND');
            await tx.groupTopic.upsert({ where: { groupId_topicId: { groupId: group.id, topicId: topic.id } }, create: { groupId: group.id, topicId: topic.id }, update: {} });
          }
        }
        return group;
      });
      return { data: { saveGroupDraft: { group: draft } } };
    }
    case 'completeGroupCreation': {
      if (input.plan !== undefined && input.plan !== 'FREE') throw new ApiError(503, 'Only free group publication is available', 'SERVICE_UNAVAILABLE');
      const group = await atomic(async tx => {
        const draft = input.groupId ? await groupById(tx, input.groupId) : await tx.group.findFirst({ where: { organizerId: user.id, isDraft: true } });
        if (!draft) throw new ApiError(404, 'Group draft not found', 'NOT_FOUND');
        if (draft.organizerId !== user.id) throw new ApiError(403, 'Only the organizer can publish this group', 'FORBIDDEN');
        text(draft.name, 'Group name', 3, 120); text(draft.description, 'Description', 20, 10000); text(draft.city, 'City', 1, 100);
        await tx.groupMembership.upsert({ where: { userId_groupId: { userId: user.id, groupId: draft.id } }, update: { role: 'ORGANIZER', status: 'ACTIVE' }, create: { userId: user.id, groupId: draft.id, role: 'ORGANIZER' } });
        await tx.group.update({ where: { id: draft.id }, data: { isDraft: false, duesAmount: 0 } });
        await tx.user.update({ where: { id: user.id }, data: { groupDraftCompletedAt: new Date() } });
        if (draft.isDraft) await notifyGroup(tx, draft.id, 'Group published', `${draft.name} is now published and ready for its first event.`, groupLink(draft.urlname));
        return syncMemberCount(tx, draft.id);
      });
      return { data: { completeGroupCreation: { group } } };
    }
    case 'createEvent': {
      const event = await atomic(async tx => {
        const group = await groupById(tx, input.groupId);
        if (group.organizerId !== user.id || group.isDraft) throw new ApiError(403, 'Only the organizer of a published group can create events', 'FORBIDDEN');
        if (input.feeAmount !== undefined && input.feeAmount !== 0) throw new ApiError(503, 'Only free events are available', 'SERVICE_UNAVAILABLE');
        const dateTime = date(input.dateTime, 'Start time'), endTime = date(input.endTime, 'End time');
        if (dateTime.getTime() <= Date.now() || endTime <= dateTime) throw new ApiError(400, 'Event must start in the future and end after it starts');
        const timezone = text(input.timezone, 'Timezone', 1, 100);
        try { new Intl.DateTimeFormat('en', { timeZone: timezone }); } catch { throw new ApiError(400, 'Invalid timezone'); }
        const eventType = input.eventType;
        if (eventType !== 'IN_PERSON' && eventType !== 'ONLINE') throw new ApiError(400, 'Invalid event type');
        const created = await tx.event.create({
          data: {
            eventId: randomUUID(), groupId: group.id, hostId: user.id, title: text(input.title, 'Title', 3, 200),
            description: text(input.description, 'Description', 20, 20000), dateTime, endTime, timezone, eventType,
            venueName: text(input.venueName ?? '', 'Venue name', eventType === 'IN_PERSON' ? 1 : 0, 200),
            venueAddress: text(input.venueAddress ?? '', 'Venue address', eventType === 'IN_PERSON' ? 1 : 0, 300),
            venueCity: text(input.venueCity ?? group.city, 'Venue city', eventType === 'IN_PERSON' ? 1 : 0, 100),
            venueState: group.state, lat: group.lat, lon: group.lon,
            onlineUrl: eventType === 'ONLINE' ? webUrl(input.onlineUrl, 'Online meeting URL') : null,
            maxTickets: integer(input.maxTickets, 'Capacity', 1, 10000),
            coverImage: input.coverImage ? webUrl(input.coverImage, 'Cover image') : group.coverImage,
            allowGuests: false, maxGuests: 0, feeAmount: 0, status: 'UPCOMING', topicsJson: '[]',
          },
        });
        await notifyGroup(tx, group.id, 'New group event', `${created.title} was published in ${group.name}.`, eventLink(group.urlname, created.eventId));
        return created;
      });
      return { data: { createEvent: { event } } };
    }
    case 'cancelEvent': {
      const id = text(input.eventId, 'Event ID');
      const event = await atomic(async tx => {
        const existing = await tx.event.findFirst({ where: { OR: [{ eventId: id }, { id }] }, include: { group: true } });
        if (!existing) throw new ApiError(404, 'Event not found', 'NOT_FOUND');
        if (existing.group.organizerId !== user.id) throw new ApiError(403, 'Only the organizer can cancel this event', 'FORBIDDEN');
        if (existing.status === 'CANCELLED') return existing;
        if (!['UPCOMING', 'ACTIVE'].includes(existing.status) || existing.dateTime.getTime() <= Date.now()) throw new ApiError(409, 'Only upcoming events can be cancelled', 'CONFLICT');
        const attendees = await tx.eventRsvp.findMany({ where: { eventId: existing.id, status: 'YES' }, select: { userId: true } });
        await tx.eventRsvp.updateMany({ where: { eventId: existing.id, status: 'YES' }, data: { status: 'NO', guestsCount: 0 } });
        const cancelled = await tx.event.update({ where: { id: existing.id }, data: { status: 'CANCELLED' } });
        await notify(tx, [...attendees.map(attendee => attendee.userId), user.id], 'Event cancelled',
          `${existing.title} has been cancelled by the organizer.`, eventLink(existing.group.urlname, existing.eventId));
        return cancelled;
      });
      return { data: { cancelEvent: { event } } };
    }
    case 'markAllNotificationsRead':
    case 'markNotificationsRead': {
      await prisma.notification.updateMany({ where: { userId: user.id }, data: { isRead: true } });
      return { data: { [name]: { success: true } } };
    }
    case 'sendMessage': {
      const id = text(input.receiverId, 'Receiver ID');
      const receiver = await prisma.user.findFirst({ where: { OR: [{ id }, { memberId: id }] }, select: { id: true, whoCanContact: true } });
      if (!receiver || receiver.id === user.id) throw new ApiError(400, 'Invalid message recipient');
      const connection = await prisma.connection.findFirst({ where: { OR: [{ requesterId: user.id, addresseeId: receiver.id }, { requesterId: receiver.id, addresseeId: user.id }] } });
      let allowed = receiver.whoCanContact === 'ANYONE';
      if (receiver.whoCanContact === 'CONNECTIONS') allowed = connection?.status === 'CONNECTED';
      if (receiver.whoCanContact === 'SHARED_GROUPS' || receiver.whoCanContact === 'ORGANIZERS_ONLY') {
        const shared = await prisma.groupMembership.findFirst({
          where: {
            userId: receiver.id, status: 'ACTIVE',
            group: {
              isDraft: false,
              ...(receiver.whoCanContact === 'ORGANIZERS_ONLY'
                ? { organizerId: user.id }
                : { memberships: { some: { userId: user.id, status: 'ACTIVE' } } }),
            },
          },
          select: { id: true },
        });
        allowed = Boolean(shared);
      }
      if (connection?.status === 'BLOCKED' || !allowed) throw new ApiError(403, 'This member does not accept messages from you', 'FORBIDDEN');
      const message = await prisma.message.create({ data: { senderId: user.id, receiverId: receiver.id, body: text(input.body, 'Message', 1, 10000) }, include: { sender: { select: profile }, receiver: { select: profile } } });
      return { data: { sendMessage: message } };
    }
    case 'updateConnection': {
      const id = text(input.connectionId, 'Connection ID');
      const status = text(input.status, 'Status');
      if (!['CONNECTED', 'DECLINED', 'DISCONNECTED', 'BLOCKED'].includes(status)) throw new ApiError(400, 'Invalid connection status');
      const updated = await atomic(async tx => {
        const connection = await tx.connection.findUnique({ where: { id } });
        if (!connection || ![connection.addresseeId, connection.requesterId].includes(user.id)) throw new ApiError(404, 'Connection not found', 'NOT_FOUND');
        if (status === 'CONNECTED' && (connection.addresseeId !== user.id || connection.status !== 'PENDING')) throw new ApiError(403, 'Only the recipient can accept a pending connection', 'FORBIDDEN');
        if (connection.status === 'BLOCKED' && status !== 'BLOCKED') throw new ApiError(403, 'Blocked connections cannot be changed here', 'FORBIDDEN');
        return tx.connection.update({ where: { id }, data: { status } });
      });
      return { data: { updateConnection: updated } };
    }
    case 'submitReport': {
      const targetType = text(input.targetType, 'Target type');
      const targetId = text(input.targetId, 'Target ID');
      const reason = text(input.reason, 'Reason', 3, 200);
      if (!['EVENT', 'GROUP', 'MEMBER', 'DISCUSSION', 'PHOTO'].includes(targetType)) throw new ApiError(400, 'Invalid report target type');
      const target = targetType === 'EVENT'
        ? await prisma.event.findFirst({ where: { OR: [{ id: targetId }, { eventId: targetId }] }, select: { id: true } })
        : targetType === 'GROUP'
        ? await prisma.group.findFirst({ where: { OR: [{ id: targetId }, { groupId: targetId }] }, select: { id: true } })
        : targetType === 'MEMBER'
        ? await prisma.user.findFirst({ where: { OR: [{ id: targetId }, { memberId: targetId }] }, select: { id: true } })
        : targetType === 'DISCUSSION'
        ? await prisma.discussion.findUnique({ where: { id: targetId }, select: { id: true } })
        : await prisma.photo.findFirst({ where: { OR: [{ id: targetId }, { photoId: targetId }] }, select: { id: true } });
      if (!target) throw new ApiError(404, 'Report target not found', 'NOT_FOUND');
      const report = await prisma.reportSubmission.create({ data: { reporterId: user.id, targetType, targetId: target.id, reason, details: text(input.details ?? '', 'Details', 0, 5000) } });
      return { data: { submitReport: report } };
    }
    default: throw new ApiError(400, `Unknown operation: ${name}`, 'UNKNOWN_OPERATION');
  }
}

export const config = { api: { bodyParser: { sizeLimit: '128kb' } } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ errors: [{ message: 'Method not allowed', extensions: { code: 'METHOD_NOT_ALLOWED' } }] });
  }
  try {
    sameOrigin(req.headers);
    const user = await getActiveUser(req, res);
    if (user) await rateLimit(`api:${user.id}`, 120, 60_000);
    else await rateLimit(`public-api:${req.socket.remoteAddress || 'unknown'}`, 60, 60_000);
    if (Array.isArray(req.body)) throw new ApiError(400, 'Batch requests are not supported');
    const result = await executeOperation(req.body, user);
    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof ApiError) return res.status(error.status).json({ errors: [{ message: error.message, extensions: { code: error.code } }] });
    console.error('API operation failed', error instanceof Error ? error.name : 'Unknown error');
    return res.status(500).json({ errors: [{ message: 'The operation could not be completed', extensions: { code: 'INTERNAL_SERVER_ERROR' } }] });
  }
}
