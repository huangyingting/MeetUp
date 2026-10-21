import assert from 'node:assert/strict';
import test from 'node:test';
import { registerHooks } from 'node:module';
import { existsSync } from 'node:fs';

const notifications = [];
const db = {
  notification: {
    async createMany({ data }) { notifications.push(...data); return { count: data.length }; },
  },
  async $transaction(callback, options) {
    assert.equal(options.isolationLevel, 'Serializable');
    return callback(db);
  },
};
globalThis.__backendTestPrisma = db;
registerHooks({
  resolve(specifier, context, next) {
    if (specifier === 'next-auth') return { url: 'data:text/javascript,export default function NextAuth() { return async () => {}; }', shortCircuit: true };
    if (specifier === 'next-auth/providers/credentials') return { url: 'data:text/javascript,export default function CredentialsProvider(config) { return config; }', shortCircuit: true };
    if (specifier === '@/lib/prisma') return { url: 'data:text/javascript,export const prisma = globalThis.__backendTestPrisma;', shortCircuit: true };
    if (specifier === '@/lib/auth-helper') return { url: 'data:text/javascript,export async function getActiveUser() { return null; }', shortCircuit: true };
    if (specifier.startsWith('@/')) return { url: new URL('../../' + specifier.slice(2) + '.ts', import.meta.url).href, shortCircuit: true };
    if (specifier.startsWith('.') && context.parentURL?.includes('/src/lib/backend/')) {
      const url = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(url)) return { url: url.href, shortCircuit: true };
    }
    return next(specifier, context);
  },
});
const { executeOperation } = await import('../../pages/api/gql2.ts');
const { hashPassword } = await import('./security.ts');
const { default: register } = await import('../../pages/api/auth/register.ts');
const { authOptions } = await import('../../pages/api/auth/[...nextauth].ts');
const { default: health } = await import('../../pages/api/health.ts');
const { Prisma } = await import('@prisma/client');
const user = { id: 'user-1', memberId: 'member-1', name: 'Real User', city: 'Taipei', state: '', country: 'TW' };
const operation = (operationName, input = {}) => ({ operationName, variables: { input } });
const group = { id: 'group-db', groupId: 'group-public', name: 'Local Group', urlname: 'local-group', organizerId: 'organizer', isDraft: false, isPrivate: false };
const event = {
  id: 'event-db', eventId: 'event-public', groupId: group.id, group,
  dateTime: new Date(Date.now() + 86400000), status: 'UPCOMING', feeAmount: 0,
  maxTickets: 3, allowGuests: true, maxGuests: 2,
};

test('every mutation and private query rejects anonymous callers', async () => {
  for (const name of ['getSelf', 'changePassword', 'updateMemberData', 'joinGroup', 'leaveGroup', 'rsvpToEvent', 'saveGroupDraft', 'completeGroupCreation', 'createEvent', 'cancelEvent', 'reviewMembershipRequest', 'sendMessage', 'addGroupPhoto', 'createDiscussion', 'createOAuthApp']) {
    await assert.rejects(executeOperation(operation(name), null), { status: 401 });
  }
  await assert.rejects(executeOperation({ query: '{ self { id } }' }, null), { status: 400 });
});

test('unavailable integrations and unknown operations never return fake success', async () => {
  for (const name of ['subscribeMeetupPlus', 'donateToGroup', 'addPaymentMethod', 'createOAuthApp', 'generateAiGroupDescription', 'likeDiscussion']) {
    await assert.rejects(executeOperation(operation(name), user), { status: 503 });
  }
  await assert.rejects(executeOperation(operation('inventedOperation'), user), { code: 'UNKNOWN_OPERATION' });
});

test('profile updates cannot alter email, credentials, IDs or entitlements', async () => {
  for (const field of ['email', 'passwordHash', 'id', 'memberId', 'isMeetupPlus', 'meetupPlusPlan', 'organizerPlan']) {
    await assert.rejects(executeOperation(operation('updateAccountSettings', { [field]: 'malicious' }), user), { status: 400 });
  }
  await assert.rejects(executeOperation(operation('updateMemberData', { showGroups: 'false' }), user), { status: 400 });
});

