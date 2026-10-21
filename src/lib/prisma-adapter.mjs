import path from 'node:path';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaPg } from '@prisma/adapter-pg';

export function getDatabaseUrl() {
  const url = process.env.POSTGRES_DATABASE_URL || process.env.DATABASE_URL;
  if (url?.startsWith('file:')) {
    const filename = url.slice('file:'.length);
    const databasePath = path.isAbsolute(filename)
      ? filename
      : path.resolve(process.cwd(), 'prisma', filename);
    return `file:${databasePath}`;
  }
  return url;
}

export function createPrismaAdapter() {
  const url = getDatabaseUrl();
  if (!url) {
    throw new Error('Set DATABASE_URL or POSTGRES_DATABASE_URL before connecting to Prisma.');
  }
  if (url.startsWith('postgresql:') || url.startsWith('postgres:')) {
    return new PrismaPg({ connectionString: url, connectionTimeoutMillis: 5000 });
  }
  if (url.startsWith('file:')) {
    return new PrismaBetterSqlite3(
      { url },
      { timestampFormat: 'unixepoch-ms' },
    );
  }
  throw new Error('Unsupported database URL: use SQLite (file:) or PostgreSQL.');
}
