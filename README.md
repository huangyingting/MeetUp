# Meetup — a little more connection

A community and free-event product built with Next.js 16 (Pages Router),
NextAuth 4, and Prisma 7. The interface uses an original porcelain-and-evergreen
editorial design, with self-hosted **Mona Sans** and **JetBrains Mono**, the primary
typefaces used by [genisisiq.com](https://genisisiq.com). Font licenses are included
in `public/fonts/`; no third-party font requests are needed.

## What works

- Real account registration and password sign-in. Passwords are salted with scrypt;
  changing or recovering a password invalidates previously issued sessions.
- SMTP-backed email verification and password recovery with expiring, single-use
  links. Public deployments require verified email before sign-in.
- Public discovery with keyword, city, format, interest, and sort filters.
- Free community creation, saved drafts, membership, private communities, and
  organizer review of private membership requests.
- Organizer-created free events, capacity-aware RSVPs, cancellation, saved events,
  and calendar exports.
- Community conversations, photo uploads/links, member profiles, private messages, and
  real in-app updates. Profile visibility and message contact preferences persist.
- Same-origin POST protection, database-backed rate limits, ownership checks,
  bounded API bodies, explicit error responses, and a database readiness endpoint.

There are **no default accounts, sample events, fabricated ratings, or payment
records**. Seeding adds only reference interests and categories. It never deletes
user content.

Paid tickets, donations, subscriptions, mobile verification, OAuth app registration,
AI generation, and the old developer playground are deliberately unavailable.
Their pages are not advertised and return 404; unsupported API operations fail
explicitly rather than pretending a charge, entitlement, or integration succeeded.
Existing feature-parity reports and reference screenshots describe the historical
prototype, not the capabilities of this deployment.

## Run locally

Use **Node.js 24 LTS** (Node.js 22.18+ is also supported).

```bash
npm ci
cp .env.example .env
# Generate a secret and put it in NEXTAUTH_SECRET in .env:
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
npm run db:deploy
npm run db:seed
npm run dev
```

Open `http://localhost:3000` and create your own account. The empty states are
intentional: events and communities appear only when real members publish them.

`npm run db:setup` is a development-only schema-push alternative. If you previously
used `db:push` on a database whose schema already matches the initial migration,
baseline it once before using `db:deploy`:

```bash
npx prisma migrate resolve --applied 20261021000000_initial
```

Do not baseline a database that does not match the schema. Back up an existing
production database and review migration SQL before applying a deployment.

## Deploy

Configure environment variables in your deployment's secret manager:

| Variable | Purpose |
| --- | --- |
| `NEXTAUTH_URL` | Exact public origin, such as `https://community.example.org` |
| `NEXTAUTH_SECRET` | Unique random secret, at least 32 characters |
| `POSTGRES_DATABASE_URL` | PostgreSQL connection URL for a production deployment |
| `DATABASE_URL` | SQLite connection URL for local/single-instance use |
| `EMAIL_SERVER` | SMTP connection URL (`smtp://` with STARTTLS or `smtps://`) |
| `EMAIL_FROM` | Verified sender address, optionally `Meetup <accounts@example.org>` |
| `UPLOAD_DIRECTORY` | Private persistent storage directory for uploaded photos |

`POSTGRES_DATABASE_URL` takes precedence when set. Unset it for local SQLite use.
Relative SQLite URLs resolve inside `prisma/`, preserving the original database
location; an absolute `file:/.../community.db` URL can point to a persistent volume.

```bash
npm ci
npm run db:deploy
npm run db:seed
npm run build
npm start
```

`db:deploy` selects the matching schema, applies versioned migrations, and generates
the client. SQLite and PostgreSQL have separate migration histories. For future
schema changes, create and review migrations for both providers.

Serve the application behind an HTTPS reverse proxy and a process supervisor.
Use PostgreSQL for multiple application instances; never share a SQLite file
across hosts. Multiple instances must also share the same persistent upload
volume. Configure database/upload backups, restore drills, disk-space monitoring,
and log retention with your hosting provider. `GET /api/health` checks the database,
storage permissions, and required email configuration, returning a generic 503
on failure without disclosing connection details. Actual mail delivery is checked
by the delivery workflow, not on every health probe.

Authentication limits are persisted in the database and fail closed if storage is
unavailable. Client IP limits use the socket peer, **not untrusted forwarding
headers**. Behind a proxy, configure edge-level IP limits and account for shared
proxy addresses; the application's global/account limits remain active.
Run `npm run db:maintenance` daily in your scheduler to remove expired throttling
records and account links. It does not delete accounts, communities or media.

### Account email

Configure a real SMTP provider and its verified sender in `EMAIL_SERVER` and
`EMAIL_FROM`. Credentials must be URL-encoded and stored in your secret manager.
Remote SMTP requires authenticated TLS certificate validation and STARTTLS unless
using implicit TLS. There is no plaintext remote-delivery fallback.

Signup sends a verification email before allowing sign-in. `/verify-email` can
resend a link, and `/forgot-password` starts recovery. Verification links last
24 hours; recovery links last 30 minutes. Only token digests are stored, links
carry tokens in URL fragments (not server query logs), and confirmation requires
an explicit same-origin POST. Resetting a password also proves email ownership.
Delivery failures are reported rather than replaced with a simulated success.

Only loopback development without SMTP configured permits unverified signup.
Public URLs must use HTTPS and cannot bypass verification by omitting SMTP.
NextAuth 4's Nodemailer peer declaration is overridden to the patched 10.x
transport; its standard SMTP interface is covered by the real delivery suite.

### Photos and operations

Uploads accept JPEG, PNG and WebP up to 5 MB/20 megapixels. Images are decoded,
resized to a maximum of 2400 pixels and re-encoded as WebP, removing original
metadata. The private storage directory is never exposed as a static public
folder. Serving private-community photos checks current membership, including
after someone leaves. Back up this directory alongside its database records.
External HTTPS photo links remain available.

Reports are stored for the site operator. Operators must provide moderation,
an emergency-contact policy, an SMTP account, an HTTPS domain and hosting
operations; the application cannot provision these identities or staff itself.
There is no claim of a staffed response team, payment processing or regulatory
certification. The supported product is free communities and free events.

## Checks

```bash
npm test
npm run lint
npm run build
npm run test:services
# Also exercise the mobile browser forms when Chrome is installed:
CHROME_BINARY=/usr/bin/google-chrome npm run test:services
```

The integration checks must run against a **disposable, empty database** and its
own server, never a live deployment:

```bash
DATABASE_URL="file:/absolute/path/to/disposable.db" npm run db:deploy
DATABASE_URL="file:/absolute/path/to/disposable.db" npm run db:seed
DATABASE_URL="file:/absolute/path/to/disposable.db" \
  NEXTAUTH_URL="http://localhost:3001" npm start -- --port 3001
# In another terminal:
INTEGRATION_BASE_URL="http://localhost:3001" npm run test:integration
```

The smoke suite creates real accounts and activity in that disposable database.
Do not leave test data in a customer-facing database.

`test:services` independently creates and removes its own temporary SQLite
database, private media directory, loopback SMTP fixture and application server.
It verifies genuine delivery, verification/recovery and image access without
sending email externally or touching the application's database.
With `CHROME_BINARY` set, the same suite also exercises registration, verification,
password recovery and file upload through the actual mobile-width browser forms.