test('RSVP validates status, guests, capacity, event state, membership and paid tickets', async () => {
  db.event = { async findFirst() { return { ...event }; } };
  db.groupMembership = { async findUnique() { return null; }, async findMany() { return [{ userId: user.id }]; } };
  db.eventRsvp = {
    async findUnique() { return null; },
    async aggregate() { return { _count: { _all: 2 }, _sum: { guestsCount: 0 } }; },
  };
  await assert.rejects(executeOperation(operation('rsvpToEvent', { eventId: event.eventId, status: 'MAYBE' }), user), { status: 400 });
  await assert.rejects(executeOperation(operation('rsvpToEvent', { eventId: event.eventId, guestsCount: -1 }), user), { status: 400 });
  await assert.rejects(executeOperation(operation('rsvpToEvent', { eventId: event.eventId, guestsCount: 2 }), user), { code: 'EVENT_FULL' });
  db.event.findFirst = async () => ({ ...event, status: 'CANCELED' });
  await assert.rejects(executeOperation(operation('rsvpToEvent', { eventId: event.eventId }), user), { status: 409 });
  db.event.findFirst = async () => ({ ...event, group: { ...group, isPrivate: true } });
  await assert.rejects(executeOperation(operation('rsvpToEvent', { eventId: event.eventId }), user), { status: 403 });
  db.event.findFirst = async () => ({ ...event, feeAmount: 10 });
  await assert.rejects(executeOperation(operation('rsvpToEvent', { eventId: event.eventId }), user), { status: 503 });
});

test('RSVP cancellation clears guests and successful RSVP recomputes membership count', async () => {
  notifications.length = 0;
  db.event.findFirst = async () => ({ ...event });
  db.eventRsvp.aggregate = async () => ({ _count: { _all: 0 }, _sum: { guestsCount: 0 } });
  db.groupMembership.upsert = async args => args.create;
  db.groupMembership.count = async () => 7;
  db.group = { async update(args) { assert.equal(args.data.membersCount, 7); return group; } };
  db.eventRsvp.upsert = async args => args.update;
  const yes = await executeOperation(operation('rsvpToEvent', { eventId: event.eventId, status: 'YES', guestsCount: 2 }), user);
  assert.equal(yes.data.rsvpToEvent.rsvp.guestsCount, 2);
  assert.ok(notifications.some(item => item.userId === user.id && item.title === 'RSVP confirmed'));
  db.eventRsvp.findUnique = async () => ({ status: 'YES', guestsCount: 2 });
  const previousCount = notifications.length;
  await executeOperation(operation('rsvpToEvent', { eventId: event.eventId, status: 'YES', guestsCount: 2 }), user);
  assert.equal(notifications.length, previousCount);
  const no = await executeOperation(operation('rsvpToEvent', { eventId: event.eventId, status: 'NO', guestsCount: 2 }), user);
  assert.equal(no.data.rsvpToEvent.rsvp.guestsCount, 0);
  assert.ok(notifications.some(item => item.userId === user.id && item.title === 'RSVP cancelled'));
  assert.ok(notifications.every(item => item.link === '/local-group/events/event-public'));
});

test('organizers cannot leave; nonorganizers cannot publish drafts or create events', async () => {
  db.group.findFirst = async () => ({ ...group, organizerId: user.id });
  await assert.rejects(executeOperation(operation('leaveGroup', { groupId: group.id }), user), { status: 409 });
  db.group.findFirst = async () => ({ ...group });
  await assert.rejects(executeOperation(operation('completeGroupCreation', { groupId: group.id }), user), { status: 403 });
  await assert.rejects(executeOperation(operation('createEvent', { groupId: group.id }), user), { status: 403 });
});

test('nonmembers cannot post photos, discussions or comments', async () => {
  db.groupMembership.findUnique = async () => null;
  for (const name of ['addGroupPhoto', 'createDiscussion']) await assert.rejects(executeOperation(operation(name, { groupId: group.id }), user), { status: 403 });
  db.discussion = { async findUnique() { return { id: 'discussion', groupId: group.id }; } };
  await assert.rejects(executeOperation(operation('addDiscussionComment', { discussionId: 'discussion', body: 'hello' }), user), { status: 403 });
});

