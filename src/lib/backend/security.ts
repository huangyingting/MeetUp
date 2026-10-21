import { randomBytes, scrypt as nodeScrypt, timingSafeEqual } from 'node:crypto';
const KEY_LENGTH = 64;
const SCRYPT_OPTIONS = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const DUMMY_HASH = `scrypt$16384$8$1$${'00'.repeat(16)}$${'00'.repeat(KEY_LENGTH)}`;

function scrypt(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    nodeScrypt(password, salt, KEY_LENGTH, SCRYPT_OPTIONS, (error, hash) => error ? reject(error) : resolve(hash));
  });
}

export class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, message: string, code = 'BAD_REQUEST') {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function text(value: unknown, field: string, min = 1, max = 200): string {
  if (typeof value !== 'string' || value.trim().length < min || value.trim().length > max) {
    throw new ApiError(400, `${field} must be between ${min} and ${max} characters`);
  }
  return value.trim();
}

export function emailAddress(value: unknown): string {
  const email = text(value, 'Email', 3, 254).toLowerCase();
  if (!/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/.test(email)) throw new ApiError(400, 'Enter a valid email address');
  return email;
}

export function passwordInput(value: unknown): string {
  if (typeof value !== 'string' || value.length < 12 || value.length > 128) {
    throw new ApiError(400, 'Password must be between 12 and 128 characters');
  }
  return value;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const hash = await scrypt(password, salt);
  return `scrypt$16384$8$1$${salt}$${hash.toString('hex')}`;
}

export async function verifyPassword(password: string, encoded: string | null | undefined): Promise<boolean> {
  const valid = typeof encoded === 'string' && /^scrypt\$16384\$8\$1\$[a-f0-9]{32}\$[a-f0-9]{128}$/.test(encoded);
  const parts = (valid ? encoded : DUMMY_HASH).split('$');
  const hash = await scrypt(password.slice(0, 128), parts[4]);
  const matches = timingSafeEqual(hash, Buffer.from(parts[5], 'hex'));
  return valid && matches && password.length <= 128;
}

export function sameOrigin(
  headers: { origin?: string; host?: string; 'sec-fetch-site'?: string },
  configuredUrl = process.env.NEXTAUTH_URL,
  production = process.env.NODE_ENV === 'production',
): void {
  if (headers['sec-fetch-site'] === 'cross-site') throw new ApiError(403, 'Cross-site requests are not allowed', 'FORBIDDEN');
  let expected: string;
  try {
    if (configuredUrl) expected = new URL(configuredUrl).origin;
    else {
      if (production || !headers.host || !/^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/.test(headers.host)) {
        throw new Error('NEXTAUTH_URL is required');
      }
      expected = `http://${headers.host}`;
    }
  } catch {
    throw new ApiError(503, 'Application origin is not configured', 'SERVICE_UNAVAILABLE');
  }
  if (!headers.origin || headers.origin !== expected) throw new ApiError(403, 'A same-origin request is required', 'FORBIDDEN');
}

export function integer(value: unknown, field: string, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < min || value > max) {
    throw new ApiError(400, `${field} must be an integer between ${min} and ${max}`);
  }
  return value;
}

export function webUrl(value: unknown, field: string): string {
  const valueString = text(value, field, 1, 2048);
  try {
    const url = new URL(valueString);
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) throw new Error('Invalid URL');
    return url.href;
  } catch {
    throw new ApiError(400, `${field} must be an HTTP(S) URL`);
  }
}

export function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new ApiError(400, 'Expected an object');
  return value as Record<string, unknown>;
}
