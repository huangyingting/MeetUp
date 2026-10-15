import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import type { GetServerSideProps } from 'next';
import { Search, MessageSquare, ShieldCheck } from 'lucide-react';
import Layout from '@/components/Layout';
import GroupShell from '@/components/GroupShell';
import { prisma } from '@/lib/prisma';
import { getActiveUser } from '@/lib/auth-helper';

export default function GroupMembersPage({
  user,
  group,
  initialIsMember,
}: {
  user: any;
  group: any;
  initialIsMember: boolean;
}) {
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'LEADERSHIP'>('ALL');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'JOINED' | 'NAME'>('JOINED');

  const memberships = group.memberships
    .filter((m: any) => {
      if (roleFilter === 'LEADERSHIP') {
        return m.role === 'ORGANIZER' || m.role === 'COORGANIZER';
      }
      return true;
    })
    .filter((m: any) =>
      search.trim() ? m.user.name.toLowerCase().includes(search.toLowerCase()) : true
    )
    .sort((a: any, b: any) => {
      if (sortBy === 'NAME') return a.user.name.localeCompare(b.user.name);
      return new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime();
    });

  const leadershipCount = group.memberships.filter(
    (m: any) => m.role === 'ORGANIZER' || m.role === 'COORGANIZER'
  ).length;

  return (
    <Layout user={user}>
      <Head>
        <title>Members — {group.name} | Meetup</title>
      </Head>

      <GroupShell
        user={user}
        group={group}
        activeTab="members"
        initialIsMember={initialIsMember}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <aside className="lg:col-span-3 space-y-2">
            <div className="bg-white rounded-ds2-20 border border-gray-200 p-2 space-y-1">
              <button
                type="button"
                onClick={() => setRoleFilter('ALL')}
                className={`w-full text-left px-4 py-2.5 rounded-ds2-12 ds2-b16 flex items-center justify-between ${
                  roleFilter === 'ALL'
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span>All members</span>
                <span className="ds2-m12">{group.memberships.length}</span>
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter('LEADERSHIP')}
                className={`w-full text-left px-4 py-2.5 rounded-ds2-12 ds2-b16 flex items-center justify-between ${
                  roleFilter === 'LEADERSHIP'
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span>Leadership team</span>
                <span className="ds2-m12">{leadershipCount}</span>
              </button>
            </div>
          </aside>

          <div className="lg:col-span-9 bg-white rounded-ds2-24 border border-gray-200 p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
              <h2 className="ds2-b24 text-gray-900">
                {roleFilter === 'ALL' ? 'All members' : 'Leadership team'} ({memberships.length})
              </h2>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search members..."
                    className="pl-9 pr-3 py-1.5 rounded-ds2-max border border-gray-300 ds2-r14"
                  />
                </div>
                <select
                  aria-label="Sort members"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-1.5 rounded-ds2-max border border-gray-300 ds2-m13 bg-white"
                >
                  <option value="JOINED">Sort: Date joined</option>
                  <option value="NAME">Sort: Name (A-Z)</option>
                </select>
              </div>
            </div>

            <div className="divide-y divide-gray-100">
              {memberships.map((m: any) => (
                <div key={m.id} className="py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <img
                      src={m.user.avatarUrl}
                      alt={m.user.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/members/${m.user.memberId}/group/${group.groupId}`}
                          className="ds2-b16 text-gray-900 hover:text-[#00798A]"
                        >
                          {m.user.name}
                        </Link>
                        {m.role !== 'MEMBER' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-900 ds2-b12">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            {m.role}
                          </span>
                        )}
                      </div>
                      <p className="ds2-r12 text-gray-500">
                        {m.groupBio || m.user.bio || `Joined ${new Date(m.joinedAt).toLocaleDateString()}`}
                      </p>
                    </div>
                  </div>

                  <Link
                    href="/messages"
                    className="px-4 py-1.5 rounded-ds2-max border border-gray-300 hover:border-gray-900 ds2-m13 flex items-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Message
                  </Link>
                </div>
              ))}
            </div>
          </div>
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
      memberships: { include: { user: true } },
    },
  });

  if (!group) {
    group = await prisma.group.findFirst({
      include: {
        organizer: true,
        memberships: { include: { user: true } },
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