test('connection updates enforce participant ownership and recipient-only acceptance', async () => {
  db.connection = { async findUnique() { return { id: 'connection', requesterId: 'other-a', addresseeId: 'other-b', status: 'PENDING' }; } };
  await assert.rejects(executeOperation(operation('updateConnection', { connectionId: 'connection', status: 'CONNECTED' }), user), { status: 404 });
  db.connection.findUnique = async () => ({ id: 'connection', requesterId: user.id, addresseeId: 'other-b', status: 'PENDING' });
  await assert.rejects(executeOperation(operation('updateConnection', { connectionId: 'connection', status: 'CONNECTED' }), user), { status: 403 });
});

test('password change checks current password and writes a fresh hash conditionally', async () => {
  db.apiRateLimit = { async updateMany() {}, async upsert() { return { count: 1, resetAt: new Date() }; } };
  const passwordHash = await hashPassword('  current password  ');
  db.user = {
    async findUnique() { return { passwordHash }; },
    async updateMany(args) {
      assert.equal(args.where.passwordHash, passwordHash);
      assert.notEqual(args.data.passwordHash, passwordHash);
      assert.match(args.data.passwordHash, /^scrypt\$/);
      return { count: 1 };
    },
  };
  await assert.rejects(executeOperation(operation('changePassword', { currentPassword: 'wrong', newPassword: 'new password value' }), user), { status: 400 });
  const changed = await executeOperation(operation('changePassword', { currentPassword: '  current password  ', newPassword: 'new password value' }), user);
  assert.equal(changed.data.changePassword.success, true);
});

function response() {
  return {
    statusCode: 200, body: null, headers: {},
    setHeader(name, value) { this.headers[name] = value; return this; },
    status(value) { this.statusCode = value; return this; },
    json(value) { this.body = value; return this; },
  };
}

test('registration endpoint validates browser origin, inputs and duplicate emails', async () => {
  const savedOrigin = process.env.NEXTAUTH_URL;
  process.env.NEXTAUTH_URL = 'http://localhost:3000';
  try {
    const request = { method: 'POST', headers: { origin: 'http://localhost:3000' }, socket: { remoteAddress: '127.0.0.1' }, body: { name: 'New User', email: 'new@example.com', password: 'secure password value', city: 'Taipei' } };
    let res = response();
    await register({ ...request, method: 'GET' }, res);
    assert.equal(res.statusCode, 405);
    res = response();
    await register({ ...request, headers: { origin: 'https://evil.example' } }, res);
    assert.equal(res.statusCode, 403);
    res = response();
    await register({ ...request, body: { ...request.body, email: 'invalid' } }, res);
    assert.equal(res.statusCode, 400);
    assert.equal(typeof res.body.error, 'string');
    db.user.create = async args => {
      assert.match(args.data.passwordHash, /^scrypt\$/);
      assert.equal(args.data.city, 'Taipei');
      assert.notEqual(args.data.memberId, '484670701');
      assert.deepEqual(args.select, { id: true, memberId: true, name: true, email: true });
      return { id: 'new-account', memberId: args.data.memberId, name: args.data.name, email: args.data.email };
    };
    res = response();
    await register(request, res);
    assert.equal(res.statusCode, 201);
    assert.equal(res.body.user.email, 'new@example.com');
    assert.equal(res.body.user.passwordHash, undefined);
    assert.equal(res.body.user.id, undefined);
    db.user.create = async () => { throw new Prisma.PrismaClientKnownRequestError('duplicate', { code: 'P2002', clientVersion: '7.10.1' }); };
    res = response();
    await register(request, res);
    assert.equal(res.statusCode, 409);
    assert.equal(res.body.code, 'EMAIL_IN_USE');
  } finally {
    if (savedOrigin === undefined) delete process.env.NEXTAUTH_URL;
    else process.env.NEXTAUTH_URL = savedOrigin;
  }
});

