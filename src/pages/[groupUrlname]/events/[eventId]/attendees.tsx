import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import type { GetServerSideProps } from 'next';
import { ArrowLeft, Search, Sparkles, SlidersHorizontal, MessageSquare } from 'lucide-react';
import Layout from '@/components/Layout';
import MeetupPlusModal from '@/components/MeetupPlusModal';
import { prisma } from '@/lib/prisma';
import { getActiveUser } from '@/lib/auth-helper';

export default function EventAttendeesPage({
  user,
  event,
}: {
  user: any;
  event: any;
}) {
  const [tab, setTab] = useState<'GOING' | 'NOT_GOING'>('GOING');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'RECENT' | 'NAME'>('RECENT');
  const [plusOpen, setPlusOpen] = useState(false);

  const goingList = event.rsvps.filter((r: any) => r.status === 'YES');
  const notGoingList = event.rsvps.filter((r: any) => r.status === 'NO');

  const rawList = tab === 'GOING' ? goingList : notGoingList;
  const filteredList = rawList
    .filter((r: any) =>
      search.trim() ? r.user.name.toLowerCase().includes(search.toLowerCase()) : true
    )
    .sort((a: any, b: any) => {
      if (sortBy === 'NAME') return a.user.name.localeCompare(b.user.name);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  return (
    <Layout user={user}>
      <Head>
        <title>Attendees — {event.title} | Meetup</title>
      </Head>

      <div className="max-w-4xl mx-auto px-4 lg:px-6 pt-8 space-y-6">
        <div>
          <Link
            href={`/${event.group.urlname}/events/${event.eventId}`}
            className="inline-flex items-center gap-1.5 ds2-m14 text-[#00798A] hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to event details
          </Link>
          <h1 className="ds2-b32 text-gray-900 mt-2">{event.title}</h1>
          <p className="ds2-r14 text-gray-500">{event.group.name}</p>
        </div>

        {/* Meetup+ Upsell Banner */}
        <div className="rounded-ds2-24 bg-gradient-to-r from-[#141416] via-[#3B0764] to-[#D91B5C] p-6 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/15 ds2-m11 uppercase">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Meetup+
            </span>
            <h2 className="ds2-b20">Connect with attendees before the event</h2>
            <p className="ds2-r14 text-white/85">
              See everyone&apos;s shared interests, mutual groups, and send direct introductions.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPlusOpen(true)}
            className="px-5 py-2.5 rounded-ds2-max bg-white text-gray-900 ds2-b16 shrink-0"
          >
            Try free for 7 days
          </button>
        </div>

        {/* Going / Not Going Tabs + Search & Sort */}
        <div className="bg-white rounded-ds2-24 border border-gray-200 p-6 space-y-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setTab('GOING')}
                className={`px-4 py-2 rounded-ds2-max ds2-b16 transition ${
                  tab === 'GOING' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                Going ({goingList.length})
              </button>
              <button
                type="button"
                onClick={() => setTab('NOT_GOING')}
                className={`px-4 py-2 rounded-ds2-max ds2-b16 transition ${
                  tab === 'NOT_GOING' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                Not going ({notGoingList.length})
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search attendees..."
                  className="pl-9 pr-3 py-1.5 rounded-ds2-max border border-gray-300 ds2-r14"
                />
              </div>

              <select
                aria-label="Sort attendees"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1.5 rounded-ds2-max border border-gray-300 ds2-m13 bg-white"
              >
                <option value="RECENT">Sort: RSVP time</option>
                <option value="NAME">Sort: Name (A-Z)</option>
              </select>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {filteredList.map((r: any) => (
              <div key={r.id} className="py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <img
                    src={r.user.avatarUrl}
                    alt={r.user.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/members/${r.user.memberId}`}
                        className="ds2-b16 text-gray-900 hover:text-[#00798A]"
                      >
                        {r.user.name}
                      </Link>
                      {r.userId === event.hostId && (
                        <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 ds2-b12">
                          Event Host
                        </span>
                      )}
                      {r.guestsCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 ds2-m12">
                          +{r.guestsCount} guest{r.guestsCount > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    <p className="ds2-r12 text-gray-500">{r.user.bio || `${r.user.city}, ${r.user.state}`}</p>
                  </div>
                </div>

                <Link
                  href="/messages"
                  className="px-3.5 py-1.5 rounded-ds2-max border border-gray-300 hover:border-gray-900 ds2-m13 flex items-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Message
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      <MeetupPlusModal isOpen={plusOpen} onClose={() => setPlusOpen(false)} />
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const user = await getActiveUser(ctx.req, ctx.res);
  const eventIdParam = ctx.params?.eventId as string;

  let event = await prisma.event.findFirst({
    where: { OR: [{ eventId: eventIdParam }, { id: eventIdParam }] },
    include: {
      group: true,
      rsvps: { include: { user: true } },
    },
  });

  if (!event) {
    event = await prisma.event.findFirst({
      include: {
        group: true,
        rsvps: { include: { user: true } },
      },
    });
  }

  return {
    props: {
      user: JSON.parse(JSON.stringify(user)),
      event: JSON.parse(JSON.stringify(event)),
    },
  };
};
