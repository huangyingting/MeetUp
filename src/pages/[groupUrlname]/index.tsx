import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import type { GetServerSideProps } from 'next';
import { Calendar, MapPin, Video, Users, Star, MessageSquare, Image } from 'lucide-react';
import Layout from '@/components/Layout';
import GroupShell from '@/components/GroupShell';
import { prisma } from '@/lib/prisma';
import { getActiveUser } from '@/lib/auth-helper';

export default function GroupAboutPage({
  user,
  group,
  initialIsMember,
}: {
  user: any;
  group: any;
  initialIsMember: boolean;
}) {
  const [readMore, setReadMore] = useState(false);

  const upcomingEvents = group.events.filter((e: any) => e.status === 'UPCOMING');
  const pastEvents = group.events.filter((e: any) => e.status === 'PAST');

  return (
    <Layout user={user}>
      <Head>
        <title>{group.name} | Meetup</title>
      </Head>

      <GroupShell
        user={user}
        group={group}
        activeTab="about"
        initialIsMember={initialIsMember}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Main Content */}
          <div className="lg:col-span-8 space-y-8">
            {/* What we're about */}
            <section className="bg-white rounded-ds2-24 border border-gray-200 p-6 sm:p-8 space-y-4">
              <h2 className="ds2-b24 text-gray-900">What we&apos;re about</h2>
              <p
                className={`ds2-r16 text-gray-700 whitespace-pre-line leading-relaxed ${
                  !readMore ? 'line-clamp-4' : ''
                }`}
              >
                {group.description}
              </p>
              <button
                type="button"
                onClick={() => setReadMore(!readMore)}
                className="ds2-b16 text-[#00798A] hover:underline"
              >
                {readMore ? 'Read less' : 'Read more'}
              </button>
            </section>

            {/* Upcoming Events */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="ds2-b24 text-gray-900">
                  Upcoming events ({upcomingEvents.length})
                </h2>
                <Link
                  href={`/${group.urlname}/events`}
                  className="ds2-b16 text-[#00798A] hover:underline"
                >
                  See all
                </Link>
              </div>

              {upcomingEvents.map((ev: any) => (
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
                        hour: 'numeric',
                        minute: '2-digit',
                      })}{' '}
                      PDT
                    </p>
                    <h3 className="ds2-b20 text-gray-900">{ev.title}</h3>
                    <p className="ds2-r14 text-gray-600 line-clamp-2">{ev.description}</p>
                    <div className="flex items-center gap-4 pt-1 ds2-m12 text-gray-500">
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
                      <span>·</span>
                      <span>14 attendees</span>
                    </div>
                  </div>
                  <img
                    src={ev.coverImage}
                    alt={ev.title}
                    className="w-full sm:w-40 h-28 rounded-ds2-16 object-cover shrink-0"
                  />
                </Link>
              ))}
            </section>

            {/* Past Events Preview */}
            {pastEvents.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="ds2-b24 text-gray-900">Past events ({pastEvents.length})</h2>
                  <Link
                    href={`/${group.urlname}/events/past`}
                    className="ds2-b16 text-[#00798A] hover:underline"
                  >
                    See all
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {pastEvents.map((pe: any) => (
                    <Link
                      key={pe.id}
                      href={`/${group.urlname}/events/${pe.eventId}`}
                      className="bg-white rounded-ds2-20 border border-gray-200 p-5 hover:border-gray-900 transition space-y-1.5"
                    >
                      <p className="ds2-m12 text-gray-500">
                        {new Date(pe.dateTime).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                      <h3 className="ds2-b16 text-gray-900">{pe.title}</h3>
                      <p className="ds2-r12 text-gray-500">{pe.venueName}</p>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Photos Preview */}
            <section className="bg-white rounded-ds2-24 border border-gray-200 p-6 sm:p-8 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="ds2-b24 text-gray-900">Photos ({group.photos.length})</h2>
                <Link
                  href={`/${group.urlname}/photos`}
                  className="ds2-b16 text-[#00798A] hover:underline"
                >
                  See all
                </Link>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {group.photos.slice(0, 3).map((ph: any) => (
                  <Link key={ph.id} href={`/${group.urlname}/photos`}>
                    <img
                      src={ph.imageUrl}
                      alt={ph.caption || 'Group photo'}
                      className="w-full h-36 rounded-ds2-16 object-cover hover:opacity-90 transition"
                    />
                  </Link>
                ))}
              </div>
            </section>

            {/* Discussions Preview */}
            <section className="bg-white rounded-ds2-24 border border-gray-200 p-6 sm:p-8 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="ds2-b24 text-gray-900">
                  Discussions ({group.discussions.length})
                </h2>
                <Link
                  href={`/${group.urlname}/discussions`}
                  className="ds2-b16 text-[#00798A] hover:underline"
                >
                  See all
                </Link>
              </div>
              {group.discussions.slice(0, 2).map((d: any) => (
                <Link
                  key={d.id}
                  href={`/${group.urlname}/discussions`}
                  className="block p-4 rounded-ds2-16 bg-gray-50 hover:bg-gray-100 transition space-y-1"
                >
                  <p className="ds2-b16 text-gray-900">{d.title}</p>
                  <p className="ds2-r14 text-gray-600 line-clamp-2">{d.body}</p>
                </Link>
              ))}
            </section>
          </div>

          {/* Right Sidebar: Organizer, Members Preview, Reviews, Related Topics */}
          <aside className="lg:col-span-4 space-y-6">
            {/* Organizer Card */}
            <div className="bg-white rounded-ds2-24 border border-gray-200 p-6 space-y-4">
              <h3 className="ds2-b20 text-gray-900">Organizer</h3>
              <div className="flex items-center gap-3.5">
                <img
                  src={group.organizer.avatarUrl}
                  alt={group.organizer.name}
                  className="w-14 h-14 rounded-full object-cover"
                />
                <div>
                  <Link
                    href={`/members/${group.organizer.memberId}`}
                    className="ds2-b16 text-gray-900 hover:underline"
                  >
                    {group.organizer.name}
                  </Link>
                  <p className="ds2-r12 text-gray-500">Lead Organizer</p>
                  <Link
                    href="/messages"
                    className="inline-flex items-center gap-1 ds2-m13 text-[#00798A] hover:underline mt-1"
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> Message
                  </Link>
                </div>
              </div>
            </div>

            {/* Members Preview */}
            <div className="bg-white rounded-ds2-24 border border-gray-200 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="ds2-b20 text-gray-900">
                  Members ({group.membersCount.toLocaleString()})
                </h3>
                <Link
                  href={`/${group.urlname}/members`}
                  className="ds2-m14 text-[#00798A] hover:underline"
                >
                  See all
                </Link>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {group.memberships.slice(0, 8).map((m: any) => (
                  <Link
                    key={m.id}
                    href={`/members/${m.user.memberId}`}
                    className="text-center space-y-1"
                  >
                    <img
                      src={m.user.avatarUrl}
                      alt={m.user.name}
                      className="w-12 h-12 rounded-full mx-auto object-cover"
                    />
                    <p className="ds2-m11 text-gray-700 truncate">{m.user.name}</p>
                  </Link>
                ))}
              </div>
            </div>

            {/* Group Reviews Card */}
            <div className="bg-white rounded-ds2-24 border border-gray-200 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="ds2-b20 text-gray-900">Member ratings</h3>
                <Link
                  href={`/${group.urlname}/feedback-overview`}
                  className="ds2-m14 text-[#00798A] hover:underline"
                >
                  See all ({group.ratingsCount})
                </Link>
              </div>
              {group.reviews.slice(0, 2).map((rev: any) => (
                <div key={rev.id} className="p-3.5 rounded-ds2-16 bg-gray-50 space-y-1">
                  <div className="flex items-center gap-1 text-amber-500">
                    {Array.from({ length: rev.rating }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                    ))}
                  </div>
                  <p className="ds2-r12 text-gray-700">&ldquo;{rev.comment}&rdquo;</p>
                  <p className="ds2-m11 text-gray-500">— {rev.author.name}</p>
                </div>
              ))}
            </div>

            {/* Related Topics */}
            <div className="bg-white rounded-ds2-24 border border-gray-200 p-6 space-y-3">
              <h3 className="ds2-b20 text-gray-900">Related topics</h3>
              <div className="flex flex-wrap gap-2">
                {group.topics.map((gt: any) => (
                  <Link
                    key={gt.id}
                    href={`/topics/${gt.topic.urlkey}`}
                    className="px-3.5 py-1.5 rounded-ds2-max bg-gray-100 hover:bg-gray-200 ds2-m13 text-gray-800 transition"
                  >
                    {gt.topic.name}
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </GroupShell>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const user = await getActiveUser(ctx.req, ctx.res);
  const urlname = ctx.params?.groupUrlname as string;

  let group = await prisma.group.findUnique({
    where: { urlname },
    include: {
      organizer: true,
      events: { orderBy: { dateTime: 'asc' } },
      memberships: { include: { user: true } },
      photoAlbums: { include: { photos: true } },
      discussions: { include: { author: true } },
      reviews: { include: { author: true } },
      topics: { include: { topic: true } },
    },
  });

  if (!group) {
    group = await prisma.group.findFirst({
      include: {
        organizer: true,
        events: { orderBy: { dateTime: 'asc' } },
        memberships: { include: { user: true } },
        photoAlbums: { include: { photos: true } },
        discussions: { include: { author: true } },
        reviews: { include: { author: true } },
        topics: { include: { topic: true } },
      },
    });
  }

  const allPhotos =
    group?.photoAlbums.flatMap((alb) =>
      alb.photos.map((p) => ({ ...p, imageUrl: p.url }))
    ) || [];

  const enrichedGroup = group
    ? {
        ...group,
        privacy: group.isPrivate ? 'Private' : 'Public',
        pledgeGoal: group.fundraisingGoal,
        pledgeRaised: group.fundraisingRaised,
        photos: allPhotos,
      }
    : null;

  const initialIsMember =
    user && group
      ? group.memberships.some((m) => m.userId === user.id)
      : false;

  return {
    props: {
      user: JSON.parse(JSON.stringify(user)),
      group: JSON.parse(JSON.stringify(enrichedGroup)),
      initialIsMember,
    },
  };
};
