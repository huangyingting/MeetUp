import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import type { GetServerSideProps } from 'next';
import { Calendar, MapPin, Video, Users } from 'lucide-react';
import Layout from '@/components/Layout';
import GroupShell from '@/components/GroupShell';
import { prisma } from '@/lib/prisma';
import { getActiveUser } from '@/lib/auth-helper';

export function GroupEventsView({
  user,
  group,
  initialIsMember,
  subTab,
}: {
  user: any;
  group: any;
  initialIsMember: boolean;
  subTab: 'UPCOMING' | 'PAST' | 'CALENDAR';
}) {
  const upcomingEvents = group.events.filter((e: any) => e.status === 'UPCOMING');
  const pastEvents = group.events.filter((e: any) => e.status === 'PAST');
  const visibleEvents = subTab === 'PAST' ? pastEvents : upcomingEvents;

  return (
    <Layout user={user}>
      <Head>
        <title>Events — {group.name} | Meetup</title>
      </Head>

      <GroupShell
        user={user}
        group={group}
        activeTab="events"
        initialIsMember={initialIsMember}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <aside className="lg:col-span-3 space-y-2">
            <div className="bg-white rounded-ds2-20 border border-gray-200 p-2 space-y-1">
              <Link
                href={`/${group.urlname}/events`}
                className={`block px-4 py-2.5 rounded-ds2-12 ds2-b16 ${
                  subTab === 'UPCOMING'
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Upcoming ({upcomingEvents.length})
              </Link>
              <Link
                href={`/${group.urlname}/events/past`}
                className={`block px-4 py-2.5 rounded-ds2-12 ds2-b16 ${
                  subTab === 'PAST'
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Past ({pastEvents.length})
              </Link>
              <Link
                href={`/${group.urlname}/events/calendar`}
                className={`block px-4 py-2.5 rounded-ds2-12 ds2-b16 ${
                  subTab === 'CALENDAR'
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Calendar
              </Link>
            </div>
          </aside>

          <div className="lg:col-span-9 space-y-4">
            {subTab === 'CALENDAR' ? (
              <div className="bg-white rounded-ds2-24 border border-gray-200 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="ds2-b24 text-gray-900">October 2026 Calendar</h2>
                  <span className="ds2-m13 text-gray-500">{upcomingEvents.length} scheduled events</span>
                </div>

                <div className="grid grid-cols-7 gap-2 text-center ds2-b12 text-gray-500">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                    <div key={d}>{d}</div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: 31 }).map((_, idx) => {
                    const day = idx + 1;
                    const dayEvent = upcomingEvents.find(
                      (ev: any) => new Date(ev.dateTime).getDate() === day
                    );
                    return (
                      <div
                        key={day}
                        className="min-h-24 p-2 rounded-ds2-12 border border-gray-200 bg-gray-50 flex flex-col justify-between"
                      >
                        <span className="ds2-b12 text-gray-700">{day}</span>
                        {dayEvent && (
                          <Link
                            href={`/${group.urlname}/events/${dayEvent.eventId}`}
                            className="p-1.5 rounded-lg bg-[#00798A] text-white ds2-m11 line-clamp-2"
                          >
                            {dayEvent.title}
                          </Link>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              visibleEvents.map((ev: any) => (
                <Link
                  key={ev.id}
                  href={`/${group.urlname}/events/${ev.eventId}`}
                  className="bg-white rounded-ds2-24 border border-gray-200 p-6 hover:border-gray-900 transition flex flex-col sm:flex-row items-start justify-between gap-5 block"
                >
                  <div className="space-y-2">
                    <p className="ds2-k13 text-[#00798A] uppercase">
                      {new Date(ev.dateTime).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}{' '}
                      PDT
                    </p>
                    <h3 className="ds2-b20 text-gray-900">{ev.title}</h3>
                    <p className="ds2-r14 text-gray-600 line-clamp-2">{ev.description}</p>
                    <div className="flex items-center gap-3 ds2-m12 text-gray-500">
                      <span className="flex items-center gap-1">
                        {ev.eventType === 'ONLINE' ? (
                          <>
                            <Video className="w-4 h-4 text-[#00798A]" /> Online event
                          </>
                        ) : (
                          <>
                            <MapPin className="w-4 h-4 text-[#E51937]" /> {ev.venueName}
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                  <img
                    src={ev.coverImage}
                    alt={ev.title}
                    className="w-full sm:w-44 h-28 rounded-ds2-16 object-cover shrink-0"
                  />
                </Link>
              ))
            )}
          </div>
        </div>
      </GroupShell>
    </Layout>
  );
}

export default function GroupUpcomingEventsPage(props: any) {
  return <GroupEventsView {...props} subTab="UPCOMING" />;
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const user = await getActiveUser(ctx.req, ctx.res);
  const urlname = ctx.params?.groupUrlname as string;

  let group = await prisma.group.findUnique({
    where: { urlname },
    include: {
      organizer: true,
      events: { orderBy: { dateTime: 'asc' } },
      memberships: true,
    },
  });

  if (!group) {
    group = await prisma.group.findFirst({
      include: {
        organizer: true,
        events: { orderBy: { dateTime: 'asc' } },
        memberships: true,
      },
    });
  }

  const initialIsMember =
    user && group ? group.memberships.some((m) => m.userId === user.id) : false;

  return {
    props: {
      user: JSON.parse(JSON.stringify(user)),
      group: JSON.parse(JSON.stringify(group)),
      initialIsMember,
    },
  };
};
