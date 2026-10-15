import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import type { GetServerSideProps } from 'next';
import { Users, Search, MessageSquare, Sparkles } from 'lucide-react';
import Layout from '@/components/Layout';
import { prisma } from '@/lib/prisma';
import { getActiveUser } from '@/lib/auth-helper';

export default function ConnectionsFriendsPage({
  user,
  connections,
}: {
  user: any;
  connections: any[];
}) {
  const [groupFilter, setGroupFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const filtered = connections.filter((c) => {
    if (groupFilter !== 'ALL' && c.sharedGroup !== groupFilter) return false;
    if (search.trim() && !c.peer.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const sharedGroups = Array.from(new Set(connections.map((c) => c.sharedGroup).filter(Boolean)));

  return (
    <Layout user={user}>
      <Head>
        <title>Connections | Meetup</title>
      </Head>

      <div className="max-w-5xl mx-auto px-4 lg:px-6 pt-8 space-y-6">
        <div>
          <h1 className="ds2-b32 text-gray-900">Your connections ({connections.length})</h1>
          <p className="ds2-r14 text-gray-500 mt-1">
            People you&apos;ve met and connected with at Meetup events.
          </p>
        </div>

        <div className="bg-white rounded-ds2-24 border border-gray-200 p-6 space-y-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setGroupFilter('ALL')}
                className={`px-4 py-1.5 rounded-ds2-max ds2-m13 ${
                  groupFilter === 'ALL' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                All connections
              </button>
              {sharedGroups.map((sg: any) => (
                <button
                  key={sg}
                  type="button"
                  onClick={() => setGroupFilter(sg)}
                  className={`px-4 py-1.5 rounded-ds2-max ds2-m13 ${
                    groupFilter === sg ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {sg}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search connections..."
                className="pl-9 pr-3 py-1.5 rounded-ds2-max border border-gray-300 ds2-r14"
              />
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {filtered.map((conn: any) => (
              <div key={conn.id} className="py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <img
                    src={conn.peer.avatarUrl}
                    alt={conn.peer.name}
                    className="w-14 h-14 rounded-full object-cover"
                  />
                  <div>
                    <Link
                      href={`/members/${conn.peer.memberId}`}
                      className="ds2-b16 text-gray-900 hover:text-[#00798A]"
                    >
                      {conn.peer.name}
                    </Link>
                    <p className="ds2-r12 text-gray-500">{conn.peer.bio}</p>
                    <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-teal-50 text-[#00798A] ds2-m11">
                      Shared group: {conn.sharedGroup}
                    </span>
                  </div>
                </div>

                <Link
                  href="/messages"
                  className="px-4 py-2 rounded-ds2-max border border-gray-300 hover:border-gray-900 ds2-m13 flex items-center gap-1.5"
                >
                  <MessageSquare className="w-4 h-4" />
                  Message
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const user = await getActiveUser(ctx.req, ctx.res);
  if (!user) return { redirect: { destination: '/login', permanent: false } };

  const rawConnections = await prisma.connection.findMany({
    where: { OR: [{ requesterId: user.id }, { addresseeId: user.id }] },
    include: { requester: true, addressee: true },
  });

  const connections = rawConnections.map((c) => ({
    id: c.id,
    peer: c.requesterId === user.id ? c.addressee : c.requester,
    sharedGroup: 'Singles Mingle (San Francisco)',
  }));

  return {
    props: {
      user: JSON.parse(JSON.stringify(user)),
      connections: JSON.parse(JSON.stringify(connections)),
    },
  };
};
