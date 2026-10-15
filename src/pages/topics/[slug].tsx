import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import type { GetServerSideProps } from 'next';
import { Users, Sparkles, Check, Plus, Calendar, MapPin } from 'lucide-react';
import Layout from '@/components/Layout';
import { prisma } from '@/lib/prisma';
import { getActiveUser } from '@/lib/auth-helper';
import { gqlRequest } from '@/lib/gqlClient';

export default function TopicDetailPage({
  user,
  topic,
  relatedTopics,
  largestGroups,
  upcomingEvents,
  initiallyFollowed,
}: {
  user: any;
  topic: any;
  relatedTopics: any[];
  largestGroups: any[];
  upcomingEvents: any[];
  initiallyFollowed: boolean;
}) {
  const [followed, setFollowed] = useState(initiallyFollowed);

  const toggleFollow = async () => {
    if (followed) {
      await gqlRequest('unfollowTopic', { input: { topicId: topic.id } });
      setFollowed(false);
    } else {
      await gqlRequest('followTopics', { input: { topicIds: [topic.id] } });
      setFollowed(true);
    }
  };

  return (
    <Layout user={user}>
      <Head>
        <title>{topic.name} Groups & Events | Meetup</title>
      </Head>

      <div className="max-w-[1200px] mx-auto px-4 lg:px-6 pt-8 space-y-10">
        {/* Hero */}
        <section className="bg-white rounded-ds2-32 border border-gray-200 p-8 lg:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-ds2-sm">
          <div className="space-y-2 max-w-2xl">
            <Link href="/topics" className="ds2-m13 text-[#00798A] hover:underline">
              ← All Topics · {topic.category?.name}
            </Link>
            <h1 className="ds2-b32 text-gray-900">{topic.name}</h1>
            <p className="ds2-r16 text-gray-600">{topic.description}</p>
            <div className="flex items-center gap-6 pt-2 ds2-m14 text-gray-700">
              <span>
                <strong>{topic.followersCount.toLocaleString()}</strong> members interested
              </span>
              <span>·</span>
              <span>
                <strong>{largestGroups.length * 420}</strong> global groups
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={toggleFollow}
              className={`px-6 py-3 rounded-ds2-max ds2-b16 flex items-center gap-2 transition ${
                followed
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  : 'bg-gray-900 text-white hover:bg-black'
              }`}
            >
              {followed ? (
                <>
                  <Check className="w-4 h-4" /> Following topic
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" /> Follow topic
                </>
              )}
            </button>
            <Link
              href="/start"
              className="px-5 py-3 rounded-ds2-max border border-gray-300 hover:border-gray-900 ds2-b16 text-gray-900 transition"
            >
              Start a {topic.name} group
            </Link>
          </div>
        </section>

        {/* Largest Groups in Topic */}
        <section className="space-y-4">
          <h2 className="ds2-b24 text-gray-900">Largest {topic.name} groups</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {largestGroups.map((g: any, idx: number) => (
              <Link
                key={g.id}
                href={`/${g.urlname}`}
                className="bg-white rounded-ds2-24 border border-gray-200 p-5 hover:border-gray-900 transition space-y-3"
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-gray-900 text-white ds2-b12 flex items-center justify-center shrink-0">
                    #{idx + 1}
                  </span>
                  <img
                    src={g.coverImage}
                    alt={g.name}
                    className="w-14 h-14 rounded-ds2-12 object-cover shrink-0"
                  />
                  <div className="min-w-0">
                    <h3 className="ds2-b16 text-gray-900 truncate">{g.name}</h3>
                    <p className="ds2-r12 text-gray-500">
                      {g.city}, {g.state} · {g.membersCount.toLocaleString()} members
                    </p>
                  </div>
                </div>
                <p className="ds2-r14 text-gray-600 line-clamp-2">{g.description}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Upcoming Events in Topic */}
        <section className="space-y-4">
          <h2 className="ds2-b24 text-gray-900">Upcoming {topic.name} events</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {upcomingEvents.map((ev: any) => (
              <Link
                key={ev.id}
                href={`/${ev.group.urlname}/events/${ev.eventId}`}
                className="bg-white rounded-ds2-20 border border-gray-200 p-5 hover:border-gray-900 transition flex items-start gap-4"
              >
                <img
                  src={ev.coverImage}
                  alt={ev.title}
                  className="w-28 h-24 rounded-ds2-16 object-cover shrink-0"
                />
                <div className="space-y-1">
                  <p className="ds2-k13 text-[#00798A] uppercase">
                    {new Date(ev.dateTime).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                  <h3 className="ds2-b16 text-gray-900">{ev.title}</h3>
                  <p className="ds2-r12 text-gray-500">{ev.group.name}</p>
                  <p className="ds2-m12 text-gray-600 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> {ev.venueName} ({ev.venueCity})
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Related Topics */}
        <section className="space-y-3">
          <h2 className="ds2-b20 text-gray-900">Related topics</h2>
          <div className="flex flex-wrap gap-2.5">
            {relatedTopics.map((rt: any) => (
              <Link
                key={rt.id}
                href={`/topics/${rt.urlkey}`}
                className="px-4 py-2 rounded-ds2-max bg-white border border-gray-300 hover:border-gray-900 ds2-m14 text-gray-800 transition flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#00798A]" />
                {rt.name}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const user = await getActiveUser(ctx.req, ctx.res);
  const slug = (ctx.params?.slug as string) || 'new-tech';

  let topic = await prisma.topic.findUnique({
    where: { urlkey: slug },
    include: { category: true },
  });

  if (!topic) {
    topic = await prisma.topic.findFirst({
      include: { category: true },
    });
  }

  const relatedTopics = await prisma.topic.findMany({
    where: { NOT: { id: topic?.id } },
    take: 10,
  });

  const largestGroups = await prisma.group.findMany({
    where: { isDraft: false },
    orderBy: { membersCount: 'desc' },
    take: 6,
  });

  const upcomingEvents = await prisma.event.findMany({
    where: { status: 'UPCOMING' },
    include: { group: true },
    take: 4,
  });

  const initiallyFollowed = user
    ? user.topics.some((ut: any) => ut.topicId === topic?.id)
    : false;

  return {
    props: {
      user: JSON.parse(JSON.stringify(user)),
      topic: JSON.parse(JSON.stringify(topic)),
      relatedTopics: JSON.parse(JSON.stringify(relatedTopics)),
      largestGroups: JSON.parse(JSON.stringify(largestGroups)),
      upcomingEvents: JSON.parse(JSON.stringify(upcomingEvents)),
      initiallyFollowed,
    },
  };
};
