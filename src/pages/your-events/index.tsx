import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type { GetServerSideProps } from 'next';
import {
  Calendar as CalendarIcon,
  Bookmark,
  Clock,
  Sparkles,
  MapPin,
  Video,
  CheckCircle2,
  Plus,
} from 'lucide-react';
import Layout from '@/components/Layout';
import AddToCalendarModal from '@/components/AddToCalendarModal';
import { prisma } from '@/lib/prisma';
import { getActiveUser } from '@/lib/auth-helper';

export default function YourEventsPage({
  user,
  goingEvents,
  savedEvents,
  pastEvents,
  hostingEvents,
}: {
  user: any;
  goingEvents: any[];
  savedEvents: any[];
  pastEvents: any[];
  hostingEvents: any[];
}) {
  const router = useRouter();
  const initialTab =
    router.query.type === 'saved'
      ? 'SAVED'
      : router.query.type === 'past'
        ? 'PAST'
        : 'GOING';
  const [activeTab, setActiveTab] = useState<'GOING' | 'SAVED' | 'PAST' | 'HOSTING'>(initialTab);
  const [calendarModalEvent, setCalendarModalEvent] = useState<any | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const activeList =
    activeTab === 'GOING'
      ? goingEvents
      : activeTab === 'SAVED'
        ? savedEvents
        : activeTab === 'PAST'
          ? pastEvents
          : hostingEvents;

  return (
    <Layout user={user}>
      <Head>
        <title>Your events | Meetup</title>
      </Head>

      <div className="max-w-[1200px] mx-auto px-4 lg:px-6 pt-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="ds2-b32 text-gray-900">Your events</h1>
          <Link
            href="/find"
            className="px-4 py-2 rounded-ds2-max bg-gray-900 text-white ds2-m14 hover:bg-black transition"
          >
            Explore more events
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Sticky Sidebar: Tabs + Mini Calendar Widget */}
          <aside className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-ds2-24 border border-gray-200 p-3 space-y-1 shadow-xs">
              {[
                { id: 'GOING', label: 'Going', count: goingEvents.length, icon: CheckCircle2 },
                { id: 'SAVED', label: 'Saved', count: savedEvents.length, icon: Bookmark },
                { id: 'PAST', label: 'Past', count: pastEvents.length, icon: Clock },
                { id: 'HOSTING', label: 'Hosting', count: hostingEvents.length, icon: Sparkles },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id as any)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-ds2-16 ds2-b16 transition ${
                    activeTab === item.id
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full ds2-m12 ${
                      activeTab === item.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {item.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Interactive Mini-Calendar Widget (October 2026) */}
            <div className="bg-white rounded-ds2-24 border border-gray-200 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h2 className="ds2-b16 text-gray-900">October 2026</h2>
                {selectedDay && (
                  <button
                    type="button"
                    onClick={() => setSelectedDay(null)}
                    className="ds2-m12 text-[#00798A] hover:underline"
                  >
                    Reset date
                  </button>
                )}
              </div>
              <div className="grid grid-cols-7 gap-1 text-center ds2-m11 text-gray-400 mb-2">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                  <span key={d}>{d}</span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1 text-center">
                {[null, null, null, null, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31].map(
                  (day, idx) => {
                    if (!day) return <span key={`empty-${idx}`} />;
                    const hasEvent = [16, 17, 18, 19, 20, 21].includes(day);
                    const isSelected = selectedDay === day;
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => setSelectedDay(isSelected ? null : day)}
                        className={`h-8 rounded-full ds2-m12 relative flex items-center justify-center transition ${
                          isSelected
                            ? 'bg-gray-900 text-white'
                            : hasEvent
                              ? 'bg-teal-50 text-[#00798A] font-bold hover:bg-teal-100'
                              : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {day}
                        {hasEvent && !isSelected && (
                          <span className="w-1 h-1 rounded-full bg-[#00798A] absolute bottom-1" />
                        )}
                      </button>
                    );
                  }
                )}
              </div>
            </div>
          </aside>

          {/* Main Events Feed */}
          <div className="lg:col-span-8 space-y-4">
            {activeList.length === 0 ? (
              <div className="bg-white rounded-ds2-24 border border-gray-200 p-12 text-center space-y-3">
                <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto" />
                <h2 className="ds2-b20 text-gray-900">No events in &ldquo;{activeTab}&rdquo; yet</h2>
                <p className="ds2-r14 text-gray-500 max-w-md mx-auto">
                  Explore local San Francisco and online events to fill your calendar with great conversations.
                </p>
                <Link
                  href="/find"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-ds2-max bg-[#E51937] text-white ds2-b16 mt-2"
                >
                  Discover events
                </Link>
              </div>
            ) : (
              activeList.map((ev: any) => {
                const dateFormatted = new Date(ev.dateTime).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                });
                return (
                  <div
                    key={ev.id}
                    className="bg-white rounded-ds2-24 border border-gray-200 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-4">
                      <img
                        src={ev.coverImage}
                        alt={ev.title}
                        className="w-28 h-24 rounded-ds2-16 object-cover shrink-0"
                      />
                      <div className="space-y-1">
                        <p className="ds2-k13 text-[#00798A] uppercase">{dateFormatted} PDT</p>
                        <Link
                          href={`/${ev.group.urlname}/events/${ev.eventId}`}
                          className="ds2-b20 text-gray-900 hover:text-[#00798A] transition block"
                        >
                          {ev.title}
                        </Link>
                        <p className="ds2-m13 text-gray-600">{ev.group.name}</p>
                        <p className="ds2-r12 text-gray-500 flex items-center gap-1.5">
                          {ev.eventType === 'ONLINE' ? (
                            <>
                              <Video className="w-3.5 h-3.5 text-[#00798A]" /> Online event
                            </>
                          ) : (
                            <>
                              <MapPin className="w-3.5 h-3.5 text-rose-500" /> {ev.venueName} · {ev.venueCity}
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:items-end gap-2 shrink-0 w-full sm:w-auto">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-ds2-max bg-emerald-100 text-emerald-800 ds2-b12">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {activeTab === 'GOING' ? 'Going' : activeTab}
                      </span>
                      <button
                        type="button"
                        onClick={() => setCalendarModalEvent(ev)}
                        className="px-4 py-2 rounded-ds2-max border border-gray-300 hover:border-gray-900 ds2-m13 flex items-center justify-center gap-1.5 transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add to calendar
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {calendarModalEvent && (
        <AddToCalendarModal
          isOpen={Boolean(calendarModalEvent)}
          onClose={() => setCalendarModalEvent(null)}
          event={calendarModalEvent}
        />
      )}
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const user = await getActiveUser(ctx.req, ctx.res);
  if (!user) return { redirect: { destination: '/login', permanent: false } };

  const rsvps = await prisma.eventRsvp.findMany({
    where: { userId: user.id, status: 'YES' },
    include: { event: { include: { group: true } } },
  });

  const saved = await prisma.savedEvent.findMany({
    where: { userId: user.id },
    include: { event: { include: { group: true } } },
  });

  const pastEvents = await prisma.event.findMany({
    where: { status: 'PAST' },
    include: { group: true },
  });

  const hostingEvents = await prisma.event.findMany({
    where: { hostId: user.id },
    include: { group: true },
  });

  return {
    props: {
      user: JSON.parse(JSON.stringify(user)),
      goingEvents: JSON.parse(JSON.stringify(rsvps.map((r) => r.event).filter((e) => e.status === 'UPCOMING'))),
      savedEvents: JSON.parse(JSON.stringify(saved.map((s) => s.event))),
      pastEvents: JSON.parse(JSON.stringify(pastEvents)),
      hostingEvents: JSON.parse(JSON.stringify(hostingEvents)),
    },
  };
};
