import assert from 'node:assert/strict';
import net from 'node:net';
import { spawn, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { once } from 'node:events';
import { randomBytes, createHash } from 'node:crypto';
import { mkdtemp, rm, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { openBrowser } from './browser-session.mjs';
import { verifyCustomControls } from './custom-controls-browser.mjs';

const directory = await mkdtemp(path.join(tmpdir(), 'meetup-services-integration-'));
const database = `file:${path.join(directory, 'services.db')}`;
const messages = [];
const sockets = new Set();
let rejectMail = false;
const smtp = net.createServer(socket => {
  sockets.add(socket);
  socket.on('close', () => sockets.delete(socket));
  socket.on('error', () => {});
  socket.write('220 localhost integration SMTP\r\n');
  let buffer = '';
  let data = null;
  socket.on('data', chunk => {
    buffer += chunk.toString();
    let index;
    while ((index = buffer.indexOf('\r\n')) >= 0) {
      const line = buffer.slice(0, index);
      buffer = buffer.slice(index + 2);
      if (data !== null) {
        if (line === '.') { messages.push(data); data = null; socket.write('250 Message accepted\r\n'); }
        else data += line.replace(/^\.\./, '.') + '\r\n';
      } else if (/^(EHLO|HELO)/i.test(line)) socket.write('250-localhost\r\n250 SIZE 10485760\r\n');
      else if (/^MAIL FROM:/i.test(line)) socket.write('250 OK\r\n');
      else if (/^RCPT TO:/i.test(line)) socket.write(rejectMail ? '550 Recipient rejected\r\n' : '250 OK\r\n');
      else if (/^DATA$/i.test(line)) { data = ''; socket.write('354 End with a dot\r\n'); }
      else if (/^QUIT$/i.test(line)) socket.end('221 Goodbye\r\n');
      else socket.write('250 OK\r\n');
    }
  });
});
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const freePort = async () => {
  const listener = net.createServer();
  listener.listen(0, '127.0.0.1');
  await once(listener, 'listening');
  const port = listener.address().port;
  await new Promise(resolve => listener.close(resolve));
  return port;
};
let app;
let db;
let browser;
let appOutput = '';
try {
  await readFile('.next/BUILD_ID');
  smtp.listen(0, '127.0.0.1');
  await once(smtp, 'listening');
  const port = await freePort();
  const base = `http://127.0.0.1:${port}`;
  const environment = {
    ...process.env, DATABASE_URL: database, POSTGRES_DATABASE_URL: '',
    NEXTAUTH_URL: base, NEXTAUTH_SECRET: randomBytes(48).toString('hex'),
    EMAIL_SERVER: `smtp://127.0.0.1:${smtp.address().port}`,
    EMAIL_FROM: 'Meetup <accounts@example.test>',
    UPLOAD_DIRECTORY: path.join(directory, 'uploads'),
  };
  await promisify(execFile)(process.execPath, ['node_modules/prisma/build/index.js', 'migrate', 'deploy'], { env: environment });
  db = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: database }, { timestampFormat: 'unixepoch-ms' }), omit: { user: { passwordHash: true } } });
  assert.equal(await db.user.count(), 0, 'Only a newly created isolated database may be used');
  app = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--port', String(port), '--hostname', '127.0.0.1'], { env: environment, stdio: ['ignore', 'pipe', 'pipe'] });
  for (const stream of [app.stdout, app.stderr]) stream.on('data', chunk => { appOutput = (appOutput + chunk.toString()).slice(-32_000); });
  let ready = false;
  for (let attempt = 0; attempt < 150; attempt++) {
    if (app.exitCode !== null) throw new Error('Fixture application stopped: ' + appOutput);
    try { ready = (await fetch(base + '/api/health')).ok; } catch (error) { if (!(error instanceof TypeError)) throw error; }
    if (ready) break;
    await pause(100);
  }
  assert(ready, 'Fixture server must become ready: ' + appOutput);
  browser = await openBrowser(directory);
  class Client {
    cookies = new Map();
    async request(route, { method = 'GET', body, type = 'application/json', origin = base } = {}) {
      const response = await fetch(base + route, {
        method, redirect: 'manual',
        headers: { Origin: origin, Cookie: [...this.cookies].map(([key, value]) => `${key}=${value}`).join('; '), ...(body ? { 'Content-Type': type } : {}) },
        body: body instanceof Buffer || typeof body === 'string' ? body : body ? JSON.stringify(body) : undefined,
      });
      for (const cookie of response.headers.getSetCookie()) {
        const entry = cookie.split(';')[0];
        const split = entry.indexOf('=');
        this.cookies.set(entry.slice(0, split), entry.slice(split + 1));
      }
      return response;
    }
    async action(body, expected = 200) {
      const response = await this.request('/api/auth/account', { method: 'POST', body });
      const result = await response.json();
      assert.equal(response.status, expected, JSON.stringify(result));
      return result;
    }
    async login(email, password, accepted = true) {
      const csrf = await (await this.request('/api/auth/csrf')).json();
      const body = new URLSearchParams({ csrfToken: csrf.csrfToken, email, password, json: 'true', callbackUrl: base + '/home' }).toString();
      const result = await (await this.request('/api/auth/callback/credentials', { method: 'POST', body, type: 'application/x-www-form-urlencoded' })).json();
      assert.equal(Boolean(result.url?.includes('error=')), !accepted, 'Credential policy must match verification and password state');
      return (await this.request('/api/auth/session')).json();
    }
    async api(operationName, input = {}) {
      const response = await this.request('/gql2', { method: 'POST', body: { operationName, variables: { input } } });
      const result = await response.json();
      assert.equal(response.status, 200, JSON.stringify(result));
      return result.data;
    }
  }
  const guest = new Client();
  const account = new Client();
  const email = 'owner@example.test';
  const password = randomBytes(18).toString('hex');
  const tokenFromMail = purpose => {
    const mail = messages.at(-1).replace(/=\r\n/g, '').replace(/=3D/g, '=');
    const token = mail.match(new RegExp(`/${purpose}#token=([a-f0-9]{64})`))?.[1];
    assert(token, 'A real SMTP message must contain the action link');
    return token;
  };
  const registration = await account.request('/api/auth/register', { method: 'POST', body: { name: 'Service Owner', email, password } });
  assert.equal(registration.status, 201);
  assert.equal((await registration.json()).verificationRequired, true);
  assert.equal(messages.length, 1);
  await account.login(email, password, false);
  const verificationToken = tokenFromMail('verify-email');
  const stored = await db.verificationToken.findFirst();
  assert.equal(stored.token, createHash('sha256').update(verificationToken).digest('hex'));
  assert.equal((await guest.request('/verify-email')).status, 200);
  assert.equal(await db.verificationToken.count(), 1, 'Opening a page must not consume a confirmation link');
  await guest.action({ action: 'reset-password', token: verificationToken, password }, 400);
  if (browser) {
    await browser.go(`${base}/verify-email#token=${verificationToken}`, 'form');
    await browser.wait("location.hash === ''");
    assert.equal(await db.verificationToken.count(), 1);
    await browser.click('Verify my email');
    await browser.wait("document.querySelector('[role=\"status\"]')?.textContent.includes('Email verified')");
  } else await guest.action({ action: 'verify-email', token: verificationToken });
  await guest.action({ action: 'verify-email', token: verificationToken }, 400);
  const session = await account.login(email, password);
  assert(session.user?.id);
  console.log('PASS actual SMTP delivery, verification gating, hashed tokens and single-use confirmation');

  const groupDraft = (await account.api('saveGroupDraft', { name: 'Service Community', city: 'Portland', description: 'An isolated group used to verify real storage and membership access.', isPrivate: false })).saveGroupDraft.group;
  const group = (await account.api('completeGroupCreation', { groupId: groupDraft.id })).completeGroupCreation.group;
  const insecurePhoto = await account.request('/gql2', { method: 'POST', body: { operationName: 'addGroupPhoto', variables: { input: { groupId: group.id, url: 'http://example.test/photo.jpg' } } } });
  assert.equal(insecurePhoto.status, 400, 'External photo links must not bypass the HTTPS image policy');
  const image = await sharp({ create: { width: 32, height: 24, channels: 3, background: '#204d3b' } }).withMetadata().png().toBuffer();
  const upload = (client, groupId, body = image, origin = base) => client.request(`/api/media?groupId=${groupId}&caption=Stored%20photo`, { method: 'POST', type: 'image/png', body, origin });
  assert.equal((await upload(guest, group.id)).status, 401);
  assert.equal((await upload(account, group.id, image, 'https://untrusted.example')).status, 403);
  assert.equal((await upload(account, group.id, Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'))).status, 400);
  assert.equal((await upload(account, group.id, Buffer.alloc(5 * 1024 * 1024 + 1))).status, 413);
  const uploaded = await upload(account, group.id);
  assert.equal(uploaded.status, 201, await uploaded.clone().text());
  const photo = (await uploaded.json()).photo;
  const publicImage = await guest.request(photo.url);
  assert.equal(publicImage.status, 200);
  assert.equal(publicImage.headers.get('content-type'), 'image/webp');
  const normalized = await sharp(Buffer.from(await publicImage.arrayBuffer())).metadata();
  assert.equal(normalized.exif, undefined);
  assert.equal(normalized.width, 32);
  assert.equal((await guest.request(photo.url, { method: 'HEAD' })).status, 200);
  assert((await (await account.request(`/${group.urlname}/photos`)).text()).includes(photo.url));
  await account.api('saveGroupDraft', { name: 'Private Service Community', city: 'Portland', description: 'Private images must remain protected even when someone knows the URL.', isPrivate: true });
  const privateGroup = (await account.api('completeGroupCreation')).completeGroupCreation.group;
  const privateUpload = await upload(account, privateGroup.id);
  assert.equal(privateUpload.status, 201);
  const privatePhoto = (await privateUpload.json()).photo;
  assert.equal((await guest.request(privatePhoto.url)).status, 404);
  assert.equal((await account.request(privatePhoto.url)).status, 200);
  const viewer = new Client();
  const viewerEmail = 'viewer@example.test';
  const viewerRegistration = await viewer.request('/api/auth/register', { method: 'POST', body: { name: 'Service Viewer', email: viewerEmail, password } });
  assert.equal(viewerRegistration.status, 201);
  await guest.action({ action: 'verify-email', token: tokenFromMail('verify-email') });
  await viewer.login(viewerEmail, password);
  assert.equal((await upload(viewer, group.id)).status, 403);
  assert.equal((await viewer.request(privatePhoto.url)).status, 404);
  const membership = (await viewer.api('joinGroup', { groupId: privateGroup.id })).joinGroup.membership;
  assert.equal((await viewer.request(privatePhoto.url)).status, 404);
  await account.api('reviewMembershipRequest', { groupId: privateGroup.id, membershipId: membership.id, approve: true });
  assert.equal((await viewer.request(privatePhoto.url)).status, 200);
  await viewer.api('leaveGroup', { groupId: privateGroup.id });
  assert.equal((await viewer.request(privatePhoto.url)).status, 404);
  if (browser) {
    await browser.command('Network.setCookies', { cookies: [...account.cookies].map(([name, value]) => ({ name, value, url: base + '/', httpOnly: true, secure: false, sameSite: 'Lax' })) });
    await browser.go(`${base}/${group.urlname}/photos`, '#photo-file');
    const fixtureImage = path.join(directory, 'browser-image.png');
    await writeFile(fixtureImage, image);
    const document = await browser.command('DOM.getDocument');
    const fileInput = await browser.command('DOM.querySelector', { nodeId: document.root.nodeId, selector: '#photo-file' });
    await browser.command('DOM.setFileInputFiles', { nodeId: fileInput.nodeId, files: [fixtureImage] });
    await browser.fill('#photo-caption', 'Browser photo upload');
    await browser.click('Share photo');
    await browser.wait("Boolean([...document.querySelectorAll('figcaption')].find(item => item.textContent === 'Browser photo upload'))");
    assert.equal(await db.photo.count({ where: { caption: 'Browser photo upload' } }), 1);
    assert(await browser.evaluate('document.documentElement.scrollWidth <= innerWidth'), 'Photo form must fit the mobile viewport');
    await verifyCustomControls({ browser, base, db, group, userId: session.user.id });
  }
  console.log('PASS actual image storage, metadata removal, file limits, origin/membership checks and private serving');

  const oldSession = new Client();
  oldSession.cookies = new Map(account.cookies);
  const mailCount = messages.length;
  await guest.action({ action: 'request-reset', email: 'missing@example.test' }, 202);
  assert.equal(messages.length, mailCount);
  await guest.action({ action: 'request-reset', email }, 202);
  const reset = tokenFromMail('reset-password');
  assert.equal((await guest.request('/reset-password')).status, 200);
  const replacement = randomBytes(18).toString('hex');
  await guest.action({ action: 'reset-password', token: reset, password: 'short' }, 400);
  if (browser) {
    await browser.go(`${base}/reset-password#token=${reset}`, '#access-password');
    await browser.fill('#access-password', replacement);
    await browser.fill('#access-confirmation', replacement);
    await browser.click('Reset password');
    await browser.wait("document.querySelector('[role=\"status\"]')?.textContent.includes('Password reset')");
    assert(await browser.evaluate("location.hash === ''"));
  } else await guest.action({ action: 'reset-password', token: reset, password: replacement });
  await guest.action({ action: 'reset-password', token: reset, password: replacement }, 400);
  const revoked = await (await oldSession.request('/api/auth/session')).json();
  assert(!revoked.user?.id, 'Recovery must revoke all old sessions');
  await new Client().login(email, password, false);
  await account.login(email, replacement);
  await guest.action({ action: 'request-reset', email }, 202);
  const expired = tokenFromMail('reset-password');
  await db.verificationToken.updateMany({ data: { expires: new Date(Date.now() - 1000) } });
  await guest.action({ action: 'reset-password', token: expired, password: replacement }, 400);
  rejectMail = true;
  await guest.action({ action: 'request-verification', email: 'missing@example.test' }, 202);
  const rejected = await guest.request('/api/auth/register', { method: 'POST', body: { name: 'Delivery Test', email: 'rejected@example.test', password } });
  assert.equal(rejected.status, 503);
  const undeliveredUser = await db.user.findUnique({ where: { email: 'rejected@example.test' } });
  assert.equal(await db.verificationToken.count({ where: { identifier: { startsWith: `verify:${undeliveredUser.id}:` } } }), 0);
  console.log('PASS recovery delivery, expiry/replay rejection, password/session revocation and explicit SMTP failure');
  if (browser) {
    rejectMail = false;
    await browser.command('Network.clearBrowserCookies');
    await browser.go(`${base}/signup`, '#name');
    await browser.fill('#name', 'Browser Member');
    await browser.fill('#email', 'browser@example.test');
    await browser.fill('#password', password);
    await browser.click('Create account');
    await browser.wait("document.querySelector('[role=\"status\"]')?.textContent.includes('Your account has been created')");
    await browser.go(`${base}/verify-email#token=${tokenFromMail('verify-email')}`, 'form');
    await browser.click('Verify my email');
    await browser.wait("document.querySelector('[role=\"status\"]')?.textContent.includes('Email verified')");
    await browser.go(`${base}/login`, '#email');
    await browser.fill('#email', 'browser@example.test');
    await browser.fill('#password', password);
    await browser.click('Log in');
    await browser.wait("location.pathname === '/home' && Boolean(document.querySelector('[aria-label=\"Open account menu\"]'))");
    assert.deepEqual(browser.errors, [], 'Browser workflows must not emit runtime or CSP errors');
    console.log('PASS mobile browser registration, email confirmation, recovery and actual file-upload forms');
  }
  console.log('All service checks passed using only an owned temporary database, SMTP fixture and upload directory.');
} catch (error) {
  console.error(appOutput);
  throw error;
} finally {
  await browser?.close();
  if (app && app.exitCode === null) {
    const stopped = once(app, 'exit');
    app.kill('SIGTERM');
    await stopped;
  }
  for (const socket of sockets) socket.destroy();
  if (smtp.listening) await new Promise(resolve => smtp.close(resolve));
  await db?.$disconnect();
  await rm(directory, { recursive: true, force: true });
}