test('credentials only authenticate the matching stored email and password', async () => {
  const passwordHash = await hashPassword('correct password value');
  const authorize = authOptions.providers[0].authorize;
  db.user.findUnique = async ({ where, omit }) => {
    assert.equal(omit.passwordHash, false);
    return where.email === 'real@example.com' ? { ...user, email: 'real@example.com', passwordHash } : null;
  };
  assert.equal(await authorize({ email: 'missing@example.com', password: 'correct password value' }), null);
  assert.equal(await authorize({ email: 'real@example.com', password: 'wrong password value' }), null);
  assert.equal(await authorize({ email: '', password: '' }), null);
  const signedIn = await authorize({ email: 'REAL@example.com', password: 'correct password value' });
  assert.equal(signedIn.id, user.id);
  assert.equal(signedIn.memberId, user.memberId);
  assert.equal(signedIn.passwordHash, undefined);
  assert.equal(signedIn.authVersion, passwordHash.split('$')[4]);
});

test('password rotation invalidates issued JWT sessions', async () => {
  db.user.findUnique = async () => ({ passwordHash: 'scrypt$16384$8$1$new-salt$hash' });
  const token = await authOptions.callbacks.jwt({ token: { uid: user.id, memberId: user.memberId, authVersion: 'old-salt' } });
  assert.equal(token.uid, undefined);
  assert.equal(token.memberId, undefined);
});

test('draft saving and free publication preserve canonical response contracts without entitlements', async () => {
  notifications.length = 0;
  let saved;
  db.group.findFirst = async () => saved ?? null;
  db.group.create = async ({ data }) => {
    saved = { ...data, id: 'new-group-db' };
    assert.equal(data.rating, 0);
    assert.equal(data.ratingsCount, 0);
    assert.equal(data.fundraisingRaised, 0);
    return saved;
  };
  db.group.update = async ({ data }) => { saved = { ...saved, ...data }; return saved; };
  db.groupMembership.upsert = async ({ create }) => {
    assert.equal(create.role, 'ORGANIZER');
    assert.equal(create.userId, user.id);
    return create;
  };
  db.groupMembership.count = async () => 1;
  db.user.update = async ({ data }) => {
    assert.equal('organizerPlan' in data, false);
    return user;
  };
  const draft = await executeOperation(operation('saveGroupDraft', {
    name: 'Real Local Group', city: 'Taipei', state: '', country: 'TW',
    description: 'A genuine group for neighbors to meet and share interests.', isPrivate: false,
  }), user);
  assert.equal(draft.data.saveGroupDraft.group.id, 'new-group-db');
  assert.equal(draft.data.saveGroupDraft.group.isDraft, true);
  assert.ok(draft.data.saveGroupDraft.group.groupId);
  assert.ok(draft.data.saveGroupDraft.group.urlname);
  const published = await executeOperation(operation('completeGroupCreation', { groupId: 'new-group-db' }), user);
  assert.equal(published.data.completeGroupCreation.group.isDraft, false);
  assert.equal(published.data.completeGroupCreation.group.membersCount, 1);
  assert.equal(published.data.completeGroupCreation.group.duesAmount, 0);
  assert.equal(notifications.filter(item => item.title === 'Group published').length, 1);
  await executeOperation(operation('completeGroupCreation', { groupId: 'new-group-db' }), user);
  assert.equal(notifications.filter(item => item.title === 'Group published').length, 1);
});

