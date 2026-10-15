import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type { GetServerSideProps } from 'next';
import {
  ChevronDown,
  MapPin,
  Video,
  Users,
  Bookmark,
  Share2,
  Calendar,
  SlidersHorizontal,
  RotateCcw,
  Star,
} from 'lucide-react';
import Layout from '@/components/Layout';
import ShareModal from '@/components/ShareModal';
import { prisma } from '@/lib/prisma';
import { getActiveUser } from '@/lib/auth-helper';
import { gqlRequest } from '@/lib/gqlClient';

export function FindExperience({
  user,
  events,
  groups,
  categories,
  initialSource,
  initialKeywords,
  initialLocation,
  initialType,
  initialCategory,
  initialDistance,
  initialSavedIds,
}: {
  user: any;
  events: any[];
  groups: any[];
  categories: any[];
  initialSource: 'EVENTS' | 'GROUPS';
  initialKeywords: string;
  initialLocation: string;
  initialType: 'ALL' | 'IN_PERSON' | 'ONLINE';
  initialCategory: string;
  initialDistance: string;
  initialSavedIds: string[];
}) {
  const router = useRouter();
  const [sourceTab, setSourceTab] = useState<'EVENTS' | 'GROUPS'>(initialSource);
  const [timeFilter, setTimeFilter] = useState<string>('Any time');
  const [customDateStart, setCustomDateStart] = useState('2026-10-16');
  const [customDateEnd, setCustomDateEnd] = useState('2026-10-25');
  const [attendeeFilter, setAttendeeFilter] = useState<string>('Any size');
  const [venueFilter, setVenueFilter] = useState<'ALL' | 'IN_PERSON' | 'ONLINE'>(initialType);
  const [distanceFilter, setDistanceFilter] = useState<string>(initialDistance || '25 miles');
  const [sortBy, setSortBy] = useState<'RELEVANCE' | 'DATE'>('RELEVANCE');
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'all');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<string[]>(initialSavedIds);
  const [shareItem, setShareItem] = useState<any | null>(null);

  const kw = ((router.query.keywords as string) || initialKeywords || '').trim().toLowerCase();

  const filteredEvents = events
    .filter((ev) => {
      if (kw && !ev.title.toLowerCase().includes(kw) && !ev.description.toLowerCase().includes(kw)) {
        return false;
      }
      if (venueFilter === 'ONLINE' && ev.eventType !== 'ONLINE') return false;
      if (venueFilter === 'IN_PERSON' && ev.eventType !== 'IN_PERSON') return false;
      if (selectedCategory !== 'all' && selectedCategory !== 'new-groups') {
        const groupHasCat = ev.group?.topics?.some(
          (gt: any) => gt.topic?.category?.urlkey === selectedCategory
        );
        if (!groupHasCat && ev.category !== selectedCategory) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'DATE') {
        return new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime();
      }
      return b.rsvps.length - a.rsvps.length;
    });

  const filteredGroups = groups.filter((g) => {
    if (kw && !g.name.toLowerCase().includes(kw) && !g.description.toLowerCase().includes(kw)) {
      return false;
    }
    if (selectedCategory !== 'all' && selectedCategory !== 'new-groups') {
      const hasCat = g.topics?.some((gt: any) => gt.topic?.category?.urlkey === selectedCategory);
      if (!hasCat) return false;
    }
    return true;
  });

  const resetAllFilters = () => {
    setTimeFilter('Any time');
    setAttendeeFilter('Any size');
    setVenueFilter('ALL');
    setDistanceFilter('25 miles');
    setSortBy('RELEVANCE');
    setSelectedCategory('all');
    setOpenDropdown(null);
  };

  return (
    <Layout user={user}>
      <Head>
        <title>
          Find {sourceTab === 'EVENTS' ? 'Events' : 'Groups'} near {initialLocation} | Meetup
        </title>
      </Head>

      <div className="max-w-[1200px] mx-auto px-4 lg:px-6 pt-6 space-y-6">
        {/* Heading + Events / Groups Switcher Tabs */}
        <div className="space-y-4">
          <h1 className="ds2-b32 text-gray-900">
            {venueFilter === 'ONLINE'
              ? 'Online events'
              : `${sourceTab === 'EVENTS' ? 'Events' : 'Groups'} near ${initialLocation}`}
          </h1>

          <div className="flex items-center gap-6 border-b border-gray-200">
            <button
              type="button"
              onClick={() => {
                setSourceTab('EVENTS');
                router.push(
                  { pathname: '/find', query: { ...router.query, source: 'EVENTS' } },
                  undefined,
                  { shallow: true }
                );
              }}
              className={`pb-3 ds2-b20 border-b-2 transition ${
                sourceTab === 'EVENTS'
                  ? 'border-[#00798A] text-[#00798A]'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              Events ({filteredEvents.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setSourceTab('GROUPS');
                router.push(
                  { pathname: '/find', query: { ...router.query, source: 'GROUPS' } },
                  undefined,
                  { shallow: true }
                );
              }}
              className={`pb-3 ds2-b20 border-b-2 transition ${
                sourceTab === 'GROUPS'
                  ? 'border-[#00798A] text-[#00798A]'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              Groups ({filteredGroups.length})
            </button>
          </div>
        </div>

        {/* Revamped Filter Bar */}
        <div className="flex flex-wrap items-center gap-2.5 relative z-20">
          {sourceTab === 'EVENTS' && (
            <>
              {/* Any time dropdown */}
              <div className="relative">
                <button
                  type="button"
                  data-testid="RevampedFilterButtonTime"
                  onClick={() => setOpenDropdown(openDropdown === 'time' ? null : 'time')}
                  className={`px-4 py-2 rounded-ds2-max border ds2-m14 flex items-center gap-1.5 transition ${
                    timeFilter !== 'Any time'
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white border-gray-300 text-gray-800 hover:border-gray-900'
                  }`}
                >
                  <span>{timeFilter}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                {openDropdown === 'time' && (
                  <div className="absolute left-0 mt-2 w-72 bg-white rounded-ds2-20 shadow-ds2-lg-default border border-gray-200 p-4 space-y-2 z-30">
                    {[
                      'Any time',
                      'Today',
                      'Tomorrow',
                      'This week',
                      'This weekend',
                      'Next week',
                      'Custom',
                    ].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => {
                          setTimeFilter(opt);
                          if (opt !== 'Custom') setOpenDropdown(null);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-ds2-12 ds2-m14 flex items-center justify-between ${
                          timeFilter === opt ? 'bg-gray-900 text-white' : 'hover:bg-gray-100 text-gray-800'
                        }`}
                      >
                        <span>{opt}</span>
                      </button>
                    ))}
                    {timeFilter === 'Custom' && (
                      <div className="pt-2 border-t border-gray-100 space-y-2">
                        <label className="block ds2-m12 text-gray-500">Start & End Date</label>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="date"
                            value={customDateStart}
                            onChange={(e) => setCustomDateStart(e.target.value)}
                            className="px-2 py-1.5 rounded-lg border border-gray-300 ds2-r12"
                          />
                          <input
                            type="date"
                            value={customDateEnd}
                            onChange={(e) => setCustomDateEnd(e.target.value)}
                            className="px-2 py-1.5 rounded-lg border border-gray-300 ds2-r12"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => setOpenDropdown(null)}
                          className="w-full py-2 rounded-ds2-max bg-gray-900 text-white ds2-m13"
                        >
                          Apply custom dates
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Attendee count dropdown */}
              <div className="relative">
                <button
                  type="button"
                  data-testid="RevampedFilterButtonAttendeeCount"
                  onClick={() => setOpenDropdown(openDropdown === 'attendees' ? null : 'attendees')}
                  className={`px-4 py-2 rounded-ds2-max border ds2-m14 flex items-center gap-1.5 transition ${
                    attendeeFilter !== 'Any size'
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white border-gray-300 text-gray-800 hover:border-gray-900'
                  }`}
                >
                  <span>{attendeeFilter === 'Any size' ? 'Attendee count' : attendeeFilter}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                {openDropdown === 'attendees' && (
                  <div className="absolute left-0 mt-2 w-56 bg-white rounded-ds2-20 shadow-ds2-lg-default border border-gray-200 p-3 space-y-1 z-30">
                    {['Any size', 'Less than 15', '15 - 50', '50 - 100', '100+'].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => {
                          setAttendeeFilter(opt);
                          setOpenDropdown(null);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-ds2-12 ds2-m14 ${
                          attendeeFilter === opt ? 'bg-gray-900 text-white' : 'hover:bg-gray-100 text-gray-800'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Venue type dropdown (In person / Online) */}
              <div className="relative">
                <button
                  type="button"
                  data-testid="RevampedFilterButtonVenue"
                  onClick={() => setOpenDropdown(openDropdown === 'venue' ? null : 'venue')}
                  className={`px-4 py-2 rounded-ds2-max border ds2-m14 flex items-center gap-1.5 transition ${
                    venueFilter !== 'ALL'
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white border-gray-300 text-gray-800 hover:border-gray-900'
                  }`}
                >
                  <span>
                    {venueFilter === 'ALL'
                      ? 'Event type'
                      : venueFilter === 'ONLINE'
                        ? 'Online'
                        : 'In person'}
                  </span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                {openDropdown === 'venue' && (
                  <div className="absolute left-0 mt-2 w-52 bg-white rounded-ds2-20 shadow-ds2-lg-default border border-gray-200 p-3 space-y-1 z-30">
                    {[
                      { id: 'ALL', label: 'All types' },
                      { id: 'IN_PERSON', label: 'In person' },
                      { id: 'ONLINE', label: 'Online' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setVenueFilter(opt.id as any);
                          setOpenDropdown(null);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-ds2-12 ds2-m14 ${
                          venueFilter === opt.id ? 'bg-gray-900 text-white' : 'hover:bg-gray-100 text-gray-800'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Distance dropdown */}
          <div className="relative">
            <button
              type="button"
              data-testid="RevampedFilterButtonDistance"
              onClick={() => setOpenDropdown(openDropdown === 'distance' ? null : 'distance')}
              className="px-4 py-2 rounded-ds2-max border border-gray-300 bg-white text-gray-800 hover:border-gray-900 ds2-m14 flex items-center gap-1.5 transition"
            >
              <span>{distanceFilter}</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            {openDropdown === 'distance' && (
              <div className="absolute left-0 mt-2 w-52 bg-white rounded-ds2-20 shadow-ds2-lg-default border border-gray-200 p-3 space-y-1 z-30">
                {[
                  '2 miles',
                  '5 miles',
                  '10 miles',
                  '25 miles',
                  '50 miles',
                  '100 miles',
                  'Any distance',
                ].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      setDistanceFilter(opt);
                      setOpenDropdown(null);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-ds2-12 ds2-m14 ${
                      distanceFilter === opt ? 'bg-gray-900 text-white' : 'hover:bg-gray-100 text-gray-800'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sort by */}
          {sourceTab === 'EVENTS' && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === 'sort' ? null : 'sort')}
                className="px-4 py-2 rounded-ds2-max border border-gray-300 bg-white text-gray-800 hover:border-gray-900 ds2-m14 flex items-center gap-1.5 transition"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Sort by: {sortBy === 'RELEVANCE' ? 'Relevance' : 'Date'}</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              {openDropdown === 'sort' && (
                <div className="absolute left-0 mt-2 w-48 bg-white rounded-ds2-20 shadow-ds2-lg-default border border-gray-200 p-3 space-y-1 z-30">
                  <button
                    type="button"
                    onClick={() => {
                      setSortBy('RELEVANCE');
                      setOpenDropdown(null);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-ds2-12 ds2-m14 ${
                      sortBy === 'RELEVANCE' ? 'bg-gray-900 text-white' : 'hover:bg-gray-100'
                    }`}
                  >
                    Relevance
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSortBy('DATE');
                      setOpenDropdown(null);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-ds2-12 ds2-m14 ${
                      sortBy === 'DATE' ? 'bg-gray-900 text-white' : 'hover:bg-gray-100'
                    }`}
                  >
                    Date
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Reset filters */}
          <button
            type="button"
            onClick={resetAllFilters}
            className="px-3.5 py-2 rounded-ds2-max text-[#00798A] hover:bg-teal-50 ds2-m13 flex items-center gap-1 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset filters
          </button>
        </div>

        {/* Horizontal 20+ Category Filter Strip */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-ds2-max ds2-m13 shrink-0 transition ${
              selectedCategory === 'all'
                ? 'bg-gray-900 text-white'
                : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-900'
            }`}
          >
            All categories
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('new-groups')}
            className={`px-4 py-2 rounded-ds2-max ds2-m13 shrink-0 transition ${
              selectedCategory === 'new-groups'
                ? 'bg-gray-900 text-white'
                : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-900'
            }`}
          >
            ✨ New Groups
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.urlkey)}
              className={`px-4 py-2 rounded-ds2-max ds2-m13 shrink-0 transition ${
                selectedCategory === cat.urlkey
                  ? 'bg-gray-900 text-white'
                  : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-900'
              }`}
            >
              {cat.iconEmoji} {cat.name}
            </button>
          ))}
        </div>

        {/* Results Feed */}
        {sourceTab === 'EVENTS' ? (
          <div className="space-y-4">
            {filteredEvents.map((ev) => {
              const isSaved = savedIds.includes(ev.id);
              const dateFormatted = new Date(ev.dateTime).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              });
              return (
                <div
                  key={ev.id}
                  className="bg-white rounded-ds2-24 border border-gray-200 p-5 hover:shadow-ds2-sm transition flex flex-col sm:flex-row items-start justify-between gap-5"
                >
                  <div className="flex flex-col sm:flex-row items-start gap-5 flex-1">
                    <Link
                      href={`/${ev.group.urlname}/events/${ev.eventId}`}
                      className="relative w-full sm:w-48 h-32 rounded-ds2-16 overflow-hidden shrink-0"
                    >
                      <img
                        src={ev.coverImage}
                        alt={ev.title}
                        className="w-full h-full object-cover hover:scale-105 transition duration-300"
                      />
                      <span className="absolute top-2 left-2 px-2.5 py-0.5 rounded-ds2-max bg-black/75 text-white ds2-m11 flex items-center gap-1">
                        {ev.eventType === 'ONLINE' ? (
                          <>
                            <Video className="w-3 h-3 text-teal-300" /> Online
                          </>
                        ) : (
                          <>
                            <MapPin className="w-3 h-3 text-rose-300" /> {ev.venueCity}
                          </>
                        )}
                      </span>
                    </Link>

                    <div className="space-y-1.5">
                      <p className="ds2-k13 text-[#00798A] uppercase">{dateFormatted} PDT</p>
                      <Link
                        href={`/${ev.group.urlname}/events/${ev.eventId}`}
                        className="ds2-b20 text-gray-900 hover:text-[#00798A] transition block"
                      >
                        {ev.title}
                      </Link>
                      <Link
                        href={`/${ev.group.urlname}`}
                        className="ds2-m13 text-gray-600 hover:underline block"
                      >
                        {ev.group.name} · {ev.group.city}, {ev.group.state} · ★ {ev.group.rating}
                      </Link>
                      <p className="ds2-r14 text-gray-500 line-clamp-2 max-w-2xl">{ev.description}</p>
                      <div className="flex items-center gap-4 pt-1 ds2-m12 text-gray-500">
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {ev.rsvps.length + 12} attendees
                        </span>
                        {ev.feeAmount === 0 ? (
                          <span className="text-emerald-700 font-bold">Free</span>
                        ) : (
                          <span className="text-amber-700 font-bold">${ev.feeAmount}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-start shrink-0">
                    <button
                      type="button"
                      aria-label="Share event"
                      onClick={() => setShareItem(ev)}
                      className="p-2.5 rounded-full border border-gray-200 hover:border-gray-900 text-gray-700"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      aria-label="Bookmark event"
                      onClick={async () => {
                        if (isSaved) {
                          await gqlRequest('unsaveEvent', { input: { eventId: ev.eventId } });
                          setSavedIds(savedIds.filter((id) => id !== ev.id));
                        } else {
                          await gqlRequest('saveEvent', { input: { eventId: ev.eventId } });
                          setSavedIds([...savedIds, ev.id]);
                        }
                      }}
                      className="p-2.5 rounded-full border border-gray-200 hover:border-gray-900 text-gray-700"
                    >
                      <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-[#E51937] text-[#E51937]' : ''}`} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredGroups.map((g) => (
              <Link
                key={g.id}
                href={`/${g.urlname}`}
                className="bg-white rounded-ds2-24 border border-gray-200 p-5 hover:border-gray-900 transition flex items-start gap-4"
              >
                <img
                  src={g.coverImage}
                  alt={g.name}
                  className="w-24 h-24 rounded-ds2-16 object-cover shrink-0"
                />
                <div className="space-y-1 min-w-0">
                  {g.isNewGroup && (
                    <span className="inline-block px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 ds2-b12">
                      New Group
                    </span>
                  )}
                  <h2 className="ds2-b20 text-gray-900 truncate">{g.name}</h2>
                  <p className="ds2-m13 text-[#00798A]">
                    {g.city}, {g.state}
                  </p>
                  <p className="ds2-r14 text-gray-500 line-clamp-2">{g.description}</p>
                  <div className="flex items-center gap-3 pt-1 ds2-m12 text-gray-600">
                    <span>{g.membersCount.toLocaleString()} members</span>
                    <span>·</span>
                    <span className="capitalize">
                      {(g.privacy || (g.isPrivate ? 'Private' : 'Public')).toLowerCase()} group
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1 text-amber-600">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      {g.rating}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {shareItem && (
        <ShareModal
          isOpen={Boolean(shareItem)}
          onClose={() => setShareItem(null)}
          title={shareItem.title}
          subtitle={shareItem.group?.name}
          url={`/${shareItem.group?.urlname}/events/${shareItem.eventId}`}
          venueStr={`${shareItem.venueName} · ${shareItem.venueCity}`}
        />
      )}
    </Layout>
  );
}

export default function FindPage(props: any) {
  return <FindExperience {...props} />;
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const user = await getActiveUser(ctx.req, ctx.res);
  const events = await prisma.event.findMany({
    where: { status: 'UPCOMING' },
    include: {
      group: { include: { topics: { include: { topic: { include: { category: true } } } } } },
      rsvps: true,
    },
    orderBy: { dateTime: 'asc' },
  });

  const groups = await prisma.group.findMany({
    where: { isDraft: false },
    include: { topics: { include: { topic: { include: { category: true } } } } },
    orderBy: { membersCount: 'desc' },
  });

  const categories = await prisma.topicCategory.findMany({
    orderBy: { name: 'asc' },
  });

  const saved = user
    ? await prisma.savedEvent.findMany({ where: { userId: user.id } })
    : [];

  const initialSource = ctx.query.source === 'GROUPS' ? 'GROUPS' : 'EVENTS';
  const initialKeywords = (ctx.query.keywords as string) || '';
  const initialLocation = (ctx.query.location as string) || 'San Francisco, CA';
  const initialType =
    ctx.query.type === 'online'
      ? 'ONLINE'
      : ctx.query.type === 'inPerson'
        ? 'IN_PERSON'
        : 'ALL';
  const initialCategory = (ctx.query.category as string) || 'all';
  const initialDistance = (ctx.query.distance as string) || '25 miles';

  return {
    props: {
      user: JSON.parse(JSON.stringify(user)),
      events: JSON.parse(JSON.stringify(events)),
      groups: JSON.parse(JSON.stringify(groups)),
      categories: JSON.parse(JSON.stringify(categories)),
      initialSource,
      initialKeywords,
      initialLocation,
      initialType,
      initialCategory,
      initialDistance,
      initialSavedIds: saved.map((s) => s.eventId),
    },
  };
};
