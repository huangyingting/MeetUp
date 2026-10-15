import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import type { GetServerSideProps } from 'next';
import { Users, Plus, Star, Check, ArrowRight, Sparkles } from 'lucide-react';
import Layout from '@/components/Layout';
import { prisma } from '@/lib/prisma';
import { getActiveUser } from '@/lib/auth-helper';
import { gqlRequest } from '@/lib/gqlClient';

export default function GroupsHubPage({
  user,
  myMemberships,
  allGroups,
}: {
  user: any;
  myMemberships: any[];
  allGroups: any[];
}) {
  const [tab, setTab] = useState<'MEMBER' | 'PENDING' | 'ORGANIZER'>('MEMBER');
  const [joinedIds, setJoinedIds] = useState<string[]>(myMemberships.map((m) => m.groupId));

  const memberGroups = myMemberships.filter((m) => m.status === 'ACTIVE');
  const pendingGroups = myMemberships.filter((m) => m.status === 'PENDING');
  const organizerGroups = myMemberships.filter((m) => m.role === 'ORGANIZER');

  const activeList =
    tab === 'MEMBER'
      ? memberGroups
      : tab === 'PENDING'
        ? pendingGroups
        : organizerGroups;

  return (
    <Layout user={user}>
      <Head>
        <title>Your groups | Meetup</title>
      </Head>

      <div className="max-w-[1200px] mx-auto px-4 lg:px-6 pt-8 space-y-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="ds2-b32 text-gray-900">Your groups</h1>
            <p className="ds2-r14 text-gray-500 mt-1">
              Manage your communities or start your own Meetup group in minutes.
            </p>
          </div>
          <Link
            href="/start"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-ds2-max bg-[#E51937] hover:bg-[#c8142f] text-white ds2-b16 transition"
          >
            <Plus className="w-4 h-4" />
            Start a new group
          </Link>
        </div>

        {/* Tabs: Member / Pending / Organizer */}
        <div className="space-y-5">
          <div className="flex items-center gap-3 border-b border-gray-200 pb-3">
            {[
              { id: 'MEMBER', label: `Member (${memberGroups.length})` },
              { id: 'PENDING', label: `Pending (${pendingGroups.length})` },
              { id: 'ORGANIZER', label: `Hosting (${organizerGroups.length})` },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id as any)}
                className={`px-4 py-2 rounded-ds2-max ds2-b16 transition ${
                  tab === t.id ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {activeList.length === 0 ? (
            <div className="bg-white rounded-ds2-24 border border-gray-200 p-10 text-center space-y-2">
              <Users className="w-10 h-10 text-gray-300 mx-auto" />
              <p className="ds2-b16 text-gray-900">No groups in this tab yet</p>
              <p className="ds2-r14 text-gray-500">Join a suggested community below or start your own group.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {activeList.map((m: any) => (
                <div
                  key={m.id}
                  className="bg-white rounded-ds2-24 border border-gray-200 overflow-hidden shadow-xs hover:border-gray-900 transition flex flex-col justify-between"
                >
                  <div>
                    <Link href={`/${m.group.urlname}`}>
                      <img
                        src={m.group.coverImage}
                        alt={m.group.name}
                        className="w-full h-36 object-cover"
                      />
                    </Link>
                    <div className="p-5 space-y-1.5">
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-teal-50 text-[#00798A] ds2-b12">
                        {m.role}
                      </span>
                      <Link
                        href={`/${m.group.urlname}`}
                        className="ds2-b20 text-gray-900 hover:text-[#00798A] block"
                      >
                        {m.group.name}
                      </Link>
                      <p className="ds2-r12 text-gray-500">
                        {m.group.city}, {m.group.state} · {m.group.membersCount.toLocaleString()} members
                      </p>
                    </div>
                  </div>
                  <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between ds2-m12">
                    <Link
                      href={`/members/${user.memberId}/group/${m.group.groupId}`}
                      className="text-[#00798A] hover:underline"
                    >
                      Membership details
                    </Link>
                    <Link
                      href={`/${m.group.urlname}`}
                      className="text-gray-700 hover:text-gray-900 flex items-center gap-1"
                    >
                      Open group <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Suggested Groups in San Francisco */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="ds2-b24 text-gray-900">Suggested groups in San Francisco, CA</h2>
            <Link href="/find?source=GROUPS" className="ds2-m14 text-[#00798A] hover:underline">
              Explore all groups →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {allGroups.map((g: any) => {
              const isJoined = joinedIds.includes(g.id);
              return (
                <div
                  key={g.id}
                  className="bg-white rounded-ds2-24 border border-gray-200 p-5 flex flex-col justify-between gap-4 hover:shadow-ds2-sm transition"
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={g.coverImage}
                      alt={g.name}
                      className="w-20 h-20 rounded-ds2-16 object-cover shrink-0"
                    />
                    <div className="min-w-0 space-y-1">
                      <Link
                        href={`/${g.urlname}`}
                        className="ds2-b16 text-gray-900 hover:text-[#00798A] block truncate"
                      >
                        {g.name}
                      </Link>
                      <p className="ds2-r12 text-gray-500">
                        {g.city}, {g.state} · {g.membersCount.toLocaleString()} members
                      </p>
                      <p className="ds2-m12 text-amber-600 flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        {g.rating} ({g.ratingsCount})
                      </p>
                    </div>
                  </div>

                  <p className="ds2-r14 text-gray-600 line-clamp-2">{g.description}</p>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <Link href={`/${g.urlname}`} className="ds2-m13 text-[#00798A] hover:underline">
                      View group
                    </Link>
                    <button
                      type="button"
                      onClick={async () => {
                        if (isJoined) {
                          await gqlRequest('leaveGroup', { input: { groupId: g.id } });
                          setJoinedIds(joinedIds.filter((id) => id !== g.id));
                        } else {
                          await gqlRequest('joinGroup', { input: { groupId: g.id } });
                          setJoinedIds([...joinedIds, g.id]);
                        }
                      }}
                      className={`px-4 py-1.5 rounded-ds2-max ds2-b12 transition ${
                        isJoined
                          ? 'bg-emerald-100 text-emerald-900'
                          : 'bg-gray-900 text-white hover:bg-black'
                      }`}
                    >
                      {isJoined ? 'Joined ✓' : '+ Join group'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const user = await getActiveUser(ctx.req, ctx.res);
  if (!user) return { redirect: { destination: '/login', permanent: false } };

  const myMemberships = await prisma.groupMembership.findMany({
    where: { userId: user.id },
    include: { group: true },
  });

  const allGroups = await prisma.group.findMany({
    where: { isDraft: false },
    orderBy: { membersCount: 'desc' },
  });

  return {
    props: {
      user: JSON.parse(JSON.stringify(user)),
      myMemberships: JSON.parse(JSON.stringify(myMemberships)),
      allGroups: JSON.parse(JSON.stringify(allGroups)),
    },
  };
};
