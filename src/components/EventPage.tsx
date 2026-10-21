import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import type { InferGetServerSidePropsType } from 'next';
import type { getEventServerSideProps } from '@/server/event';
import { MapPin, Calendar, Users, ArrowUpRight, Bookmark, Video } from 'lucide-react';
import Layout from './Layout';
import Avatar from './Avatar';
import ReportModal from './ReportModal';
import AddToCalendarModal from './AddToCalendarModal';
import { gqlRequest } from '@/lib/gqlClient';

export default function EventPage({ user, event, going, saved, attendees, showAttendees }: InferGetServerSidePropsType<typeof getEventServerSideProps>) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const date = new Date(event.dateTime);
  const ended = new Date(event.endTime).getTime() < Date.now() || event.status !== 'UPCOMING';
  const available = event.maxTickets - event.attendeeCount;
  const dateLabel = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: event.timezone });
  const timeLabel = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: event.timezone, timeZoneName: 'short' });
  const path = `/${event.group.urlname}/events/${event.eventId}`;
  async function action(operation: string, input: Record<string, unknown>) {
    if (!user) { await router.push(`/login?callbackUrl=${encodeURIComponent(path)}`); return; }
    setBusy(true); setError('');
    try { await gqlRequest(operation, { input }); await router.replace(router.asPath); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Your request could not be saved.'); }
    finally { setBusy(false); }
  }
  return (
    <Layout user={user}>
      <Head><title>{event.title} | Meetup</title></Head>
      <div className="shell-container py-10 lg:py-16">
        <Link href={`/${event.group.urlname}`} className="eyebrow hover:underline">{event.group.name} / {showAttendees ? 'Attendees' : 'Gathering'}</Link>
        <div className="grid lg:grid-cols-[1.4fr_.6fr] gap-10 lg:gap-16 mt-6">
          <div className="contents lg:block">
            <header className="order-1">
            <h1 className="page-heading">{event.title}</h1>
            <div className="flex items-center gap-3 mt-7"><Avatar name={event.host.name} image={event.host.image} /><p className="text-sm">Hosted by <Link className="underline underline-offset-4" href={`/members/${event.host.memberId}`}>{event.host.name}</Link></p></div>
            </header>
            <div className="order-3">
            {showAttendees ? <section className="mt-10"><h2 className="text-2xl font-semibold mb-6">Who&apos;s coming.</h2>{attendees.length ? <div className="grid sm:grid-cols-2 gap-4">{attendees.map(person => <Link href={`/members/${person.memberId}`} className="surface p-5 flex items-center gap-3" key={person.memberId}><Avatar name={person.name} image={person.image} /><span>{person.name}</span></Link>)}</div> : <div className="empty-state"><Users size={26} /><p>No RSVPs yet. Every great gathering starts with the first person.</p></div>}<Link className="button-secondary mt-6" href={path}>Back to event</Link></section> : <>
              <div className="mt-9 relative aspect-[16/9] rounded-2xl overflow-hidden bg-[var(--forest)]">
                {event.coverImage ? <Image src={event.coverImage} alt="" fill sizes="(min-width: 1024px) 750px, 90vw" className="object-cover" /> : <div className="absolute inset-0 flex items-center justify-center text-[#e5ecd2]" aria-hidden="true"><Calendar size={110} strokeWidth={.7} /><div className="absolute inset-6 border border-white/20 rounded-full -rotate-12" /></div>}
              </div>
              <section className="mt-10"><p className="eyebrow">The details</p><h2 className="text-3xl font-semibold mt-3 mb-6">A reason to show up.</h2><p className="whitespace-pre-wrap text-[var(--muted)] leading-8">{event.description}</p></section>
              <section className="mt-10 border-t border-[var(--line)] pt-8"><div className="flex justify-between gap-4"><h2 className="text-2xl font-semibold">The people.</h2><Link className="text-sm underline underline-offset-4" href={`${path}/attendees`}>{event.attendeeCount} going</Link></div><div className="flex gap-3 flex-wrap mt-5">{attendees.slice(0, 8).map(person => <Link href={`/members/${person.memberId}`} key={person.memberId}><Avatar name={person.name} image={person.image} /></Link>)}</div>{!attendees.length && <p className="text-sm text-[var(--muted)] mt-4">Be the first to make a plan.</p>}</section>
            </>}
            </div>
          </div>
          <aside className="order-2 lg:order-none">
            <div className="surface p-6 sm:p-8 lg:sticky lg:top-28 space-y-7">
              <div><p className="eyebrow">{event.status === 'CANCELLED' ? 'This event was cancelled' : ended ? 'This event has ended' : 'Save the date'}</p><p className="text-2xl font-semibold mt-3">{dateLabel}</p><p className="text-sm mt-2 text-[var(--muted)]">{timeLabel}</p></div>
              <div className="flex gap-3"><Calendar size={20} className="shrink-0" /><div><p className="font-semibold">Your time, well spent.</p><p className="text-sm text-[var(--muted)] mt-1">{event.timezone.replaceAll('_', ' ')}</p></div></div>
              <div className="flex gap-3">{event.eventType === 'ONLINE' ? <Video size={20} className="shrink-0" /> : <MapPin size={20} className="shrink-0" />}<div><p className="font-semibold">{event.eventType === 'ONLINE' ? 'Online gathering' : event.venueName}</p><p className="text-sm text-[var(--muted)] mt-1">{event.eventType === 'ONLINE' ? 'The meeting link is available after you RSVP.' : [event.venueAddress, event.venueCity].filter(Boolean).join(', ')}</p>{going && event.onlineUrl && <a href={event.onlineUrl} target="_blank" rel="noopener noreferrer" className="button-secondary mt-3">Open meeting <ArrowUpRight size={15} /></a>}</div></div>
              <div className="border-t border-[var(--line)] pt-5 flex justify-between items-end"><span className="text-3xl font-semibold">Free</span><span className="text-xs text-[var(--muted)]">{Math.max(0, available)} places left</span></div>
              {!ended && <button className="button-primary w-full justify-between" disabled={busy || (!going && available <= 0)} onClick={() => action('rsvpToEvent', { eventId: event.eventId, status: going ? 'NO' : 'YES', guestsCount: 0 })}>{going ? 'Cancel my RSVP' : available <= 0 ? 'Event is full' : 'I’ll be there'}<ArrowUpRight size={17} /></button>}
              <button className="button-secondary w-full justify-center" disabled={busy} onClick={() => action(saved ? 'unsaveEvent' : 'saveEvent', { eventId: event.eventId })}><Bookmark size={16} fill={saved ? 'currentColor' : 'none'} />{saved ? 'Saved to your list' : 'Save for later'}</button>
              <button className="text-sm underline underline-offset-4 w-full text-center" onClick={() => setCalendarOpen(true)}>Add to your calendar</button>
              {user && <button className="text-xs text-[var(--muted)] underline underline-offset-4 w-full text-center" onClick={() => setReportOpen(true)}>Report a concern</button>}
              {event.canManage && !ended && <button className="text-xs text-[var(--accent)] underline underline-offset-4 w-full text-center" disabled={busy} onClick={() => { if (window.confirm('Cancel this event? Attendees will receive an in-app notification.')) action('cancelEvent', { eventId: event.eventId }); }}>Cancel this event</button>}
              {going && !ended && <p className="text-sm text-[var(--forest)]" role="status">You&apos;re on the list. See you there.</p>}
              {error && <p className="form-error" role="alert">{error}</p>}
            </div>
          </aside>
        </div>
      </div>
      <AddToCalendarModal isOpen={calendarOpen} onClose={() => setCalendarOpen(false)} event={event} />
      <ReportModal isOpen={reportOpen} onClose={() => setReportOpen(false)} targetType="EVENT" targetId={event.eventId} targetName={event.title} />
    </Layout>
  );
}
