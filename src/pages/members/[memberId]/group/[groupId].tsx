import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import type { GetServerSideProps } from 'next';
import { ArrowLeft, Edit3, CheckCircle2, Calendar, Bell } from 'lucide-react';
import Layout from '@/components/Layout';
import { prisma } from '@/lib/prisma';
import { getActiveUser } from '@/lib/auth-helper';

export default function MemberGroupProfilePage({
  user,
  profileUser,
  group,
  membership,
}: {
  user: any;
  profileUser: any;
  group: any;
  membership: any;
}) {
  const [groupBio, setGroupBio] = useState(
    membership?.groupBio || 'Excited to meet everyone at the upcoming San Francisco events!'
  );
  const [editing, setEditing] = useState(false);

  return (
    <Layout user={user}>
      <Head>
        <title>
          {profileUser.name} in {group.name} | Meetup
        </title>
      </Head>

      <div className="max-w-4xl mx-auto px-4 lg:px-6 pt-8 space-y-6">
        <Link
          href={`/${group.urlname}`}
          className="inline-flex items-center gap-1.5 ds2-m14 text-[#00798A] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to {group.name}
        </Link>

        <div className="bg-white rounded-ds2-28 border border-gray-200 p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-6">
            <div className="flex items-center gap-4">
              <img
                src={profileUser.avatarUrl}
                alt={profileUser.name}
                className="w-20 h-20 rounded-full object-cover"
              />
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-900 ds2-b12 mb-1">
                  {membership?.role || 'MEMBER'}
                </span>
                <h1 className="ds2-b24 text-gray-900">{profileUser.name}</h1>
                <p className="ds2-r14 text-gray-500">
                  Member of <strong>{group.name}</strong> since{' '}
                  {new Date(membership?.joinedAt || Date.now()).toLocaleDateString()}
                </p>
              </div>
            </div>

            <Link
              href={`/account/comm/${group.urlname}`}
              className="px-4 py-2 rounded-ds2-max border border-gray-300 hover:border-gray-900 ds2-m13 flex items-center gap-1.5"
            >
              <Bell className="w-4 h-4" />
              Email & notification settings
            </Link>
          </div>

          {/* Group Introduction / Group Bio */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="ds2-b20 text-gray-900">Group introduction</h2>
              <button
                type="button"
                onClick={() => setEditing(!editing)}
                className="ds2-m13 text-[#00798A] hover:underline flex items-center gap-1"
              >
                <Edit3 className="w-3.5 h-3.5" />
                {editing ? 'Save introduction' : 'Edit group bio'}
              </button>
            </div>
            {editing ? (
              <textarea
                rows={3}
                value={groupBio}
                onChange={(e) => setGroupBio(e.target.value)}
                className="w-full px-4 py-2.5 rounded-ds2-12 border border-gray-300 ds2-r14"
              />
            ) : (
              <p className="ds2-r16 text-gray-700 bg-gray-50 p-4 rounded-ds2-16">{groupBio}</p>
            )}
          </div>

          {/* Attendance Statistics in Group */}
          <div className="grid grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-ds2-16 bg-gray-50 border border-gray-100">
              <p className="ds2-b24 text-gray-900">{group.events?.length || 2}</p>
              <p className="ds2-r12 text-gray-500">Events attended</p>
            </div>
            <div className="p-4 rounded-ds2-16 bg-gray-50 border border-gray-100">
              <p className="ds2-b24 text-emerald-700">0</p>
              <p className="ds2-r12 text-gray-500">No-shows</p>
            </div>
            <div className="p-4 rounded-ds2-16 bg-gray-50 border border-gray-100">
              <p className="ds2-b24 text-gray-900">Active</p>
              <p className="ds2-r12 text-gray-500">Membership status</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const user = await getActiveUser(ctx.req, ctx.res);
  const memberId = ctx.params?.memberId as string;
  const groupIdParam = ctx.params?.groupId as string;

  const profileUser =
    (await prisma.user.findFirst({ where: { OR: [{ memberId }, { id: memberId }] } })) || user;

  const group =
    (await prisma.group.findFirst({
      where: { OR: [{ groupId: groupIdParam }, { id: groupIdParam }, { urlname: groupIdParam }] },
      include: { events: true },
    })) || (await prisma.group.findFirst({ include: { events: true } }));

  const membership =
    profileUser && group
      ? await prisma.groupMembership.findFirst({
          where: { userId: profileUser.id, groupId: group.id },
        })
      : null;

  return {
    props: {
      user: JSON.parse(JSON.stringify(user)),
      profileUser: JSON.parse(JSON.stringify(profileUser)),
      group: JSON.parse(JSON.stringify(group)),
      membership: JSON.parse(JSON.stringify(membership)),
    },
  };
};
