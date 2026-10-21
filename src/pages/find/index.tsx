import Head from 'next/head';
import Link from 'next/link';
import type { GetServerSideProps } from 'next';
import type { Prisma } from '@prisma/client';
import { MapPin, Search, ArrowRight } from 'lucide-react';
import Layout from '@/components/Layout';
import Select from '@/components/Select';
import { EmptyDiscovery, EventCard, GroupCard, type PublicEvent, type PublicGroup } from '@/components/DiscoveryCards';
import { getActiveUser } from '@/lib/auth-helper';
import { prisma } from '@/lib/prisma';

interface FindProps {
  user: { name: string; memberId: string } | null;
  events: PublicEvent[];
  groups: PublicGroup[];
  categories: { urlkey: string; name: string }[];
  initialSource: string;
  initialKeywords: string;
  initialLocation: string;
  initialType: string;
  initialCategory: string;
  initialSort: string;
  initialSavedIds: string[];
}

export function FindExperience({ user, events, groups, categories, initialSource, initialKeywords, initialLocation, initialType, initialCategory, initialSort, initialSavedIds }: FindProps) {
  const showGroups = initialSource === 'GROUPS';
  const params = new URLSearchParams();
  if (initialKeywords) params.set('keywords', initialKeywords);
  if (initialLocation) params.set('location', initialLocation);
  if (initialType !== 'ALL') params.set('type', initialType === 'ONLINE' ? 'online' : 'inPerson');
  if (initialCategory !== 'all') params.set('category', initialCategory);
  params.set('sort', initialSort);
  const tabHref = (source: string) => { const query = new URLSearchParams(params); query.set('source', source); return `/find?${query}`; };
  const count = showGroups ? groups.length : events.length;
  const filtered = Boolean(initialKeywords || initialLocation || initialType !== 'ALL' || initialCategory !== 'all');
  return <Layout user={user}>
    <Head><title>Explore events & communities · Meetup</title><meta name="description" content="Find upcoming public events and communities by interest, location, and format." /></Head>
    <div className="shell-container">
      <header className="discovery-header"><span className="eyebrow">A world beyond your usual</span><h1 className="page-heading">Follow your<br /><span className="text-viridian">kind of curious.</span></h1><p className="page-intro">Find something that speaks to you. Then meet the people who feel the same.</p></header>
      <form action="/find" method="get">
        <input type="hidden" name="source" value={initialSource} />
        <div className="search-panel"><div className="search-field"><label htmlFor="find-keywords"><Search size={12} /> Your interests</label><input key={`k-${initialKeywords}`} id="find-keywords" name="keywords" defaultValue={initialKeywords} placeholder="What would you love to do?" /></div><div className="search-field"><label htmlFor="find-location"><MapPin size={12} /> Your location</label><input key={`l-${initialLocation}`} id="find-location" name="location" defaultValue={initialLocation} placeholder="City or region · anywhere" /></div><button className="button-primary" type="submit">Explore <ArrowRight size={17} /></button></div>
        <div className="discovery-layout">
          <aside className="filter-panel surface" aria-label="Search filters">
            <div><label className="field-label" id="find-type-label" htmlFor="find-type">How we meet</label><Select key={`t-${initialType}`} id="find-type" name="type" defaultValue={initialType === 'ONLINE' ? 'online' : initialType === 'IN_PERSON' ? 'inPerson' : 'all'} options={[{ value: 'all', label: 'All formats' }, { value: 'inPerson', label: 'In person' }, { value: 'online', label: 'Online' }]} /></div>
            <div><label className="field-label" id="find-category-label" htmlFor="find-category">Common interests</label><Select key={`c-${initialCategory}`} id="find-category" name="category" defaultValue={initialCategory} options={[{ value: 'all', label: 'All interests' }, ...categories.map(category => ({ value: category.urlkey, label: category.name }))]} /></div>
            <div><label className="field-label" id="find-sort-label" htmlFor="find-sort">Sort by</label><Select key={`s-${initialSort}`} id="find-sort" name="sort" defaultValue={initialSort} options={showGroups ? [{ value: 'newest', label: 'Newest groups' }, { value: 'name', label: 'Group name' }] : [{ value: 'date', label: 'Soonest first' }, { value: 'newest', label: 'Recently published' }]} /></div>
            <div><button className="button-primary" type="submit">Apply filters</button><Link className="reset-link" href={showGroups ? '/find?source=GROUPS' : '/find'}>Reset search</Link></div>
          </aside>
          <section className="discovery-results" aria-label={showGroups ? 'Group results' : 'Event results'}>
            <div className="results-bar"><nav className="result-tabs" aria-label="Result type"><Link href={tabHref('EVENTS')} aria-current={!showGroups ? 'page' : undefined}>Events</Link><Link href={tabHref('GROUPS')} aria-current={showGroups ? 'page' : undefined}>Groups</Link></nav><p className="metadata">{count} {showGroups ? 'public groups' : 'upcoming events'}{count === 100 ? ' · first 100' : ''}</p></div>
            {count ? showGroups ? <div className="group-grid">{groups.map(group => <GroupCard key={group.id} group={group} />)}</div> : <div className="event-grid">{events.map(event => <EventCard key={event.id} event={event} authenticated={Boolean(user)} initiallySaved={initialSavedIds.includes(event.id)} />)}</div> : <EmptyDiscovery groups={showGroups} filtered={filtered} />}
            {initialLocation && initialType === 'ONLINE' && <p className="metadata mt-6">Online results match the organizer&apos;s group location.</p>}
          </section>
        </div>
      </form>
    </div>
  </Layout>;
}

