import assert from 'node:assert/strict';
import test from 'node:test';
import { registerHooks } from 'node:module';
import { existsSync } from 'node:fs';

const tokens = new Map();
const sent = [];
let recipientAccepted = true;
let transportOptions;
let account;
const db = {
  verificationToken: {
    async create({ data }) { tokens.set(data.token, data); return data; },
    async findUnique({ where }) { return tokens.get(where.token) || null; },
    async deleteMany({ where }) {
      let count = 0;
      for (const [key, value] of tokens) {
        if ((!where.token || key === where.token) && (!where.identifier || value.identifier === where.identifier) && (!where.expires || value.expires > where.expires.gt)) {
          tokens.delete(key); count++;
        }
      }
      return { count };
    },
  },
  user: {
    async findUnique({ where }) { return account?.id === where.id ? account : null; },
    async update({ data }) { account = { ...account, ...data }; return account; },
  },
  async $transaction(callback) { return callback(db); },
};
globalThis.__accountEmailDb = db;
globalThis.__accountEmailTransport = options => {
  transportOptions = options;
  return {
    async sendMail(mail) { sent.push(mail); return { accepted: recipientAccepted ? [mail.to] : [], rejected: recipientAccepted ? [] : [mail.to] }; },
    close() {},
  };
};
registerHooks({
  resolve(specifier, context, next) {
    if (specifier === '@/lib/prisma') return { url: 'data:text/javascript,export const prisma = globalThis.__accountEmailDb;', shortCircuit: true };
    if (specifier === 'nodemailer') return { url: 'data:text/javascript,export default {createTransport:globalThis.__accountEmailTransport};', shortCircuit: true };
    if (specifier.startsWith('.') && context.parentURL?.includes('/src/lib/backend/')) {
      const url = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(url)) return { url: url.href, shortCircuit: true };
    }
    return next(specifier, context);
  },
});
const { applicationOrigin, emailVerificationRequired, sendAccountEmail, consumeAccountToken, accountTokenDigest } = await import('./account-email.ts');
const { hashPassword, verifyPassword } = await import('./security.ts');
const tokenFromEmail = () => sent.at(-1).text.match(/#token=([a-f0-9]{64})/)[1];

test('public applications require HTTPS and verified email; loopback development alone may omit delivery', () => {
  process.env.NEXTAUTH_URL = 'http://localhost:3000';
  delete process.env.EMAIL_SERVER;
  delete process.env.EMAIL_FROM;
  assert.equal(emailVerificationRequired(), false);
  process.env.NEXTAUTH_URL = 'https://community.example.test';
  assert.equal(emailVerificationRequired(), true);
  assert.equal(applicationOrigin(), 'https://community.example.test');
  process.env.NEXTAUTH_URL = 'http://community.example.test';
  assert.throws(applicationOrigin, { status: 503 });
  process.env.NEXTAUTH_URL = 'https://community.example.test';
  process.env.EMAIL_SERVER = 'smtp://delivery.example.test:587';
  process.env.EMAIL_FROM = 'Meetup <accounts@example.test>';
});

test('verification stores only a digest and requires an explicit, single-use confirmation', async () => {
  account = { id: 'account-1', email: 'member@example.test', passwordHash: await hashPassword('the original strong password'), emailVerified: null };
  await sendAccountEmail(account, 'verify');
  const token = tokenFromEmail();
  assert(!tokens.has(token));
  assert(tokens.has(accountTokenDigest(token)));
  assert.equal(transportOptions.requireTLS, true);
  assert.equal(account.emailVerified, null);
  assert(sent.at(-1).text.includes('https://community.example.test/verify-email#token='));
  assert.equal(sent.at(-1).disableFileAccess, true);
  assert.equal(sent.at(-1).disableUrlAccess, true);
  await assert.rejects(consumeAccountToken(token, 'reset', 'a replacement strong password'), { status: 400 });
  await consumeAccountToken(token, 'verify');
  assert(account.emailVerified instanceof Date);
  await assert.rejects(consumeAccountToken(token, 'verify'), { status: 400 });
});

test('reset links rotate passwords, invalidate sibling links, and reject expired or stale credentials', async () => {
  await sendAccountEmail(account, 'reset');
  const first = tokenFromEmail();
  await sendAccountEmail(account, 'reset');
  const second = tokenFromEmail();
  await consumeAccountToken(first, 'reset', 'a newly chosen strong password');
  assert(await verifyPassword('a newly chosen strong password', account.passwordHash));
  assert(!await verifyPassword('the original strong password', account.passwordHash));
  await assert.rejects(consumeAccountToken(second, 'reset', 'another long password'), { status: 400 });
  await sendAccountEmail(account, 'reset');
  const expired = tokenFromEmail();
  tokens.get(accountTokenDigest(expired)).expires = new Date(Date.now() - 1000);
  await assert.rejects(consumeAccountToken(expired, 'reset', 'another long password'), { status: 400 });
  await sendAccountEmail(account, 'reset');
  const stale = tokenFromEmail();
  account.passwordHash = await hashPassword('password changed elsewhere');
  await assert.rejects(consumeAccountToken(stale, 'reset', 'another long password'), { status: 400 });
  await assert.rejects(consumeAccountToken('malformed', 'reset', 'another long password'), { status: 400 });
  await assert.rejects(consumeAccountToken('f'.repeat(64), 'reset'), { status: 400 });
});

test('mail rejection is explicit and removes only the undelivered token', async () => {
  const before = tokens.size;
  recipientAccepted = false;
  await assert.rejects(sendAccountEmail(account, 'reset'), { status: 503 });
  assert.equal(tokens.size, before);
});
