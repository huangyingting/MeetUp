# Meetup Full-Feature-Parity Clone (Next.js + NextAuth + Prisma)

A full-feature-parity implementation of Meetup (`https://www.meetup.com`) built with **Next.js 14 (Pages Router)**, **NextAuth**, **Prisma ORM**, and **Tailwind CSS** using Meetup's **Design System 2 (`ds2-*`)** tokens, typography, and layout architecture.

Detailed feature specifications, GraphQL operation schemas, and 141 reference screenshots are documented in [`MEETUP_FEATURE_ARCHITECTURE_DESIGN_REPORT.md`](./MEETUP_FEATURE_ARCHITECTURE_DESIGN_REPORT.md).

---

## Dual-Database Architecture (SQLite Local Dev + PostgreSQL Production)

This repository includes an automatic Prisma schema selector (`scripts/select-prisma-schema.mjs`) and two dedicated schema files:
- **Local Development (`sqlite`)**: `prisma/schema.sqlite.prisma` -> `DATABASE_URL="file:./dev.db"`
- **Production (`postgresql`)**: `prisma/schema.postgres.prisma` -> `POSTGRES_DATABASE_URL="postgresql://..."`

### Quick Start (Local Development with SQLite)

```bash
# 1. Install dependencies
npm install

# 2. Configure SQLite schema, push 25 tables, and seed realistic Meetup data
npm run db:setup

# 3. Start development server on http://localhost:3000
npm run dev
```

### Production Deployment (PostgreSQL)

```bash
# Switch Prisma provider to PostgreSQL and generate client
export POSTGRES_DATABASE_URL="postgresql://user:password@host:5432/meetup_prod?schema=public"
npm run build:prod
npm run start
```

---

## Implemented Feature Surface

1. **Global Header, Search Typeaheads & Design System 2 (`ds2-*`)**:
   - Coral logo hover morph, sticky compact search bar, keyword & location autocomplete dropdowns, stateful `Start a new group` / `Finish your group` CTA, `Try Meetup+` modal, quick icons (`Connections`, `Messages`, `Notifications`, `Your Events`, `Your Groups`), and profile menu.
   - Footer with Sitemap, Meetup Pro, Apps, and OneTrust Cookie Preferences Center modal.
2. **14-Step Welcome Onboarding Wizard (`/welcome/[...step]`)**:
   - `intent`, `organizer-intro-1..3`, `goal` (+ custom goal chip), `people`, `hangout`, `interests` (min 3 topics), `age` (DOB validation), `gender`, `sms-number`, `whatsapp-number`, `intro-paywall` (Meetup+ 7-day trial toggle), and `groups`.
3. **Home Dashboard (`/home`) & Your Events (`/your-events`)**:
   - Personalized "Your next event" highlight card, interactive horizontal date strip, `All` / `From your groups` / `Saved` filter pills, bookmark/save toggles, HTML5 Canvas printable Flyer Studio (`ShareModal`), and `Add to calendar` (`.ics`, Google, Outlook, Yahoo).
4. **Search & Discovery (`/find`, `/find/online-events`, `/topics`, `/cities`)**:
   - `Events` vs `Groups` switcher, `RevampedFilterButtonTime` (with `Custom` date range), `RevampedFilterButtonAttendeeCount`, `RevampedFilterButtonVenue`, `RevampedFilterButtonDistance`, `Sort by`, `Reset filters`, and 20+ horizontal category pills.
5. **Event Detail & Complete RSVP Workflows (`/[groupUrlname]/events/[eventId]` & `/attendees`)**:
   - In-person guest count (`0`, `+1`, `+2`) RSVP modal, Online Meetup Pro email-sharing RSVP modal, Post-RSVP confirmation modal (`"Got Plans!"`), sticky bottom `"You are going!"` bar, `Read more` description toggle, `Report event` modal, and searchable/sortable Attendees Roster with Meetup+ upsell.
6. **Group Detail Hub (`/[groupUrlname]/*`) & 6-Step `/start` Wizard**:
   - `About`, `Events` (`Upcoming`, `Past`, `Calendar`), `Members` (`All members`, `Leadership team`), `Photos` (`Add photos` modal & albums), `Discussions` (composer, comments, likes), `Reviews` (`feedback-overview`), `Manage membership` dropdown, and `Donate` Pledge fundraising modal.
   - `/start` 6-step group creation wizard with **`Generate Description with AI`** and Organizer Subscription Checkout (`/subscription/checkout/core/organizer`).
7. **Profiles, Social, 15 Account/Payment Settings & GraphiQL Playground**:
   - Member Profile (`/members/[memberId]`), Group Membership Details (`/members/[memberId]/group/[groupId]`), Connections (`/friends`), Messages (`/messages`), Notifications (`/notifications`), 15 `/account/*` & `/payments/*` pages, `/meetup-pro` calculator, and interactive GraphiQL IDE (`/graphql/playground`) backed by `/gql2`.