test('organizers create only valid future free events with public event IDs', async () => {
  notifications.length = 0;
  db.group.findFirst = async () => ({ ...group, organizerId: user.id, city: 'Taipei', state: '', lat: 0, lon: 0, coverImage: '' });
  db.event.create = async ({ data }) => {
    assert.equal(data.feeAmount, 0);
    assert.equal(data.hostId, user.id);
    assert.equal(data.allowGuests, false);
    assert.equal(data.status, 'UPCOMING');
    return { ...data, id: 'new-event-db' };
  };
  const input = {
    groupId: group.id, title: 'Neighborhood Gathering',
    description: 'Meet local neighbors and get to know our community.',
    dateTime: new Date(Date.now() + 86400000).toISOString(),
    endTime: new Date(Date.now() + 90000000).toISOString(),
    timezone: 'Asia/Taipei', eventType: 'IN_PERSON', venueName: 'Library',
    venueAddress: '123 Library Road', venueCity: 'Taipei', maxTickets: 20,
  };
  const created = await executeOperation(operation('createEvent', input), user);
  assert.ok(created.data.createEvent.event.eventId);
  assert.equal(created.data.createEvent.event.groupId, group.id);
  assert.ok(notifications.some(item => item.userId === user.id && item.title === 'New group event'));
  assert.equal(notifications[0].link, `/local-group/events/${created.data.createEvent.event.eventId}`);
  await assert.rejects(executeOperation(operation('createEvent', { ...input, feeAmount: 5 }), user), { status: 503 });
  await assert.rejects(executeOperation(operation('createEvent', { ...input, timezone: 'Invalid/Zone' }), user), { status: 400 });
  await assert.rejects(executeOperation(operation('createEvent', { ...input, endTime: input.dateTime }), user), { status: 400 });
  await assert.rejects(executeOperation(operation('createEvent', { ...input, eventType: 'ONLINE' }), user), { status: 400 });
});

test('canonical contact preferences are accepted and enforce shared-group/organizer messaging', async () => {
  db.user.update = async ({ data }) => {
    assert.ok(['ANYONE', 'SHARED_GROUPS', 'ORGANIZERS_ONLY', 'NOBODY'].includes(data.whoCanContact));
    return { ...user, whoCanContact: data.whoCanContact };
  };
  for (const value of ['ANYONE', 'SHARED_GROUPS', 'ORGANIZERS_ONLY', 'NOBODY']) {
    const result = await executeOperation(operation('updateAccountSettings', { whoCanContact: value }), user);
    assert.equal(result.data.updateAccountSettings.member.whoCanContact, value);
  }
  db.connection.findFirst = async () => null;
  db.user.findFirst = async () => ({ id: 'receiver', whoCanContact: 'NOBODY' });
  await assert.rejects(executeOperation(operation('sendMessage', { receiverId: 'receiver', body: 'Hello' }), user), { status: 403 });
  db.user.findFirst = async () => ({ id: 'receiver', whoCanContact: 'SHARED_GROUPS' });
  db.groupMembership.findFirst = async ({ where }) => {
    assert.equal(where.userId, 'receiver');
    assert.equal(where.group.memberships.some.userId, user.id);
    return null;
  };
  await assert.rejects(executeOperation(operation('sendMessage', { receiverId: 'receiver', body: 'Hello' }), user), { status: 403 });
  db.user.findFirst = async () => ({ id: 'receiver', whoCanContact: 'ORGANIZERS_ONLY' });
  db.groupMembership.findFirst = async ({ where }) => {
    assert.equal(where.group.organizerId, user.id);
    return { id: 'shared-membership' };
  };
  db.message = { async create({ data }) { return { ...data, id: 'message' }; } };
  const message = await executeOperation(operation('sendMessage', { receiverId: 'receiver', body: 'Hello' }), user);
  assert.equal(message.data.sendMessage.senderId, user.id);
});

test('readiness returns minimal uncached status and hides database errors', async () => {
  db.$queryRaw = async () => [{ value: 1 }];
  let res = response();
  await health({ method: 'GET' }, res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { status: 'ok' });
  assert.equal(res.headers['Cache-Control'], 'no-store');
  db.$queryRaw = async () => { throw new Error('private database connection details'); };
  res = response();
  await health({ method: 'GET' }, res);
  assert.equal(res.statusCode, 503);
  assert.deepEqual(res.body, { status: 'unavailable' });
  res = response();
  await health({ method: 'POST' }, res);
  assert.equal(res.statusCode, 405);
  assert.equal(res.headers.Allow, 'GET');
});

