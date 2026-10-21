import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Bookmark, ArrowUpRight, MapPin, Plus, Video } from 'lucide-react';
import { gqlRequest } from '@/lib/gqlClient';

export interface PublicEvent {
  id: string;
  eventId: string;
  title: string;
  dateTime: string;
  timezone: string;
  eventType: string;
  venueName: string;
  venueCity: string;
  coverImage: string;
  feeAmount: number;
  feeCurrency: string;
  maxTickets: number;
  rsvps: { guestsCount: number }[];
  group: { name: string; urlname: string };
}

export interface PublicGroup {
  id: string;
  name: string;
  urlname: string;
  city: string;
  state: string;
  description: string;
  coverImage: string;
  _count: { memberships: number };
  reviews: { rating: number }[];
}

export function eventDate(event: Pick<PublicEvent, 'dateTime' | 'timezone'>) {
  const options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' };
  try {
    return new Date(event.dateTime).toLocaleString('en-US', { ...options, timeZone: event.timezone });
  } catch {
    return new Date(event.dateTime).toLocaleString('en-US', { ...options, timeZone: 'UTC' });
  }
}

export function CoverArt({ image, title }: { image?: string; title: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => { setFailed(false); }, [image]);
  return image && !failed ? <Image src={image} alt="" fill unoptimized sizes="(max-width: 480px) 100vw, (max-width: 760px) 50vw, 400px" onError={() => setFailed(true)} /> : <div className="cover-art" aria-hidden="true"><span className="cover-art-mark">{title.slice(0, 1).toLowerCase()}↗</span></div>;
}

export function EventCard({ event, authenticated, initiallySaved = false }: { event: PublicEvent; authenticated: boolean; initiallySaved?: boolean }) {
  const [saved, setSaved] = useState(initiallySaved);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { setSaved(initiallySaved); }, [initiallySaved, event.id]);
  const href = `/${event.group.urlname}/events/${event.eventId}`;
  const attendees = event.rsvps.reduce((count, rsvp) => count + 1 + rsvp.guestsCount, 0);
  const price = event.feeAmount === 0 ? 'Free' : new Intl.NumberFormat('en-US', { style: 'currency', currency: event.feeCurrency || 'USD', maximumFractionDigits: 2 }).format(event.feeAmount);
  const toggle = async () => {
    setPending(true);
    setError('');
    try {
      const result = await gqlRequest(saved ? 'unsaveEvent' : 'saveEvent', { input: { eventId: event.eventId } });
      if (!result || result.errors) throw new Error('Unable to update saved event.');
      setSaved(!saved);
    } catch {
      setError('Could not save your change. Please try again.');
    } finally { setPending(false); }
  };
  return <article className="event-card">
    <Link href={href} className="event-cover" aria-label={`View ${event.title}`}><CoverArt image={event.coverImage} title={event.title} /><span className="event-format">{event.eventType === 'ONLINE' ? 'ONLINE' : 'IN PERSON'}</span></Link>
    <div className="event-body">
      <p className="event-date"><time dateTime={event.dateTime}>{eventDate(event)}</time></p>
      <Link className="event-title" href={href}>{event.title}</Link>
      <Link className="event-group" href={`/${event.group.urlname}`}>{event.group.name}</Link>
      <p className="event-place">{event.eventType === 'ONLINE' ? <><Video size={14} aria-hidden="true" /> Join from anywhere</> : <><MapPin size={14} aria-hidden="true" /> {event.venueCity || event.venueName || 'Location to be announced'}</>}</p>
    </div>
    <div className="event-card-footer"><div><strong>{price}</strong><span className="text-ds2-muted"> · {attendees} going{event.maxTickets > 0 ? ` / ${event.maxTickets} capacity` : ''}</span></div>
      {authenticated ? <button type="button" className="save-button" aria-label={saved ? `Unsave ${event.title}` : `Save ${event.title}`} aria-pressed={saved} disabled={pending} onClick={toggle}><Bookmark size={16} fill={saved ? 'currentColor' : 'none'} aria-hidden="true" /></button> : <Link className="save-button" href={`/login?callbackUrl=${encodeURIComponent(href)}`} aria-label={`Log in to save ${event.title}`}><Bookmark size={16} aria-hidden="true" /></Link>}
      {pending && <span className="metadata" role="status">Saving…</span>}
      {error && <p className="form-error card-error" role="alert">{error}</p>}
    </div>
  </article>;
}

export function GroupCard({ group }: { group: PublicGroup }) {
  const rating = group.reviews.length ? (group.reviews.reduce((sum, review) => sum + review.rating, 0) / group.reviews.length).toFixed(1) : null;
  return <Link href={`/${group.urlname}`} className="surface group-card">
    <div className="event-cover"><CoverArt image={group.coverImage} title={group.name} /></div>
    <div className="group-card-body"><p className="eyebrow mb-3">{[group.city, group.state].filter(Boolean).join(', ') || 'Community'}</p><h2>{group.name}</h2><p className="line-clamp-2">{group.description}</p><div className="group-card-footer"><span>{group._count.memberships} {group._count.memberships === 1 ? 'member' : 'members'}</span><span>{rating ? `${rating} / 5 · ${group.reviews.length} reviews` : 'No reviews yet'}</span><ArrowUpRight size={15} aria-hidden="true" /></div></div>
  </Link>;
}

export function EmptyDiscovery({ groups = false, filtered = false }: { groups?: boolean; filtered?: boolean }) {
  return <div className="empty-state">
    <div className="empty-state-art" aria-hidden="true"><Plus size={28} strokeWidth={1} /></div>
    <p className="eyebrow !mt-0 !mb-3">{filtered ? 'A little room to explore' : 'Every community starts somewhere'}</p>
    <h2>{filtered ? `No ${groups ? 'groups' : 'events'} match just yet.` : groups ? 'The next community could be yours.' : 'Good things are still taking shape.'}</h2>
    <p>{filtered ? 'Try another interest, a different location, or fewer filters. Your next connection may be just beyond this search.' : groups ? 'There are no published public groups here yet. Bring people together around something you love.' : 'No upcoming public events have been published yet. Start a community and give people a reason to come together.'}</p>
    <div className="empty-actions"><Link href="/start" className="button-primary">Start a community <ArrowUpRight size={16} /></Link><Link href={filtered ? groups ? '/find?source=GROUPS' : '/find' : '/signup'} className="button-secondary">{filtered ? 'Clear filters' : 'Create an account'}</Link></div>
  </div>;
}
