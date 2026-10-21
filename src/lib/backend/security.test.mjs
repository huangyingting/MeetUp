import assert from 'node:assert/strict';
import test from 'node:test';
import { registerHooks } from 'node:module';
import { existsSync } from 'node:fs';

registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('.') && context.parentURL?.includes('/src/lib/backend/')) {
      const url = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(url)) return { url: url.href, shortCircuit: true };
    }
    return next(specifier, context);
  },
});
const { ApiError, emailAddress, hashPassword, integer, passwordInput, record, sameOrigin, verifyPassword, webUrl } = await import('./security.ts');
const { consumeRateLimit } = await import('./rate-limit.ts');

test('password hashes are salted, expensive, and only accept the original password', async () => {
  const password = '  a secure password  ';
  const first = await hashPassword(password);
  const second = await hashPassword(password);
  assert.notEqual(first, second);
  assert.match(first, /^scrypt\$16384\$8\$1\$/);
  assert.equal(await verifyPassword(password, first), true);
  assert.equal(await verifyPassword(password.trim(), first), false);
  assert.equal(await verifyPassword('wrong password', first), false);
  for (const value of [null, '', 'plaintext-password', 'scrypt$1$1$1$bad$hash']) {
    assert.equal(await verifyPassword(password, value), false);
  }
});

test('registration and mutation inputs reject malformed data', () => {
  assert.equal(emailAddress('  A@Example.com '), 'a@example.com');
  for (const value of ['', 'no-at-sign', 'a @b.com', 'person@example.com(other)', 'Person<person@example.com>', 'a@example.com,b', 'a@-example.com', null, []]) assert.throws(() => emailAddress(value), ApiError);
  assert.equal(passwordInput('abcdefghijkl'), 'abcdefghijkl');
  for (const value of ['short', 'a'.repeat(129), null]) assert.throws(() => passwordInput(value), ApiError);
  for (const value of [-1, 1.2, '3', null, Infinity]) assert.throws(() => integer(value, 'Guests', 0, 10), ApiError);
  for (const value of [null, [], 'object']) assert.throws(() => record(value), ApiError);
  for (const value of ['javascript:alert(1)', 'data:text/html,hello', 'https://user:secret@example.com']) assert.throws(() => webUrl(value, 'URL'), ApiError);
  assert.equal(webUrl('https://example.com/a', 'URL'), 'https://example.com/a');
});

test('browser POST origin is configured, exact, and never uses forwarded host', () => {
  const origin = 'https://meetup.example';
  sameOrigin({ origin, host: 'malicious.example' }, origin, true);
  for (const headers of [{ origin: 'https://evil.example' }, {}, { origin: 'null' }, { origin, 'sec-fetch-site': 'cross-site' }]) {
    assert.throws(() => sameOrigin(headers, origin, true), ApiError);
  }
  assert.throws(() => sameOrigin({ origin, host: 'meetup.example' }, '', true), /not configured/);
  assert.throws(() => sameOrigin({ origin: 'http://evil.example', host: 'evil.example' }, '', false), /not configured/);
  sameOrigin({ origin: 'http://localhost:3000', host: 'localhost:3000' }, '', false);
});

test('persistent limiter increments atomically, hashes identities, and resets expired windows', async () => {
  const rows = new Map();
  const store = {
    async $transaction(callback, options) {
      assert.equal(options.isolationLevel, 'Serializable');
      return callback({
        apiRateLimit: {
          async updateMany({ where, data }) {
            const old = rows.get(where.id);
            if (old && old.resetAt <= where.resetAt.lte) rows.set(where.id, { ...old, ...data });
          },
          async upsert({ where, create, update }) {
            assert.match(where.id, /^[a-f0-9]{64}$/);
            const old = rows.get(where.id);
            const row = old ? { ...old, count: old.count + update.count.increment } : create;
            rows.set(where.id, row);
            return row;
          },
        },
      });
    },
  };
  const now = new Date('2026-01-01T00:00:00Z');
  await consumeRateLimit(store, 'email:private@example.com', 2, 1000, now);
  await consumeRateLimit(store, 'email:private@example.com', 2, 1000, now);
  await assert.rejects(consumeRateLimit(store, 'email:private@example.com', 2, 1000, now), { status: 429 });
  await consumeRateLimit(store, 'email:private@example.com', 2, 1000, new Date(now.getTime() + 1000));
  assert.equal([...rows.values()][0].count, 1);
});

test('limiter retries transaction conflicts and never fails open on storage errors', async () => {
  let attempts = 0;
  const store = {
    async $transaction() {
      attempts++;
      if (attempts < 3) throw { code: 'P2034' };
      return { count: 1, resetAt: new Date() };
    },
  };
  await consumeRateLimit(store, 'test', 2, 1000);
  assert.equal(attempts, 3);
  await assert.rejects(consumeRateLimit({ $transaction() { throw new Error('Database unavailable'); } }, 'test', 2, 1000), /Database unavailable/);
});
