import Head from 'next/head';
import Link from 'next/link';
import type { GetServerSideProps } from 'next';
import { ArrowRight, ArrowUpRight, MapPin, Search } from 'lucide-react';
import Layout from '@/components/Layout';
import { EmptyDiscovery, EventCard, GroupCard, eventDate, type PublicEvent, type PublicGroup } from '@/components/DiscoveryCards';
import { prisma } from '@/lib/prisma';
import { getActiveUser } from '@/lib/auth-helper';

interface HomeProps {
  user: { name: string; memberId: string } | null;
  events: PublicEvent[];
  groups: PublicGroup[];
  initialSavedIds: string[];
  nextRsvp: PublicEvent | null;
}

export default function HomePage({ user, events, groups, initialSavedIds, nextRsvp }: HomeProps) {
  return <Layout user={user}>
    <Head><title>Meetup — Find your people. Make it happen.</title><meta name="description" content="Discover real events and communities around the things you love. Find your people, or bring them together by starting a group." /></Head>
    <div className="shell-container">
      <section className="home-hero" aria-labelledby="hero-heading">
        <div className="hero-copy"><p className="eyebrow">Less scrolling. More showing up.</p><h1 id="hero-heading" className="hero-title">Your people.<br />Your thing.<br /><em>Out there.</em></h1><p className="page-intro">A new interest. A familiar passion. A good reason to get together. Find the people who make it worth showing up.</p></div>
        <div className="hero-art" role="img" aria-label="Original orbital illustration celebrating the things that bring us together"><div className="orbit" /><div className="orbit orbit-two" /><div className="orbit orbit-three" /><span className="orbit-dot" /><div className="art-center">a little<br /><span>common ground.</span></div><span className="art-ticket">OPEN TO POSSIBILITY ↗</span><div className="art-note"><span>MEETUP / REAL CONNECTION</span><span>COME AS YOU ARE</span></div></div>
      </section>
      <section className="home-search" aria-label="Find your next event">
        <form action="/find" method="get" className="search-panel"><div className="search-field"><label htmlFor="home-keywords"><Search size={12} /> What moves you?</label><input id="home-keywords" name="keywords" placeholder="Try hiking, art, technology…" /></div><div className="search-field"><label htmlFor="home-location"><MapPin size={12} /> Where?</label><input id="home-location" name="location" placeholder="City or region" /></div><button type="submit" className="button-primary">Find your people <ArrowRight size={17} /></button></form>
        <div className="interest-links"><span className="metadata">FOLLOW YOUR CURIOSITY</span>{['Outdoors', 'Technology', 'Arts', 'Games'].map(interest => <Link key={interest} href={`/find?keywords=${encodeURIComponent(interest)}`}>{interest} ↗</Link>)}<Link href="/find?type=online">Online events ↗</Link></div>
      </section>
      {nextRsvp && <section className="next-event" aria-label="Your next event"><div><span className="eyebrow">On your calendar · You&apos;re going</span><h2>{nextRsvp.title}</h2><p className="metadata">{eventDate(nextRsvp)}</p></div><Link href={`/${nextRsvp.group.urlname}/events/${nextRsvp.eventId}`} className="button-secondary">View your next event <ArrowUpRight size={16} /></Link></section>}
      <section className="section-block" aria-labelledby="upcoming-heading"><div className="section-heading"><div><span className="eyebrow">Make a little space for something new</span><h2 id="upcoming-heading">Coming up next.</h2></div><Link href="/find" className="text-link">Explore events <ArrowUpRight size={17} /></Link></div>{events.length ? <div className="event-grid">{events.map(event => <EventCard key={event.id} event={event} authenticated={Boolean(user)} initiallySaved={initialSavedIds.includes(event.id)} />)}</div> : <EmptyDiscovery />}</section>
      {groups.length > 0 && <section className="section-block" aria-labelledby="groups-heading"><div className="section-heading"><div><span className="eyebrow">Find your common ground</span><h2 id="groups-heading">People with your kind of energy.</h2></div><Link href="/find?source=GROUPS" className="text-link">Explore groups <ArrowUpRight size={17} /></Link></div><div className="event-grid">{groups.map(group => <GroupCard key={group.id} group={group} />)}</div></section>}
      <section className="community-note"><div><span className="eyebrow">An idea is a good beginning</span><h2>You don&apos;t have to<br />find your community.<br /><span className="text-viridian">You can create it.</span></h2></div><div className="self-center"><p>A walking route. A book worth talking about. Something you&apos;re learning and want to share. Turn what matters to you into a place where people belong.</p><Link href="/start" className="text-link">Start a group, make it yours <ArrowUpRight size={18} /></Link></div></section>
    </div>
  </Layout>;
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const activeUser = await getActiveUser(ctx.req, ctx.res);
  const eventSelect = {
    id: true, eventId: true, title: true, dateTime: true, timezone: true, eventType: true,
    venueName: true, venueCity: true, coverImage: true, feeAmount: true, feeCurrency: true, maxTickets: true,
    group: { select: { name: true, urlname: true } },
    rsvps: { where: { status: 'YES' }, select: { guestsCount: true } },
  } as const;
  const publicUpcoming = { status: 'UPCOMING', dateTime: { gte: new Date() }, group: { isDraft: false, isPrivate: false } };
  const [events, groups, saved, nextRsvp] = await Promise.all([
    prisma.event.findMany({ where: publicUpcoming, select: eventSelect, orderBy: { dateTime: 'asc' }, take: 6 }),
    prisma.group.findMany({ where: { isDraft: false, isPrivate: false }, select: { id: true, name: true, urlname: true, description: true, city: true, state: true, coverImage: true, _count: { select: { memberships: { where: { status: 'ACTIVE' } } } }, reviews: { select: { rating: true } } }, orderBy: { createdAt: 'desc' }, take: 3 }),
    activeUser ? prisma.savedEvent.findMany({ where: { userId: activeUser.id }, select: { eventId: true } }) : [],
    activeUser ? prisma.event.findFirst({ where: { ...publicUpcoming, rsvps: { some: { userId: activeUser.id, status: 'YES' } } }, select: eventSelect, orderBy: { dateTime: 'asc' } }) : null,
  ]);
  return { props: JSON.parse(JSON.stringify({ user: activeUser ? { name: activeUser.name, memberId: activeUser.memberId } : null, events, groups, initialSavedIds: saved.map(item => item.eventId), nextRsvp })) };
};
