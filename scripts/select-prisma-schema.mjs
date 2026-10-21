import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const schemaPath = path.join(rootDir, 'prisma', 'schema.prisma');
const sqliteBackupPath = path.join(rootDir, 'prisma', 'schema.sqlite.prisma');
const postgresBackupPath = path.join(rootDir, 'prisma', 'schema.postgres.prisma');

const argProvider = process.argv[2];
const envUrl = process.env.POSTGRES_DATABASE_URL || process.env.DATABASE_URL || '';
const targetProvider =
  argProvider === 'postgresql' || argProvider === 'postgres'
    ? 'postgresql'
    : argProvider === 'sqlite'
      ? 'sqlite'
      : envUrl.startsWith('postgres')
        ? 'postgresql'
        : 'sqlite';

const baseSchema = fs.readFileSync(schemaPath, 'utf8');

const sqliteSchema = baseSchema.replace(
  /datasource db \{[\s\S]*?\}/,
  `datasource db {\n  provider = "sqlite"\n}`
);

const postgresSchema = baseSchema.replace(
  /datasource db \{[\s\S]*?\}/,
  `datasource db {\n  provider = "postgresql"\n}`
);

fs.writeFileSync(sqliteBackupPath, sqliteSchema, 'utf8');
fs.writeFileSync(postgresBackupPath, postgresSchema, 'utf8');
fs.writeFileSync(schemaPath, targetProvider === 'postgresql' ? postgresSchema : sqliteSchema, 'utf8');

console.log(`[Prisma Schema Selector] Active provider set to "${targetProvider}" in prisma/schema.prisma`);
