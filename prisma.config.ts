import 'dotenv/config';
import { defineConfig } from 'prisma/config';
import { getDatabaseUrl } from './src/lib/prisma-adapter.mjs';

const url = getDatabaseUrl();

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: url?.startsWith('postgres') ? 'prisma/migrations/postgresql' : 'prisma/migrations/sqlite',
    seed: 'node prisma/seed.mjs',
  },
  datasource: {
    url,
  },
});
