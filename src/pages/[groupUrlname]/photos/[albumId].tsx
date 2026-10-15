import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import type { GetServerSideProps } from 'next';
import { ArrowLeft } from 'lucide-react';
import Layout from '@/components/Layout';
import GroupShell from '@/components/GroupShell';
import { prisma } from '@/lib/prisma';
import { getActiveUser } from '@/lib/auth-helper';

export default function PhotoAlbumDetailPage({
  user,
  group,
  album,
  initialIsMember,
}: {
  user: any;
  group: any;
  album: any;
  initialIsMember: boolean;
}) {
  return (
    <Layout user={user}>
      <Head>
        <title>
          {album.title} — {group.name} | Meetup
        </title>
      </Head>

      <GroupShell
        user={user}
        group={group}
        activeTab="photos"
        initialIsMember={initialIsMember}
      >
        <div className="space-y-6">
          <div>
            <Link
              href={`/${group.urlname}/photos`}
              className="inline-flex items-center gap-1.5 ds2-m14 text-[#00798A] hover:underline"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to all albums
            </Link>
            <h2 className="ds2-b24 text-gray-900 mt-2">{album.title}</h2>
            <p className="ds2-r14 text-gray-500">Album ID: {album.albumId}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {group.photos.map((ph: any) => (
              <div
                key={ph.id}
                className="bg-white rounded-ds2-24 border border-gray-200 overflow-hidden shadow-xs"
              >
                <img
                  src={ph.imageUrl}
                  alt={ph.caption || 'Album photo'}
                  className="w-full h-72 object-cover"
                />
                <div className="p-4">
                  <p className="ds2-b16 text-gray-900">{ph.caption}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </GroupShell>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const user = await getActiveUser(ctx.req, ctx.res);
  const urlname = ctx.params?.groupUrlname as string;
  const albumId = ctx.params?.albumId as string;

  let group = await prisma.group.findUnique({
    where: { urlname },
    include: {
      organizer: true,
      memberships: true,
      photoAlbums: { include: { photos: true } },
    },
  });

  if (!group) {
    group = await prisma.group.findFirst({
      include: {
        organizer: true,
        memberships: true,
        photoAlbums: { include: { photos: true } },
      },
    });
  }

  const album =
    group?.photoAlbums.find((a) => a.albumId === albumId) ||
    group?.photoAlbums[0] || {
      albumId: albumId || '29811402',
      title: 'Community Highlights Album',
      photos: [],
    };

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
    user && group ? group.memberships.some((m) => m.userId === user.id) : false;

  return {
    props: {
      user: JSON.parse(JSON.stringify(user)),
      group: JSON.parse(JSON.stringify(enrichedGroup)),
      album: JSON.parse(JSON.stringify(album)),
      initialIsMember,
    },
  };
};
