import assert from 'node:assert/strict';
import { randomUUID, randomBytes } from 'node:crypto';

const base = process.env.INTEGRATION_BASE_URL;
if (!base || !['localhost', '127.0.0.1'].includes(new URL(base).hostname) || new URL(base).port === '3000') {
  throw new Error('Set INTEGRATION_BASE_URL to a loopback server on a non-3000 port backed by a disposable database.');
}

class Client {
  cookies = new Map();
  async request(path, { method = 'GET', body, origin = base } = {}) {
    const response = await fetch(base + path, {
      method, redirect: 'manual',
      headers: {
        Origin: origin, Cookie: [...this.cookies].map(([key, value]) => `${key}=${value}`).join('; '),
        ...(body instanceof URLSearchParams ? { 'Content-Type': 'application/x-www-form-urlencoded' } : body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body instanceof URLSearchParams ? body.toString() : body ? JSON.stringify(body) : undefined,
    });
    for (const cookie of response.headers.getSetCookie()) {
      const entry = cookie.split(';')[0];
      const split = entry.indexOf('=');
      this.cookies.set(entry.slice(0, split), entry.slice(split + 1));
    }
    return response;
  }
  async api(name, input = {}, expected = 200) {
    const response = await this.request('/gql2', { method: 'POST', body: { operationName: name, variables: { input } } });
    const result = await response.json();
    assert.equal(response.status, expected, `${name}: ${JSON.stringify(result)}`);
    if (expected === 200) assert(!result.errors, `${name} returned errors`);
    return result.data;
  }
  async login(email, password, accepted = true) {
    const csrf = await (await this.request('/api/auth/csrf')).json();
    const response = await this.request('/api/auth/callback/credentials', { method: 'POST', body: new URLSearchParams({ csrfToken: csrf.csrfToken, email, password, json: 'true', callbackUrl: base + '/home' }) });
    const result = await response.json();
    if (!accepted) { assert(result.url?.includes('error='), 'Incorrect password must be rejected'); return; }
    assert.equal(response.status, 200);
    assert(!result.url?.includes('error='), 'Correct credentials must sign in');
    const session = await (await this.request('/api/auth/session')).json();
    assert(session.user?.id, 'Session must identify the registered user');
    return session.user;
  }
}

const guest = new Client();
const health = await guest.request('/api/health');
assert.equal(health.status, 200);
assert.deepEqual(await health.json(), { status: 'ok' });
for (const path of ['/home', '/find', '/find?source=GROUPS', '/topics', '/cities', '/signup', '/login', '/about']) {
  const response = await guest.request(path);
  assert.equal(response.status, 200, path);
  const html = await response.text();
  assert(!/wlfjck|484670701|316287001|scrypt\$|passwordHash/.test(html), `${path} must not expose prototype data or hashes`);
}
for (const path of ['/account', '/groups', '/start', '/messages', '/your-events']) {
  const response = await guest.request(path);
  assert([302, 307].includes(response.status), `${path} requires login`);
}
for (const path of ['/not-a-real-community', '/missing/events/missing', '/meetup-pro', '/subscription/checkout/member-plus', '/graphql/playground']) {
  assert.equal((await guest.request(path)).status, 404, path);
}
assert.equal((await guest.request('/home')).headers.get('x-content-type-options'), 'nosniff');
assert.equal((await guest.request('/home')).headers.get('x-frame-options'), 'DENY');
console.log('PASS public pages, empty states, strict 404s, protected pages and response headers');

const suffix = randomUUID();
const password = randomBytes(18).toString('hex');
async function account(name) {
  const client = new Client();
  const email = `${name}-${suffix}@example.test`;
  const response = await client.request('/api/auth/register', { method: 'POST', body: { name: `Workflow ${name}`, email, password, city: 'Portland' } });
  assert.equal(response.status, 201, JSON.stringify(await response.clone().json()));
  const created = await response.json();
  await client.login(email, 'an incorrect password', false);
  const user = await client.login(email, password);
  assert.equal(user.memberId, created.user.memberId);
  return { client, email, user };
}
const organizer = await account('Organizer');
const member = await account('Member');
const visitor = await account('Visitor');
assert.notEqual(organizer.user.id, member.user.id);
await guest.api('saveGroupDraft', {}, 401);
const foreign = await member.client.request('/gql2', { method: 'POST', origin: 'https://untrusted.example', body: { operationName: 'getSelf' } });
assert.equal(foreign.status, 403);
await member.client.api('updateAccountSettings', { isMeetupPlus: true }, 400);
await member.client.api('updateAccountSettings', { email: 'other@example.test' }, 400);
await member.client.api('inventedOperation', {}, 400);
for (const operation of ['subscribeMeetupPlus', 'donateToGroup', 'addPaymentMethod', 'createOAuthApp']) await member.client.api(operation, {}, 503);
console.log('PASS real registration, distinct sessions, password verification, same-origin protection and unavailable-service errors');

const draft = (await organizer.client.api('saveGroupDraft', { name: 'Workflow Community', city: 'Portland', state: 'OR', description: 'A real workflow test community for exercising publication, membership, and free events.', isPrivate: false })).saveGroupDraft.group;
await member.client.api('completeGroupCreation', { groupId: draft.id }, 403);
const group = (await organizer.client.api('completeGroupCreation', { groupId: draft.id })).completeGroupCreation.group;
assert.equal(group.membersCount, 1);
assert.equal(group.rating, 0);
assert.equal(group.ratingsCount, 0);
assert.equal((await guest.request('/' + group.urlname)).status, 200);
const eventInput = {
  groupId: group.id, title: 'Workflow Gathering', description: 'A real persisted event used only in an isolated end-to-end test.',
  dateTime: new Date(Date.now() + 86400000).toISOString(),
  endTime: new Date(Date.now() + 90000000).toISOString(),
  timezone: 'America/Los_Angeles', eventType: 'IN_PERSON', venueName: 'Community hall', venueAddress: '12 Main Street', venueCity: 'Portland', maxTickets: 2,
};
await member.client.api('createEvent', eventInput, 403);
const event = (await organizer.client.api('createEvent', eventInput)).createEvent.event;
const eventPath = `/${group.urlname}/events/${event.eventId}`;
assert.equal((await guest.request(eventPath)).status, 200);
await member.client.api('rsvpToEvent', { eventId: event.eventId, status: 'YES' });
await visitor.client.api('rsvpToEvent', { eventId: event.eventId, status: 'YES' });
await organizer.client.api('rsvpToEvent', { eventId: event.eventId, status: 'YES' }, 409);
await member.client.api('rsvpToEvent', { eventId: event.eventId, status: 'NO' });
await organizer.client.api('rsvpToEvent', { eventId: event.eventId, status: 'YES' });
await member.client.api('saveEvent', { eventId: event.eventId });
assert((await (await member.client.request('/your-events?type=saved')).text()).includes(event.title));
await member.client.api('unsaveEvent', { eventId: event.eventId });
await organizer.client.api('leaveGroup', { groupId: group.id }, 409);
await member.client.api('createDiscussion', { groupId: group.id, title: 'A thoughtful hello', body: 'This is a real community conversation.' });
await member.client.api('addGroupPhoto', { groupId: group.id, url: 'https://example.test/community.jpg', caption: 'A shared moment' });
await member.client.api('submitReport', { targetType: 'EVENT', targetId: event.eventId, reason: 'A workflow test report', details: 'Stored for the operator, not a fake success.' });
console.log('PASS free publication, organizer ownership, capacity limits, RSVP cancellation, saves, discussions, photos and reports');

await organizer.client.api('saveGroupDraft', { name: 'Workflow Private Circle', city: 'Portland', description: 'A private community for testing genuine membership requests and access boundaries.', isPrivate: true });
const privateGroup = (await organizer.client.api('completeGroupCreation')).completeGroupCreation.group;
const request = (await member.client.api('joinGroup', { groupId: privateGroup.id })).joinGroup.membership;
assert.equal(request.status, 'PENDING');
await visitor.client.api('reviewMembershipRequest', { groupId: privateGroup.id, membershipId: request.id, approve: true }, 403);
await organizer.client.api('reviewMembershipRequest', { groupId: privateGroup.id, membershipId: request.id, approve: true });
await member.client.api('createDiscussion', { groupId: privateGroup.id, title: 'Private topic', body: 'This text must not reach visitors.' });
const privateHtml = await (await guest.request(`/${privateGroup.urlname}/discussions`)).text();
assert(!privateHtml.includes('This text must not reach visitors.'));
const online = (await organizer.client.api('createEvent', { ...eventInput, groupId: privateGroup.id, title: 'Private online gathering', eventType: 'ONLINE', onlineUrl: 'https://meet.example.test/private-room' })).createEvent.event;
const onlinePath = `/${privateGroup.urlname}/events/${online.eventId}`;
assert.equal((await guest.request(onlinePath)).status, 404);
assert.equal((await member.client.request(onlinePath)).status, 200);
assert(!(await (await member.client.request(onlinePath)).text()).includes('https://meet.example.test/private-room'));
await member.client.api('rsvpToEvent', { eventId: online.eventId, status: 'YES' });
assert((await (await member.client.request(onlinePath)).text()).includes('https://meet.example.test/private-room'));
await visitor.client.api('createDiscussion', { groupId: privateGroup.id, title: 'Not allowed', body: 'Blocked' }, 403);
console.log('PASS private membership approval, group access boundaries and attendee-only meeting links');

await member.client.api('updateAccountSettings', { whoCanContact: 'NOBODY', showGroups: false, showInterests: false });
await visitor.client.api('sendMessage', { receiverId: member.user.id, body: 'Must not be delivered' }, 403);
await member.client.api('updateAccountSettings', { whoCanContact: 'SHARED_GROUPS' });
await visitor.client.api('sendMessage', { receiverId: member.user.id, body: 'A real hello from our community' });
assert((await (await member.client.request('/messages')).text()).includes('A real hello from our community'));
const profile = await (await guest.request('/members/' + member.user.memberId)).text();
assert(!profile.includes(member.email));
assert(!profile.includes(group.urlname));
await visitor.client.api('cancelEvent', { eventId: event.eventId }, 403);
await organizer.client.api('cancelEvent', { eventId: event.eventId });
await member.client.api('rsvpToEvent', { eventId: event.eventId, status: 'YES' }, 409);
const notices = await (await visitor.client.request('/notifications')).text();
assert(notices.includes(event.title), 'Real event actions should produce in-app updates');
await visitor.client.api('changePassword', { currentPassword: 'incorrect password', newPassword: password + 'new' }, 400);
await visitor.client.api('changePassword', { currentPassword: password, newPassword: password + 'new' });
await visitor.client.api('getSelf', {}, 401);
const replacement = new Client();
await replacement.login(visitor.email, password, false);
await replacement.login(visitor.email, password + 'new');
console.log('PASS persisted privacy, real messages, in-app updates, event cancellation and password-session revocation');

await member.client.api('saveEvent', { eventId: online.eventId });
await member.client.api('leaveGroup', { groupId: privateGroup.id });
assert.equal((await member.client.request(onlinePath)).status, 404);
assert(!(await (await member.client.request('/your-events?type=saved')).text()).includes(online.title));
assert(!(await (await member.client.request('/your-events')).text()).includes(online.title));
console.log('PASS leaving a private community removes private event access and list visibility');

assert.equal((await guest.request('/api/auth/register', { method: 'POST', body: { name: 'Duplicate', email: organizer.email, password } })).status, 409);
assert.equal((await guest.request('/api/auth/register', { method: 'POST', body: { name: 'Invalid', email: 'bad', password: 'short' } })).status, 400);
assert.equal((await guest.request('/api/auth/register', { method: 'POST', body: { name: 'Limited', email: 'limited@example.test', password } })).status, 429);
console.log('PASS duplicate/invalid signup and persistent registration throttling');
console.log('All product integration checks passed. Test activity exists only in the disposable database.');
