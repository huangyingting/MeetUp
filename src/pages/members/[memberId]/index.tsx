import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import type { GetServerSideProps } from 'next';
import {
  MapPin,
  Calendar,
  Edit3,
  Users,
  Sparkles,
  Check,
  X,
  MessageSquare,
} from 'lucide-react';
import Layout from '@/components/Layout';
import { prisma } from '@/lib/prisma';
import { getActiveUser } from '@/lib/auth-helper';
import { gqlRequest } from '@/lib/gqlClient';

export default function MemberProfilePage({
  user,
  profileUser,
}: {
  user: any;
  profileUser: any;
}) {
  const isSelf = user?.id === profileUser.id;
  const [bio, setBio] = useState(
    profileUser.bio || 'Software engineer & AI enthusiast exploring San Francisco communities.'
  );
  const [editingBio, setEditingBio] = useState(false);

  const handleSaveBio = async () => {
    await gqlRequest('updateMemberData', { input: { bio } });
    setEditingBio(false);
  };

  return (
    <Layout user={user}>
      <Head>
        <title>{profileUser.name} — Member Profile | Meetup</title>
      </Head>

      <div className="max-w-5xl mx-auto px-4 lg:px-6 pt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Profile Card */}
        <aside className="lg:col-span-4 space-y-5">
          <div className="bg-white rounded-ds2-28 border border-gray-200 p-6 text-center space-y-4 shadow-xs">
            <img
              src={profileUser.avatarUrl}
              alt={profileUser.name}
              className="w-28 h-28 rounded-full mx-auto object-cover border-4 border-teal-50"
            />
            <div>
              <h1 className="ds2-b24 text-gray-900">{profileUser.name}</h1>
              <p className="ds2-r14 text-gray-500 flex items-center justify-center gap-1 mt-1">
                <MapPin className="w-4 h-4 text-gray-400" />
                {profileUser.city}, {profileUser.state}
              </p>
              <p className="ds2-r12 text-gray-400 flex items-center justify-center gap-1 mt-1">
                <Calendar className="w-3.5 h-3.5" />
                Member since {new Date(profileUser.joinedAt).toLocaleDateString()}
              </p>
            </div>

            {/* Stats Counters */}
            <div className="grid grid-cols-3 gap-2 pt-4 border-t border-gray-100">
              <div>
                <p className="ds2-b20 text-gray-900">{profileUser.memberships?.length || 0}</p>
                <p className="ds2-r12 text-gray-500">Groups</p>
              </div>
              <div>
                <p className="ds2-b20 text-gray-900">{profileUser.topics?.length || 0}</p>
                <p className="ds2-r12 text-gray-500">Interests</p>
              </div>
              <div>
                <p className="ds2-b20 text-gray-900">{profileUser.rsvps?.length || 0}</p>
                <p className="ds2-r12 text-gray-500">RSVPs</p>
              </div>
            </div>

            {isSelf ? (
              <Link
                href="/account"
                className="w-full py-2.5 rounded-ds2-max border border-gray-300 hover:border-gray-900 ds2-b16 text-gray-900 flex items-center justify-center gap-1.5"
              >
                <Edit3 className="w-4 h-4" />
                Edit profile settings
              </Link>
            ) : (
              <Link
                href="/messages"
                className="w-full py-2.5 rounded-ds2-max bg-gray-900 text-white ds2-b16 flex items-center justify-center gap-1.5"
              >
                <MessageSquare className="w-4 h-4" />
                Message {profileUser.name}
              </Link>
            )}
          </div>
        </aside>

        {/* Right Bio, Interests & Groups */}
        <div className="lg:col-span-8 space-y-6">
          {/* Bio Section */}
          <section className="bg-white rounded-ds2-24 border border-gray-200 p-6 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <h2 className="ds2-b20 text-gray-900">Bio</h2>
              {isSelf && !editingBio && (
                <button
                  type="button"
                  onClick={() => setEditingBio(true)}
                  className="ds2-m13 text-[#00798A] hover:underline flex items-center gap-1"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit bio
                </button>
              )}
            </div>

            {editingBio ? (
              <div className="space-y-3">
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-ds2-12 border border-gray-300 ds2-r14"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSaveBio}
                    className="px-4 py-2 rounded-ds2-max bg-gray-900 text-white ds2-m13 flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" /> Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingBio(false)}
                    className="px-4 py-2 rounded-ds2-max border border-gray-300 ds2-m13"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="ds2-r16 text-gray-700">{bio}</p>
            )}
          </section>

          {/* Interests Chips */}
          <section className="bg-white rounded-ds2-24 border border-gray-200 p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h2 className="ds2-b20 text-gray-900">
                Interests ({profileUser.topics?.length || 0})
              </h2>
              {isSelf && (
                <Link href="/account/interests" className="ds2-m13 text-[#00798A] hover:underline">
                  Edit interests
                </Link>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {profileUser.topics?.map((ut: any) => (
                <Link
                  key={ut.id}
                  href={`/topics/${ut.topic.urlkey}`}
                  className="px-3.5 py-1.5 rounded-ds2-max bg-teal-50 text-[#00798A] border border-teal-200 ds2-m13 flex items-center gap-1.5 hover:bg-teal-100 transition"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {ut.topic.name}
                </Link>
              ))}
            </div>
          </section>

          {/* Member Groups */}
          <section className="bg-white rounded-ds2-24 border border-gray-200 p-6 space-y-4 shadow-xs">
            <h2 className="ds2-b20 text-gray-900">
              Groups ({profileUser.memberships?.length || 0})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {profileUser.memberships?.map((m: any) => (
                <Link
                  key={m.id}
                  href={`/members/${profileUser.memberId}/group/${m.group.groupId}`}
                  className="p-4 rounded-ds2-16 border border-gray-200 hover:border-gray-900 transition flex items-center gap-3.5"
                >
                  <img
                    src={m.group.coverImage}
                    alt={m.group.name}
                    className="w-14 h-14 rounded-ds2-12 object-cover shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="ds2-b16 text-gray-900 truncate">{m.group.name}</p>
                    <p className="ds2-r12 text-[#00798A]">{m.role}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const user = await getActiveUser(ctx.req, ctx.res);
  const memberId = ctx.params?.memberId as string;

  let profileUser = await prisma.user.findFirst({
    where: { OR: [{ memberId }, { id: memberId }] },
    include: {
      memberships: { include: { group: true } },
      topics: { include: { topic: true } },
      rsvps: true,
    },
  });

  if (!profileUser) {
    profileUser = user as any;
  }

  return {
    props: {
      user: JSON.parse(JSON.stringify(user)),
      profileUser: JSON.parse(JSON.stringify(profileUser)),
    },
  };
};