export default FindExperience;

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const value = (key: string) => typeof ctx.query[key] === 'string' ? (ctx.query[key] as string).trim().slice(0, 200) : '';
  const slug = Array.isArray(ctx.params?.slug) ? ctx.params.slug[0] : '';
  const initialKeywords = value('keywords');
  const routeLocation = slug?.startsWith('us--') ? slug.replace('us--', '').split('--').reverse().map(part => part.replace(/-/g, ' ')).join(', ') : '';
  const initialLocation = value('location') || routeLocation || '';
  const initialSource = value('source') === 'GROUPS' ? 'GROUPS' : 'EVENTS';
  const initialType = slug === 'online-events' || value('type') === 'online' ? 'ONLINE' : value('type') === 'inPerson' ? 'IN_PERSON' : 'ALL';
  const initialCategory = value('category') || 'all';
  const initialSort = initialSource === 'GROUPS' ? (value('sort') === 'name' ? 'name' : 'newest') : (value('sort') === 'newest' ? 'newest' : 'date');
  const user = await getActiveUser(ctx.req, ctx.res);
  const now = new Date();
  const groupFilters: Prisma.GroupWhereInput[] = [{ isDraft: false, isPrivate: false }];
  if (initialCategory !== 'all') groupFilters.push({ topics: { some: { topic: { category: { urlkey: initialCategory } } } } });
  const locationParts = initialLocation.split(',').map(part => part.trim()).filter(Boolean);
  for (const part of locationParts) groupFilters.push({ OR: [{ city: { contains: part } }, { state: { contains: part } }, { country: { contains: part } }] });
  const eventWhere: Prisma.EventWhereInput = {
    status: 'UPCOMING', dateTime: { gte: now },
    group: { AND: [...groupFilters] },
    ...(initialType !== 'ALL' ? { eventType: initialType } : {}),
  };
  if (initialKeywords) eventWhere.OR = [{ title: { contains: initialKeywords } }, { description: { contains: initialKeywords } }, { group: { name: { contains: initialKeywords } } }];
  // In-person event location may differ from the group's home city.
  if (locationParts.length && initialType !== 'ONLINE') {
    eventWhere.group = { AND: groupFilters.slice(0, initialCategory === 'all' ? 1 : 2) };
    eventWhere.AND = locationParts.map(part => ({ OR: [{ venueCity: { contains: part } }, { venueState: { contains: part } }, { group: { OR: [{ city: { contains: part } }, { state: { contains: part } }, { country: { contains: part } }] } }] }));
  }
  if (initialKeywords) groupFilters.push({ OR: [{ name: { contains: initialKeywords } }, { description: { contains: initialKeywords } }, { topics: { some: { topic: { name: { contains: initialKeywords } } } } }] });
  if (initialType !== 'ALL') groupFilters.push({ events: { some: { status: 'UPCOMING', dateTime: { gte: now }, eventType: initialType } } });
  const [events, groups, categories, saved] = await Promise.all([
    initialSource === 'EVENTS' ? prisma.event.findMany({
      where: eventWhere,
      select: { id: true, eventId: true, title: true, dateTime: true, timezone: true, eventType: true, venueName: true, venueCity: true, coverImage: true, feeAmount: true, feeCurrency: true, maxTickets: true, group: { select: { name: true, urlname: true } }, rsvps: { where: { status: 'YES' }, select: { guestsCount: true } } },
      orderBy: initialSort === 'newest' ? { createdAt: 'desc' } : { dateTime: 'asc' }, take: 100,
    }) : [],
    initialSource === 'GROUPS' ? prisma.group.findMany({
      where: { AND: groupFilters },
      select: { id: true, name: true, urlname: true, description: true, city: true, state: true, coverImage: true, _count: { select: { memberships: { where: { status: 'ACTIVE' } } } }, reviews: { select: { rating: true } } },
      orderBy: initialSort === 'name' ? { name: 'asc' } : { createdAt: 'desc' }, take: 100,
    }) : [],
    prisma.topicCategory.findMany({ select: { name: true, urlkey: true }, orderBy: { name: 'asc' } }),
    user ? prisma.savedEvent.findMany({ where: { userId: user.id }, select: { eventId: true } }) : [],
  ]);
  return { props: JSON.parse(JSON.stringify({ user: user ? { name: user.name, memberId: user.memberId } : null, events, groups, categories, initialKeywords, initialLocation, initialSource, initialType, initialCategory, initialSort, initialSavedIds: saved.map(item => item.eventId) })) };
};