test('private membership requests notify once, and only organizers review pending requests', async () => {
  notifications.length = 0;
  const privateGroup = { ...group, isPrivate: true };
  let pending = null;
  db.group.findFirst = async () => privateGroup;
  db.group.update = async ({ data }) => ({ ...privateGroup, ...data });
  db.groupMembership = {
    async findUnique() { return pending; },
    async upsert({ create, update }) { pending = pending ? { ...pending, ...update } : { ...create, id: 'request-1' }; return pending; },
    async findFirst({ where }) { return pending?.id === where.id && pending?.groupId === where.groupId ? pending : null; },
    async update({ data }) { pending = { ...pending, ...data }; return pending; },
    async count() { return pending?.status === 'ACTIVE' ? 1 : 0; },
  };
  const requested = await executeOperation(operation('joinGroup', { groupId: group.id }), user);
  assert.equal(requested.data.joinGroup.membership.status, 'PENDING');
  assert.equal(requested.data.joinGroup.group.membersCount, 0);
  assert.equal(notifications.length, 2);
  assert.equal(notifications[0].userId, group.organizerId);
  assert.ok(notifications.every(item => item.link === '/local-group'));
  await executeOperation(operation('joinGroup', { groupId: group.id }), user);
  assert.equal(notifications.length, 2);
  const review = { groupId: group.id, membershipId: 'request-1', approve: true };
  await assert.rejects(executeOperation(operation('reviewMembershipRequest', review), user), { status: 403 });
  const organizer = { ...user, id: group.organizerId };
  await assert.rejects(executeOperation(operation('reviewMembershipRequest', { ...review, approve: 'true' }), organizer), { status: 400 });
  await assert.rejects(executeOperation(operation('reviewMembershipRequest', { ...review, membershipId: 'different-group-request' }), organizer), { status: 404 });
  const approved = await executeOperation(operation('reviewMembershipRequest', review), organizer);
  assert.equal(approved.data.reviewMembershipRequest.membership.status, 'ACTIVE');
  assert.equal(approved.data.reviewMembershipRequest.membership.role, 'MEMBER');
  assert.equal(approved.data.reviewMembershipRequest.group.membersCount, 1);
  assert.equal(notifications.at(-1).userId, user.id);
  assert.equal(notifications.at(-1).title, 'Membership approved');
  await assert.rejects(executeOperation(operation('reviewMembershipRequest', review), organizer), { status: 409 });
  assert.equal(notifications.length, 3);
  pending = { ...pending, status: 'PENDING' };
  const rejected = await executeOperation(operation('reviewMembershipRequest', { ...review, approve: false }), organizer);
  assert.equal(rejected.data.reviewMembershipRequest.membership.status, 'REJECTED');
  assert.equal(rejected.data.reviewMembershipRequest.group.membersCount, 0);
  assert.equal(notifications.at(-1).title, 'Membership request declined');
});

test('event cancellation is organizer-only, clears attendance, and notifies once per recipient', async () => {
  notifications.length = 0;
  let stored = { ...event, title: 'Community Gathering', group: { ...group, organizerId: user.id } };
  let rsvpUpdates = 0;
  db.event.findFirst = async () => stored;
  db.event.update = async ({ data }) => { stored = { ...stored, ...data }; return stored; };
  db.eventRsvp.findMany = async ({ where }) => {
    assert.equal(where.status, 'YES');
    return [{ userId: user.id }, { userId: 'attendee' }, { userId: 'attendee' }];
  };
  db.eventRsvp.updateMany = async ({ data }) => {
    assert.deepEqual(data, { status: 'NO', guestsCount: 0 });
    rsvpUpdates++;
    return { count: 2 };
  };
  await assert.rejects(executeOperation(operation('cancelEvent', { eventId: event.eventId }), { ...user, id: 'outsider' }), { status: 403 });
  assert.equal(notifications.length, 0);
  const cancelled = await executeOperation(operation('cancelEvent', { eventId: event.eventId }), user);
  assert.equal(cancelled.data.cancelEvent.event.status, 'CANCELLED');
  assert.equal(rsvpUpdates, 1);
  assert.equal(notifications.length, 2);
  assert.ok(notifications.every(item => item.title === 'Event cancelled' && item.link === '/local-group/events/event-public'));
  await executeOperation(operation('cancelEvent', { eventId: event.eventId }), user);
  assert.equal(notifications.length, 2);
  assert.equal(rsvpUpdates, 1);
  stored = { ...stored, status: 'UPCOMING', dateTime: new Date(Date.now() - 1000) };
  await assert.rejects(executeOperation(operation('cancelEvent', { eventId: event.eventId }), user), { status: 409 });
});
