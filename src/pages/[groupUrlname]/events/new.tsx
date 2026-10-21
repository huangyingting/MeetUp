import { useState, type FormEvent } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import { ArrowUpRight } from 'lucide-react';
import Layout from '@/components/Layout';
import Select from '@/components/Select';
import { prisma } from '@/lib/prisma';
import { getActiveUser } from '@/lib/auth-helper';
import { publicViewer } from '@/lib/presentation';
import { gqlRequest } from '@/lib/gqlClient';

export default function CreateEvent({ user, group }: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const router = useRouter();
  const [format, setFormat] = useState('IN_PERSON');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function publish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError('');
    const data = new FormData(event.currentTarget);
    try {
      const start = new Date(String(data.get('dateTime')));
      const end = new Date(String(data.get('endTime')));
      if (end <= start || start <= new Date()) throw new Error('Choose a future start time and an end time after it.');
      const result = await gqlRequest<{ createEvent: { event: { eventId: string } } }>('createEvent', { input: {
        groupId: group.id, title: data.get('title'), description: data.get('description'),
        dateTime: start.toISOString(), endTime: end.toISOString(), timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        eventType: format, venueName: data.get('venueName') || '', venueAddress: data.get('venueAddress') || '',
        venueCity: data.get('venueCity') || group.city, onlineUrl: data.get('onlineUrl') || null,
        maxTickets: Number(data.get('maxTickets')), coverImage: '',
      } });
      await router.push(`/${group.urlname}/events/${result.createEvent.event.eventId}`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'The event could not be published.'); }
    finally { setBusy(false); }
  }
  return (
    <Layout user={user}>
      <Head><title>Create an event | {group.name}</title></Head>
      <div className="shell-container py-12 max-w-4xl">
        <Link href={`/${group.urlname}`} className="eyebrow">{group.name}</Link>
        <h1 className="page-heading mt-4">Make a plan.<br />Bring people together.</h1>
        <p className="page-intro mt-5">Put the important details up front. Your community will take it from there.</p>
        <form className="surface p-6 sm:p-9 mt-10 space-y-6" onSubmit={publish}>
          <div><label className="field-label" htmlFor="event-title">Give it a name</label><input className="field" id="event-title" name="title" minLength={3} maxLength={160} required /></div>
          <div><label className="field-label" htmlFor="event-description">What should people expect?</label><textarea className="field" id="event-description" name="description" minLength={20} maxLength={10000} rows={5} required /></div>
          <div className="grid sm:grid-cols-2 gap-5"><div><label className="field-label" htmlFor="event-start">Starts</label><input className="field" type="datetime-local" name="dateTime" id="event-start" required /></div><div><label className="field-label" htmlFor="event-end">Ends</label><input className="field" type="datetime-local" name="endTime" id="event-end" required /></div></div>
          <p className="text-xs text-[var(--muted)]">Times use your device&apos;s local time zone. The published event displays the time zone explicitly.</p>
          <div><label className="field-label" id="event-format-label" htmlFor="event-format">How are we meeting?</label><Select id="event-format" value={format} onChange={setFormat} options={[{ value: 'IN_PERSON', label: 'In person' }, { value: 'ONLINE', label: 'Online' }]} /></div>
          {format === 'ONLINE' ? <div><label className="field-label" htmlFor="event-url">Meeting link (HTTPS)</label><input className="field" type="url" id="event-url" name="onlineUrl" pattern="https://.*" required /><p className="text-xs text-[var(--muted)] mt-2">Only people who RSVP can see this link.</p></div> : <><div><label className="field-label" htmlFor="event-venue">Venue name</label><input className="field" name="venueName" id="event-venue" maxLength={200} required /></div><div><label className="field-label" htmlFor="event-address">Street address</label><input className="field" name="venueAddress" id="event-address" maxLength={300} required /></div><div><label className="field-label" htmlFor="event-city">City</label><input className="field" name="venueCity" id="event-city" defaultValue={group.city} maxLength={100} required /></div></>}
          <div><label className="field-label" htmlFor="event-capacity">Available places</label><input className="field max-w-xs" type="number" id="event-capacity" name="maxTickets" min={2} max={10000} defaultValue={20} required /></div>
          <p className="text-sm text-[var(--muted)]">This is a free event. Paid tickets aren&apos;t offered until a payment provider is connected.</p>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button-primary" disabled={busy}>{busy ? 'Publishing…' : 'Publish event'}<ArrowUpRight size={17} /></button>
        </form>
      </div>
    </Layout>
  );
}

export const getServerSideProps = (async (ctx) => {
  const user = await getActiveUser(ctx.req, ctx.res);
  if (!user) return { redirect: { destination: `/login?callbackUrl=${encodeURIComponent(ctx.resolvedUrl)}`, permanent: false } };
  const group = await prisma.group.findUnique({ where: { urlname: String(ctx.params?.groupUrlname || '') }, select: { id: true, name: true, city: true, urlname: true, organizerId: true, isDraft: true } });
  if (!group || group.organizerId !== user.id || group.isDraft) return { notFound: true };
  return { props: { user: publicViewer(user), group } };
}) satisfies GetServerSideProps;
