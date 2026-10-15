import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import type { GetServerSideProps } from 'next';
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  Share2,
  Bookmark,
  Flag,
  Users,
  Sparkles,
  CheckCircle2,
  Star,
  ExternalLink,
  X,
  Plus,
} from 'lucide-react';
import Layout from '@/components/Layout';
import ShareModal from '@/components/ShareModal';
import AddToCalendarModal from '@/components/AddToCalendarModal';
import ReportModal from '@/components/ReportModal';
import MeetupPlusModal from '@/components/MeetupPlusModal';
import { prisma } from '@/lib/prisma';
import { getActiveUser } from '@/lib/auth-helper';
import { gqlRequest } from '@/lib/gqlClient';

export default function EventDetailPage({
  user,
  event,
  initialIsSaved,
  initialRsvp,
  similarEvents,
}: {
  user: any;
  event: any;
  initialIsSaved: boolean;
  initialRsvp: any | null;
  similarEvents: any[];
}) {
  const [readMore, setReadMore] = useState(false);
  const [isSaved, setIsSaved] = useState(initialIsSaved);
  const [rsvpState, setRsvpState] = useState<any | null>(initialRsvp);
  const [guestModalOpen, setGuestModalOpen] = useState(false);
  const [proEmailModalOpen, setProEmailModalOpen] = useState(false);
  const [postRsvpModalOpen, setPostRsvpModalOpen] = useState(false);
  const [selectedGuestsCount, setSelectedGuestsCount] = useState<number>(initialRsvp?.guestsCount || 0);
  const [shareOpen, setShareOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [plusOpen, setPlusOpen] = useState(false);

  const isGoing = rsvpState?.status === 'YES';

  const handleAttendClick = () => {
    if (event.shareEmailPrompt || event.group?.isProNetwork || event.group?.isPro) {
      setProEmailModalOpen(true);
    } else if ((event.guestLimit ?? event.maxGuests ?? 2) > 0) {
      setGuestModalOpen(true);
    } else {
      submitRsvp('YES', 0, false);
    }
  };

  const submitRsvp = async (status: 'YES' | 'NO', guestsCount: number, sharedEmail: boolean) => {
    const res = await gqlRequest('rsvpEvent', {
      input: {
        eventId: event.eventId,
        status,
        guestsCount,
        sharedEmail,
      },
    });
    const updated = res?.data?.rsvpEvent?.rsvp;
    if (status === 'YES') {
      setRsvpState(updated || { status: 'YES', guestsCount, sharedEmail });
      setGuestModalOpen(false);
      setProEmailModalOpen(false);
      setPostRsvpModalOpen(true);
    } else {
      setRsvpState({ status: 'NO', guestsCount: 0 });
      setGuestModalOpen(false);
      setPostRsvpModalOpen(false);
    }
  };

  const handleToggleSave = async () => {
    if (isSaved) {
      await gqlRequest('unsaveEvent', { input: { eventId: event.eventId } });
      setIsSaved(false);
    } else {
      await gqlRequest('saveEvent', { input: { eventId: event.eventId } });
      setIsSaved(true);
    }
  };

  const dateObj = new Date(event.dateTime);
  const endObj = new Date(event.endTime);
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const formattedTime = `${dateObj.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })} to ${endObj.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })} PDT`;

  const goingRsvps = event.rsvps.filter((r: any) => r.status === 'YES');
  const totalGoingCount = goingRsvps.length + (isGoing && !initialRsvp ? 1 : 0) + 12;

  return (
    <Layout user={user}>
      <Head>
        <title>
          {event.title} | {event.group.name} | Meetup
        </title>
      </Head>

      {/* Top Event Header Banner */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1200px] mx-auto px-4 lg:px-6 py-6">
          <p className="ds2-k13 text-[#00798A] uppercase">{formattedDate}</p>
          <h1 className="ds2-b32 text-gray-900 mt-1">{event.title}</h1>

          <div className="flex flex-wrap items-center justify-between gap-4 mt-4">
            <div className="flex items-center gap-3">
              <img
                src={event.host.avatarUrl}
                alt={event.host.name}
                className="w-12 h-12 rounded-full object-cover border border-gray-200"
              />
              <div>
                <p className="ds2-r12 text-gray-500">Hosted by</p>
                <Link
                  href={`/members/${event.host.memberId}`}
                  className="ds2-b16 text-gray-900 hover:underline"
                >
                  {event.host.name}
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setShareOpen(true)}
                className="px-4 py-2 rounded-ds2-max border border-gray-300 hover:border-gray-900 ds2-m14 flex items-center gap-1.5"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
              <button
                type="button"
                onClick={handleToggleSave}
                className={`px-4 py-2 rounded-ds2-max border ds2-m14 flex items-center gap-1.5 ${
                  isSaved
                    ? 'border-[#E51937] text-[#E51937] bg-rose-50'
                    : 'border-gray-300 hover:border-gray-900 text-gray-800'
                }`}
              >
                <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-[#E51937]' : ''}`} />
                {isSaved ? 'Saved' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="max-w-[1200px] mx-auto px-4 lg:px-6 py-8 pb-28 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Hero Photo, Details, Attendees, Share Flyer, Report */}
        <div className="lg:col-span-8 space-y-8">
          <div className="rounded-ds2-28 overflow-hidden border border-gray-200 bg-white shadow-xs">
            <img
              src={event.coverImage}
              alt={event.title}
              className="w-full h-[360px] object-cover"
            />
          </div>

          {/* Details Section with Read more / Read less toggle */}
          <section className="bg-white rounded-ds2-24 border border-gray-200 p-6 sm:p-8 space-y-4">
            <h2 className="ds2-b24 text-gray-900">Details</h2>
            <div
              className={`ds2-r16 text-gray-700 whitespace-pre-line leading-relaxed ${
                !readMore ? 'line-clamp-4' : ''
              }`}
            >
              {event.description}
            </div>
            <button
              type="button"
              onClick={() => setReadMore(!readMore)}
              className="ds2-b16 text-[#00798A] hover:underline"
            >
              {readMore ? 'Read less' : 'Read more'}
            </button>

            <div className="pt-4 border-t border-gray-100 flex flex-wrap gap-2">
              {event.group.topics?.map((gt: any) => (
                <Link
                  key={gt.id}
                  href={`/topics/${gt.topic.urlkey}`}
                  className="px-3.5 py-1.5 rounded-ds2-max bg-gray-100 hover:bg-gray-200 ds2-m13 text-gray-700 transition"
                >
                  {gt.topic.name}
                </Link>
              ))}
            </div>
          </section>

          {/* Share a Flyer Promo Card */}
          <section className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-ds2-24 border border-teal-200 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="ds2-k13 text-[#00798A] uppercase">Spread the word</span>
              <h3 className="ds2-b20 text-gray-900">Invite friends with a custom printable flyer</h3>
              <p className="ds2-r14 text-gray-600">
                Download a sleek event poster with a scannable QR code in light or dark mode.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShareOpen(true)}
              className="px-5 py-2.5 rounded-ds2-max bg-gray-900 text-white ds2-b16 shrink-0 hover:bg-black transition"
            >
              Share a flyer
            </button>
          </section>

          {/* Attendees Section + Meetup+ Upsell Banner */}
          <section className="bg-white rounded-ds2-24 border border-gray-200 p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="ds2-b24 text-gray-900">Attendees ({totalGoingCount})</h2>
              <Link
                href={`/${event.group.urlname}/events/${event.eventId}/attendees`}
                className="ds2-b16 text-[#00798A] hover:underline"
              >
                See all
              </Link>
            </div>

            {/* Meetup+ Upsell Banner inside Attendees */}
            <div className="rounded-ds2-20 bg-gradient-to-r from-[#141416] via-[#3B0764] to-[#D91B5C] p-5 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/15 ds2-m11 uppercase">
                  <Sparkles className="w-3 h-3 text-amber-300" /> Meetup+ Subscriber Perk
                </span>
                <p className="ds2-b16">See who you have common interests with before you arrive</p>
                <p className="ds2-r12 text-white/80">
                  Unlock full attendee bios, shared groups, and direct messaging.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPlusOpen(true)}
                className="px-4 py-2 rounded-ds2-max bg-white text-gray-900 ds2-b12 shrink-0 hover:bg-gray-100 transition"
              >
                Start 7-day free trial
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {goingRsvps.slice(0, 8).map((r: any) => (
                <Link
                  key={r.id}
                  href={`/members/${r.user.memberId}`}
                  className="p-4 rounded-ds2-20 border border-gray-200 hover:border-gray-900 transition text-center space-y-2"
                >
                  <img
                    src={r.user.avatarUrl}
                    alt={r.user.name}
                    className="w-16 h-16 rounded-full mx-auto object-cover"
                  />
                  <div>
                    <p className="ds2-b16 text-gray-900 truncate">{r.user.name}</p>
                    <p className="ds2-m11 text-[#00798A] uppercase">
                      {r.userId === event.hostId ? 'Event Host' : 'Member'}
                    </p>
                    {r.guestsCount > 0 && (
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-gray-100 ds2-m11 text-gray-700">
                        +{r.guestsCount} guest{r.guestsCount > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Report Event Link */}
          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={() => setReportOpen(true)}
              className="inline-flex items-center gap-1.5 ds2-m13 text-gray-500 hover:text-rose-600 transition"
            >
              <Flag className="w-4 h-4" />
              Report event
            </button>
          </div>
        </div>

        {/* Right Sticky Column: Group Card, Time/Venue/Map Card */}
        <aside className="lg:col-span-4 space-y-5">
          {/* Group Summary Card */}
          <Link
            href={`/${event.group.urlname}`}
            className="block bg-white rounded-ds2-24 border border-gray-200 p-5 hover:border-gray-900 transition shadow-xs"
          >
            <div className="flex items-center gap-4">
              <img
                src={event.group.coverImage}
                alt={event.group.name}
                className="w-16 h-16 rounded-ds2-16 object-cover shrink-0"
              />
              <div className="min-w-0">
                {(event.group.isProNetwork || event.group.isPro) && (
                  <span className="inline-block px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-900 ds2-b12 mb-1">
                    Meetup Pro Network
                  </span>
                )}
                <h3 className="ds2-b16 text-gray-900 truncate">{event.group.name}</h3>
                <p className="ds2-r12 text-gray-500 capitalize">
                  {(event.group.privacy || (event.group.isPrivate ? 'Private' : 'Public')).toLowerCase()} group · ★ {event.group.rating} (
                  {event.group.ratingsCount})
                </p>
              </div>
            </div>
          </Link>

          {/* Time & Location Card */}
          <div className="bg-white rounded-ds2-24 border border-gray-200 p-6 space-y-5 shadow-xs">
            <div className="flex items-start gap-3.5">
              <Clock className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
              <div>
                <p className="ds2-b16 text-gray-900">{formattedDate}</p>
                <p className="ds2-r14 text-gray-600">{formattedTime}</p>
                <button
                  type="button"
                  onClick={() => setCalendarOpen(true)}
                  className="mt-1.5 ds2-m13 text-[#00798A] hover:underline"
                >
                  + Add to calendar
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex items-start gap-3.5">
              {event.eventType === 'ONLINE' ? (
                <>
                  <Video className="w-5 h-5 text-[#00798A] shrink-0 mt-0.5" />
                  <div>
                    <p className="ds2-b16 text-gray-900">Online event</p>
                    <p className="ds2-r14 text-gray-600">
                      {isGoing
                        ? `Link: ${event.onlineUrl || 'https://zoom.us/j/meetup-live'}`
                        : 'Link visible for attendees after RSVP'}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <MapPin className="w-5 h-5 text-[#E51937] shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="ds2-b16 text-gray-900">{event.venueName}</p>
                    <p className="ds2-r14 text-gray-600">
                      {event.venueAddress} · {event.venueCity}, {event.venueState}
                    </p>
                    {event.howToFindUs && (
                      <div className="mt-2 p-3 rounded-ds2-12 bg-gray-50 border border-gray-200 ds2-r12 text-gray-700">
                        <strong>How to find us:</strong> {event.howToFindUs}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {event.eventType === 'IN_PERSON' && (
              <div className="rounded-ds2-16 overflow-hidden border border-gray-200 bg-gray-100 p-4 text-center space-y-2">
                <p className="ds2-m12 text-gray-700">
                  📍 {event.venueLat?.toFixed(4)}, {event.venueLng?.toFixed(4)} ({event.venueCity})
                </p>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    `${event.venueName} ${event.venueAddress} ${event.venueCity}`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 ds2-m12 text-[#00798A] hover:underline"
                >
                  Open in Google Maps <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Bottom Sticky RSVP Action Bar */}
      <div className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 py-4 px-4 lg:px-6 z-40 shadow-ds2-lg-default">
        <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="ds2-k13 text-gray-500 uppercase">{formattedDate}</p>
            <p className="ds2-b16 text-gray-900">{event.title}</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="ds2-b16 text-gray-900">
                {event.feeAmount === 0 ? 'FREE' : `$${event.feeAmount}`}
              </p>
              <p className="ds2-r12 text-gray-500">
                {event.rsvpLimit ? `${event.rsvpLimit - totalGoingCount} spots left` : 'Spots available'}
              </p>
            </div>

            {isGoing ? (
              <div className="flex items-center gap-2">
                <span className="px-4 py-2.5 rounded-ds2-max bg-emerald-100 text-emerald-900 ds2-b16 flex items-center gap-1.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                  You are going!
                  {rsvpState?.guestsCount > 0 && ` (+${rsvpState.guestsCount})`}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (event.guestLimit > 0) setGuestModalOpen(true);
                    else setPostRsvpModalOpen(true);
                  }}
                  className="px-4 py-2.5 rounded-ds2-max border border-gray-300 hover:border-gray-900 ds2-m14"
                >
                  Edit RSVP
                </button>
                <button
                  type="button"
                  onClick={() => submitRsvp('NO', 0, false)}
                  className="px-4 py-2.5 rounded-ds2-max border border-rose-200 text-rose-700 hover:bg-rose-50 ds2-m14"
                >
                  Cancel RSVP
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleAttendClick}
                className="px-8 py-3 rounded-ds2-max bg-[#E51937] hover:bg-[#c8142f] text-white ds2-b16 transition"
              >
                {event.eventType === 'ONLINE' ? 'Attend online' : 'Attend'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modal 1: In-Person Guest Count RSVP Dialog (0, +1, +2 guests) */}
      {guestModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-ds2-28 max-w-md w-full p-6 shadow-ds2-lg-default relative space-y-5">
            <button
              type="button"
              onClick={() => setGuestModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
            <div>
              <h2 className="ds2-b24 text-gray-900">Bringing any guests?</h2>
              <p className="ds2-r14 text-gray-500 mt-1">
                Host allows up to {event.guestLimit} guests per member for this event.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[0, 1, 2].map((cnt) => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => setSelectedGuestsCount(cnt)}
                  className={`py-4 rounded-ds2-16 border-2 ds2-b20 transition ${
                    selectedGuestsCount === cnt
                      ? 'border-gray-900 bg-gray-900 text-white'
                      : 'border-gray-200 text-gray-800 hover:border-gray-400'
                  }`}
                >
                  {cnt === 0 ? 'Just me (0)' : `+${cnt}`}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => submitRsvp('YES', selectedGuestsCount, false)}
              className="w-full py-3.5 rounded-ds2-max bg-[#E51937] hover:bg-[#c8142f] text-white ds2-b16 transition"
            >
              Confirm RSVP
            </button>
          </div>
        </div>
      )}

      {/* Modal 2: Online Meetup Pro Email-Sharing RSVP Dialog */}
      {proEmailModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-ds2-28 max-w-md w-full p-6 shadow-ds2-lg-default relative space-y-5">
            <button
              type="button"
              onClick={() => setProEmailModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
            <div>
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-900 ds2-b12 mb-2">
                Meetup Pro Event
              </span>
              <h2 className="ds2-b24 text-gray-900">Share your email with {event.group.name}?</h2>
              <p className="ds2-r14 text-gray-600 mt-1">
                {event.group.proNetworkName || event.group.name} would like your email ({user.email}) to send slides, workshop recordings, and career resources.
              </p>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => submitRsvp('YES', 0, true)}
                className="w-full py-3.5 rounded-ds2-max bg-gray-900 hover:bg-black text-white ds2-b16 transition"
              >
                Yes, share my email
              </button>
              <button
                type="button"
                onClick={() => submitRsvp('YES', 0, false)}
                className="w-full py-3 rounded-ds2-max border border-gray-300 hover:border-gray-900 ds2-m14 text-gray-700 transition"
              >
                Continue without sharing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Post-RSVP Confirmation Modal ("Got Plans!") */}
      {postRsvpModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-ds2-28 max-w-lg w-full p-6 shadow-ds2-lg-default relative space-y-5">
            <button
              type="button"
              onClick={() => setPostRsvpModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <h2 className="ds2-b24 text-gray-900">Got Plans! You&apos;re going.</h2>
                <p className="ds2-r14 text-gray-600">{event.title}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setPostRsvpModalOpen(false);
                  setCalendarOpen(true);
                }}
                className="px-4 py-2.5 rounded-ds2-max bg-gray-900 text-white ds2-m14 flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Add to calendar
              </button>
              <button
                type="button"
                onClick={() => {
                  setPostRsvpModalOpen(false);
                  setShareOpen(true);
                }}
                className="px-4 py-2.5 rounded-ds2-max border border-gray-300 hover:border-gray-900 ds2-m14 flex items-center gap-1.5"
              >
                <Share2 className="w-4 h-4" />
                Invite friends
              </button>
              <button
                type="button"
                onClick={() => submitRsvp('NO', 0, false)}
                className="px-4 py-2.5 rounded-ds2-max text-rose-600 hover:bg-rose-50 ds2-m14"
              >
                Change RSVP to Not Going
              </button>
            </div>

            {similarEvents.length > 0 && (
              <div className="pt-4 border-t border-gray-100 space-y-3">
                <h3 className="ds2-b16 text-gray-900">Keep the momentum going — similar events</h3>
                <div className="space-y-2.5">
                  {similarEvents.slice(0, 2).map((se: any) => (
                    <Link
                      key={se.id}
                      href={`/${se.group.urlname}/events/${se.eventId}`}
                      onClick={() => setPostRsvpModalOpen(false)}
                      className="flex items-center gap-3 p-2.5 rounded-ds2-16 border border-gray-200 hover:border-gray-900 transition"
                    >
                      <img
                        src={se.coverImage}
                        alt={se.title}
                        className="w-16 h-12 rounded-lg object-cover shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="ds2-b12 text-gray-900 truncate">{se.title}</p>
                        <p className="ds2-r12 text-gray-500 truncate">{se.group.name}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Share & Printable Flyer Studio Modal */}
      <ShareModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        title={event.title}
        subtitle={event.group.name}
        url={`/${event.group.urlname}/events/${event.eventId}`}
        dateStr={`${formattedDate} · ${formattedTime}`}
        venueStr={`${event.venueName} · ${event.venueCity}`}
      />

      {/* Add to Calendar Modal */}
      <AddToCalendarModal
        isOpen={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        event={event}
      />

      {/* Report Event Modal */}
      <ReportModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        targetType="EVENT"
        targetId={event.eventId}
        targetName={event.title}
      />

      {/* Meetup+ Modal */}
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
      group: { include: { topics: { include: { topic: true } } } },
      host: true,
      rsvps: { include: { user: true } },
    },
  });

  if (!event) {
    event = await prisma.event.findFirst({
      include: {
        group: { include: { topics: { include: { topic: true } } } },
        host: true,
        rsvps: { include: { user: true } },
      },
    });
  }

  const saved =
    user && event
      ? await prisma.savedEvent.findUnique({
          where: { userId_eventId: { userId: user.id, eventId: event.id } },
        })
      : null;

  const userRsvp =
    user && event
      ? await prisma.eventRsvp.findFirst({
          where: { eventId: event.id, userId: user.id },
        })
      : null;

  const similarEvents = await prisma.event.findMany({
    where: { NOT: { id: event?.id }, status: 'UPCOMING' },
    include: { group: true },
    take: 3,
  });

  return {
    props: {
      user: JSON.parse(JSON.stringify(user)),
      event: JSON.parse(JSON.stringify(event)),
      initialIsSaved: Boolean(saved),
      initialRsvp: JSON.parse(JSON.stringify(userRsvp)),
      similarEvents: JSON.parse(JSON.stringify(similarEvents)),
    },
  };
};
