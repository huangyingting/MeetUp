import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import type { GetServerSideProps } from 'next';
import { Upload, FolderOpen, X, Plus } from 'lucide-react';
import Layout from '@/components/Layout';
import GroupShell from '@/components/GroupShell';
import { prisma } from '@/lib/prisma';
import { getActiveUser } from '@/lib/auth-helper';
import { gqlRequest } from '@/lib/gqlClient';

export default function GroupPhotosPage({
  user,
  group,
  initialIsMember,
}: {
  user: any;
  group: any;
  initialIsMember: boolean;
}) {
  const [photos, setPhotos] = useState<any[]>(group.photos || []);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState(
    'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&auto=format&fit=crop&q=80'
  );
  const [caption, setCaption] = useState('Great vibes at our latest San Francisco meetup!');

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await gqlRequest('uploadPhoto', {
      input: {
        groupId: group.id,
        albumId: group.photoAlbums?.[0]?.id || null,
        imageUrl,
        caption,
      },
    });
    const newPhoto = res?.data?.uploadPhoto?.photo;
    if (newPhoto) {
      setPhotos([newPhoto, ...photos]);
    }
    setUploadOpen(false);
  };

  return (
    <Layout user={user}>
      <Head>
        <title>Photos — {group.name} | Meetup</title>
      </Head>

      <GroupShell
        user={user}
        group={group}
        activeTab="photos"
        initialIsMember={initialIsMember}
      >
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="ds2-b24 text-gray-900">Photo albums ({group.photoAlbums.length})</h2>
              <p className="ds2-r14 text-gray-500">Memories captured by community members</p>
            </div>
            <button
              type="button"
              onClick={() => setUploadOpen(true)}
              className="px-5 py-2.5 rounded-ds2-max bg-gray-900 hover:bg-black text-white ds2-b16 flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Add photos
            </button>
          </div>

          {/* Photo Albums Grid */}
          {group.photoAlbums.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {group.photoAlbums.map((alb: any) => (
                <Link
                  key={alb.id}
                  href={`/${group.urlname}/photos/${alb.albumId}`}
                  className="bg-white rounded-ds2-24 border border-gray-200 overflow-hidden hover:border-gray-900 transition shadow-xs"
                >
                  <img
                    src={alb.coverUrl}
                    alt={alb.title}
                    className="w-full h-44 object-cover"
                  />
                  <div className="p-4 flex items-center justify-between">
                    <div>
                      <h3 className="ds2-b16 text-gray-900">{alb.title}</h3>
                      <p className="ds2-r12 text-gray-500">Album #{alb.albumId}</p>
                    </div>
                    <FolderOpen className="w-5 h-5 text-[#00798A]" />
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* All Photos Grid */}
          <div className="space-y-4">
            <h3 className="ds2-b20 text-gray-900">All photos ({photos.length})</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {photos.map((ph: any) => (
                <div
                  key={ph.id}
                  className="bg-white rounded-ds2-20 border border-gray-200 overflow-hidden shadow-xs"
                >
                  <img
                    src={ph.imageUrl}
                    alt={ph.caption || 'Group photo'}
                    className="w-full h-56 object-cover"
                  />
                  <div className="p-4">
                    <p className="ds2-m14 text-gray-800">{ph.caption}</p>
                    <p className="ds2-r12 text-gray-500 mt-1">
                      Uploaded {new Date(ph.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Add Photos Upload Modal */}
        {uploadOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            role="dialog"
            aria-modal="true"
          >
            <div className="bg-white rounded-ds2-28 max-w-md w-full p-6 shadow-ds2-lg-default relative space-y-4">
              <button
                type="button"
                onClick={() => setUploadOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="ds2-b24 text-gray-900">Add photos to {group.name}</h3>
              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <label className="block ds2-m13 text-gray-700 mb-1">Photo URL</label>
                  <input
                    type="url"
                    required
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-ds2-12 border border-gray-300 ds2-r14"
                  />
                </div>
                <div>
                  <label className="block ds2-m13 text-gray-700 mb-1">Caption</label>
                  <input
                    type="text"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-ds2-12 border border-gray-300 ds2-r14"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 rounded-ds2-max bg-[#00798A] text-white ds2-b16"
                >
                  Upload photo
                </button>
              </form>
            </div>
          </div>
        )}
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
        photoAlbums: group.photoAlbums.map((a) => ({
          ...a,
          coverUrl: a.photos[0]?.url || group?.coverImage,
        })),
        photos: allPhotos,
      }
    : null;

  const initialIsMember =
    user && group ? group.memberships.some((m) => m.userId === user.id) : false;

  return {
    props: {
      user: JSON.parse(JSON.stringify(user)),
      group: JSON.parse(JSON.stringify(enrichedGroup)),
      initialIsMember,
    },
  };
};
