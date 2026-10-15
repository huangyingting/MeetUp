import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import type { GetServerSideProps } from 'next';
import {
  Calendar,
  MapPin,
  Video,
  Bookmark,
  Share2,
  Users,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Star,
} from 'lucide-react';
import Layout from '@/components/Layout';
import ShareModal from '@/components/ShareModal';
import { prisma } from '@/lib/prisma';
import { getActiveUser } from '@/lib/auth-helper';
import { gqlRequest } from '@/lib/gqlClient';

const DATE_STRIP_DAYS = [
  { id: 'all', label: 'All upcoming', sub: '' },
  { id: '2026-10-16', label: 'Tomorrow', sub: 'Fri, Oct 16' },
  { id: '2026-10-17', label: 'Saturday', sub: 'Oct 17' },
  { id: '2026-10-18', label: 'Sunday', sub: 'Oct 18' },
  { id: '2026-10-19', label: 'Monday', sub: 'Oct 19' },
  { id: '2026-10-20', label: 'Tuesday', sub: 'Oct 20' },
  { id: '2026-10-21', label: 'Wednesday', sub: 'Oct 21' },
];

export default function HomePage({
  user,
  events,
  initialSavedIds,
  initialRsvpIds,
  joinedGroupIds,
  groups,
}: {
  user: any;
  events: any[];
  initialSavedIds: string[];
  initialRsvpIds: string[];
  joinedGroupIds: string[];
  groups: any[];
}) {
  const [selectedDate, setSelectedDate] = useState('all');
  const [feedTab, setFeedTab] = useState<'ALL' | 'GROUPS' | 'SAVED'>('ALL');
  const [savedIds, setSavedIds] = useState<string[]>(initialSavedIds);
  const [shareEvent, setShareEvent] = useState<any | null>(null);

  const nextRsvpEvent = events.find((e) => initialRsvpIds.includes(e.id));

  const filteredEvents = events.filter((ev) => {
    if (selectedDate !== 'all') {
      const evDay = ev.dateTime.slice(0, 10);
      if (evDay !== selectedDate) return false;
    }
    if (feedTab === 'GROUPS' && !joinedGroupIds.includes(ev.groupId)) return false;
    if (feedTab === 'SAVED' && !savedIds.includes(ev.id)) return false;
    return true;
  });

  const handleToggleSave = async (ev: any) => {
    const isSaved = savedIds.includes(ev.id);
    if (isSaved) {
      await gqlRequest('unsaveEvent', { input: { eventId: ev.eventId } });
      setSavedIds(savedIds.filter((id) => id !== ev.id));
    } else {
      await gqlRequest('saveEvent', { input: { eventId: ev.eventId } });
      setSavedIds([...savedIds, ev.id]);
    }
  };

  return (
    <Layout user={user}>
      <Head>
        <title>Meetup — All the events you&apos;ll love, right here</title>
      </Head>

      <div className="max-w-[1200px] mx-auto px-4 lg:px-6 pt-8 space-y-10">
        {/* Hero Banner */}
        <section className="rounded-ds2-32 bg-gradient-to-r from-[#141416] via-[#1F2937] to-[#00798A] text-white p-8 lg:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-ds2-sm">
          <div className="max-w-2xl space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-ds2-max bg-white/15 ds2-m12">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Welcome back, {user.name} · {user.city}, {user.state}
            </span>
            <h1 className="ds2-b32">All the events you&apos;ll love, right here</h1>
            <p className="ds2-r16 text-white/85">
              Curated picks from groups you&apos;re in and topics you follow in the San Francisco Bay Area.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <Link
              href="/find"
              className="px-5 py-3 rounded-ds2-max bg-white text-gray-900 hover:bg-gray-100 ds2-b16 flex items-center gap-2 transition"
            >
              Explore events
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/start"
              className="px-5 py-3 rounded-ds2-max bg-white/15 hover:bg-white/25 text-white border border-white/25 ds2-b16 transition"
            >
              Start a group
            </Link>
          </div>
        </section>

        {/* Your Next Event Highlight Card (if user has an upcoming RSVP) */}
        {nextRsvpEvent && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="ds2-b24 text-gray-900">Your next event</h2>
              <Link href="/your-events" className="ds2-m14 text-[#00798A] hover:underline">
                See all your events →
              </Link>
            </div>

            <div className="bg-white rounded-ds2-24 border border-gray-200 p-5 sm:p-6 shadow-ds2-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
              <div className="flex items-start gap-4">
                <img
                  src={nextRsvpEvent.coverImage}
                  alt={nextRsvpEvent.title}
                  className="w-28 h-24 rounded-ds2-16 object-cover shrink-0"
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-ds2-max bg-emerald-100 text-emerald-800 ds2-b12 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      You are going
                    </span>
                    <span className="px-2.5 py-0.5 rounded-ds2-max bg-gray-100 text-gray-700 ds2-m12">
                      In 2 days
                    </span>
                  </div>
                  <Link
                    href={`/${nextRsvpEvent.group.urlname}/events/${nextRsvpEvent.eventId}`}
                    className="ds2-b20 text-gray-900 hover:text-[#00798A] transition block"
                  >
                    {nextRsvpEvent.title}
                  </Link>
                  <p className="ds2-m13 text-gray-600">
                    {nextRsvpEvent.group.name} · {nextRsvpEvent.venueName} ({nextRsvpEvent.venueCity})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShareEvent(nextRsvpEvent)}
                  className="px-4 py-2 rounded-ds2-max border border-gray-300 hover:border-gray-900 ds2-m13 flex items-center gap-1.5"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
                <Link
                  href={`/${nextRsvpEvent.group.urlname}/events/${nextRsvpEvent.eventId}`}
                  className="px-5 py-2 rounded-ds2-max bg-gray-900 text-white ds2-b16 hover:bg-black transition"
                >
                  View details
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Events For You Section with Horizontal Date Strip & Feed Filter Pills */}
        <section className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="ds2-b24 text-gray-900">Events for you</h2>

            {/* Filter Pills: All / From your groups / Saved */}
            <div className="flex items-center gap-2">
              {[
                { id: 'ALL', label: 'All' },
                { id: 'GROUPS', label: 'From your groups' },
                { id: 'SAVED', label: `Saved (${savedIds.length})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFeedTab(tab.id as any)}
                  className={`px-4 py-2 rounded-ds2-max ds2-m14 transition ${
                    feedTab === tab.id
                      ? 'bg-gray-900 text-white'
                      : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-400'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Horizontal Date Strip */}
          <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar pb-1">
            {DATE_STRIP_DAYS.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setSelectedDate(d.id)}
                className={`px-4 py-2.5 rounded-ds2-16 border text-left shrink-0 transition ${
                  selectedDate === d.id
                    ? 'border-gray-900 bg-gray-900 text-white'
                    : 'border-gray-200 bg-white text-gray-800 hover:border-gray-400'
                }`}
              >
                <p className="ds2-b12">{d.label}</p>
                {d.sub && (
                  <p className={`ds2-r12 ${selectedDate === d.id ? 'text-gray-300' : 'text-gray-500'}`}>
                    {d.sub}
                  </p>
                )}
              </button>
            ))}
          </div>

          {/* Events Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((ev) => {
              const isSaved = savedIds.includes(ev.id);
              const isGoing = initialRsvpIds.includes(ev.id);
              const dateObj = new Date(ev.dateTime);
              const dateFormatted = dateObj.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              });

              return (
                <div
                  key={ev.id}
                  className="group bg-white rounded-ds2-24 border border-gray-200 overflow-hidden shadow-xs hover:shadow-ds2-lg-default hover:-translate-y-0.5 transition flex flex-col justify-between"
                >
                  <div>
                    <div className="relative h-44 overflow-hidden">
                      <Link href={`/${ev.group.urlname}/events/${ev.eventId}`}>
                        <img
                          src={ev.coverImage}
                          alt={ev.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      </Link>
                      <div className="absolute top-3 left-3 flex items-center gap-1.5">
                        <span className="px-2.5 py-1 rounded-ds2-max bg-black/75 text-white ds2-m11 flex items-center gap-1 backdrop-blur-xs">
                          {ev.eventType === 'ONLINE' ? (
                            <>
                              <Video className="w-3 h-3 text-teal-300" /> Online event
                            </>
                          ) : (
                            <>
                              <MapPin className="w-3 h-3 text-rose-300" /> {ev.venueCity}
                            </>
                          )}
                        </span>
                        {ev.feeAmount === 0 ? (
                          <span className="px-2.5 py-1 rounded-ds2-max bg-white/95 text-gray-900 ds2-b12">
                            Free
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-ds2-max bg-amber-100 text-amber-900 ds2-b12">
                            ${ev.feeAmount}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-5 space-y-2">
                      <p className="ds2-k13 text-[#00798A] uppercase">{dateFormatted} PDT</p>
                      <Link
                        href={`/${ev.group.urlname}/events/${ev.eventId}`}
                        className="ds2-b16 text-gray-900 group-hover:text-[#00798A] line-clamp-2 block"
                      >
                        {ev.title}
                      </Link>
                      <Link
                        href={`/${ev.group.urlname}`}
                        className="ds2-r12 text-gray-500 hover:underline block truncate"
                      >
                        {ev.group.name} · ★ {ev.group.rating}
                      </Link>
                    </div>
                  </div>

                  <div className="px-5 pb-4 pt-2 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2 ds2-m12 text-gray-600">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span>{ev.rsvps.length + 12} going</span>
                      {isGoing && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 ds2-b12">
                          Going
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        aria-label="Share event"
                        onClick={() => setShareEvent(ev)}
                        className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        aria-label={isSaved ? 'Unsave event' : 'Save event'}
                        onClick={() => handleToggleSave(ev)}
                        className={`p-2 rounded-full hover:bg-gray-100 transition ${
                          isSaved ? 'text-[#E51937]' : 'text-gray-600'
                        }`}
                      >
                        <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-[#E51937]' : ''}`} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Your Groups & Suggested Groups Carousel */}
        <section className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <h2 className="ds2-b24 text-gray-900">Your groups & top communities nearby</h2>
            <Link href="/groups" className="ds2-m14 text-[#00798A] hover:underline">
              See all groups →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {groups.slice(0, 6).map((g) => (
              <Link
                key={g.id}
                href={`/${g.urlname}`}
                className="bg-white rounded-ds2-20 border border-gray-200 p-4 flex items-center gap-4 hover:border-gray-900 transition"
              >
                <img
                  src={g.coverImage}
                  alt={g.name}
                  className="w-16 h-16 rounded-ds2-12 object-cover shrink-0"
                />
                <div className="min-w-0">
                  <p className="ds2-b16 text-gray-900 truncate">{g.name}</p>
                  <p className="ds2-r12 text-gray-500 mt-0.5">
                    {g.membersCount.toLocaleString()} members · {g.city}, {g.state}
                  </p>
                  <p className="ds2-m12 text-amber-600 flex items-center gap-1 mt-0.5">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    {g.rating} ({g.ratingsCount.toLocaleString()})
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>

      {/* Share & Flyer Modal */}
      {shareEvent && (
        <ShareModal
          isOpen={Boolean(shareEvent)}
          onClose={() => setShareEvent(null)}
          title={shareEvent.title}
          subtitle={shareEvent.group?.name}
          url={`/${shareEvent.group?.urlname}/events/${shareEvent.eventId}`}
          venueStr={`${shareEvent.venueName} · ${shareEvent.venueCity}`}
        />
      )}
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const user = await getActiveUser(ctx.req, ctx.res);
  if (!user) {
    return { redirect: { destination: '/login', permanent: false } };
  }

  const events = await prisma.event.findMany({
    where: { status: 'UPCOMING' },
    include: { group: true, host: true, rsvps: true },
    orderBy: { dateTime: 'asc' },
  });

  const saved = await prisma.savedEvent.findMany({
    where: { userId: user.id },
  });

  const rsvps = await prisma.eventRsvp.findMany({
    where: { userId: user.id, status: 'YES' },
  });

  const groups = await prisma.group.findMany({
    where: { isDraft: false },
    orderBy: { membersCount: 'desc' },
  });

  return {
    props: {
      user: JSON.parse(JSON.stringify(user)),
      events: JSON.parse(JSON.stringify(events)),
      initialSavedIds: saved.map((s) => s.eventId),
      initialRsvpIds: rsvps.map((r) => r.eventId),
      joinedGroupIds: user.memberships.map((m: any) => m.groupId),
      groups: JSON.parse(JSON.stringify(groups)),
    },
  };
};
