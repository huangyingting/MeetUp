import Head from 'next/head';
import Link from 'next/link';
import type { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import { ArrowUpRight, Calendar } from 'lucide-react';
import Layout from '@/components/Layout';
import { prisma } from '@/lib/prisma';
import { getActiveUser } from '@/lib/auth-helper';
import { publicViewer } from '@/lib/presentation';

export default function YourEvents({ user, events, tab }: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return <Layout user={user}><Head><title>Your events | Meetup</title></Head><div className="shell-container py-12">
    <p className="eyebrow">Time for something real</p><div className="flex flex-wrap justify-between gap-5 items-end mt-4 mb-9"><h1 className="page-heading">Your next good plan.</h1><Link href="/find" className="button-secondary">Find an event <ArrowUpRight size={17} /></Link></div>
    <nav className="flex gap-6 border-b border-[var(--line)] mb-9" aria-label="Your event lists">{[['going', 'Going'], ['saved', 'Saved'], ['hosting', 'Hosting'], ['past', 'Past']].map(([id, label]) => <Link key={id} className={`py-4 border-b-2 text-sm ${tab === id ? 'font-semibold border-[var(--accent)]' : 'border-transparent text-[var(--muted)]'}`} aria-current={tab === id ? 'page' : undefined} href={`/your-events?type=${id}`}>{label}</Link>)}</nav>
    {events.length ? <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">{events.map(event => <Link className="surface p-7 hover:border-[var(--forest)] transition" key={event.id} href={`/${event.group.urlname}/events/${event.eventId}`}><p className="eyebrow">{new Date(event.dateTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: event.timezone })}</p><h2 className="text-2xl font-semibold my-4">{event.title}</h2><p className="text-sm text-[var(--muted)]">{event.group.name}</p><p className="text-sm text-[var(--muted)] mt-3">{event.eventType === 'ONLINE' ? 'Online' : event.venueName} · Free</p></Link>)}</div> : <div className="empty-state"><Calendar size={32} /><h2 className="text-2xl font-semibold">Space for a new experience.</h2><p>{tab === 'hosting' ? 'Create a community, then invite people to your first event.' : tab === 'saved' ? 'Save events that catch your eye. They will be waiting here.' : 'No events in this list yet. A good plan could be just around the corner.'}</p><Link href={tab === 'hosting' ? '/groups' : '/find'} className="button-primary">{tab === 'hosting' ? 'Your communities' : 'Explore events'}<ArrowUpRight size={17} /></Link></div>}
  </div></Layout>;
}

export const getServerSideProps = (async (ctx) => {
  const user = await getActiveUser(ctx.req, ctx.res);
  if (!user) return { redirect: { destination: '/login?callbackUrl=%2Fyour-events', permanent: false } };
  const tab = ['saved', 'hosting', 'past'].includes(String(ctx.query.type)) ? String(ctx.query.type) : 'going';
  const events = await prisma.event.findMany({
    where: {
      group: { isDraft: false, OR: [{ isPrivate: false }, { organizerId: user.id }, { memberships: { some: { userId: user.id, status: 'ACTIVE' } } }] },
      ...(tab === 'saved' ? { savedBy: { some: { userId: user.id } } }
        : tab === 'hosting' ? { hostId: user.id }
          : { rsvps: { some: { userId: user.id, status: 'YES' } }, status: tab === 'past' ? { in: ['UPCOMING', 'PAST'] } : 'UPCOMING', dateTime: tab === 'past' ? { lt: new Date() } : { gte: new Date() } }),
    },
    select: { id: true, eventId: true, title: true, dateTime: true, timezone: true, eventType: true, venueName: true, group: { select: { name: true, urlname: true } } },
    orderBy: { dateTime: tab === 'past' ? 'desc' : 'asc' }, take: 100,
  });
  return { props: { user: publicViewer(user), events: events.map(event => ({ ...event, dateTime: event.dateTime.toISOString() })), tab } };
}) satisfies GetServerSideProps;
