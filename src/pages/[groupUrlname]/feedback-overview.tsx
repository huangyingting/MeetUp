import React, { useState } from 'react';
import Head from 'next/head';
import type { GetServerSideProps } from 'next';
import { Star } from 'lucide-react';
import Layout from '@/components/Layout';
import GroupShell from '@/components/GroupShell';
import { prisma } from '@/lib/prisma';
import { getActiveUser } from '@/lib/auth-helper';

export default function GroupFeedbackOverviewPage({
  user,
  group,
  initialIsMember,
}: {
  user: any;
  group: any;
  initialIsMember: boolean;
}) {
  const [reviews, setReviews] = useState<any[]>(group.reviews || []);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setReviews([
      {
        id: `rev-${Date.now()}`,
        rating,
        comment,
        author: user,
        createdAt: new Date().toISOString(),
      },
      ...reviews,
    ]);
    setComment('');
  };

  return (
    <Layout user={user}>
      <Head>
        <title>Group Reviews & Ratings — {group.name} | Meetup</title>
      </Head>

      <GroupShell
        user={user}
        group={group}
        activeTab="reviews"
        initialIsMember={initialIsMember}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <aside className="lg:col-span-4 bg-white rounded-ds2-24 border border-gray-200 p-6 space-y-4 h-fit">
            <h2 className="ds2-b24 text-gray-900">Overall Rating</h2>
            <div className="flex items-baseline gap-3">
              <span className="ds2-b32 text-gray-900">{group.rating}</span>
              <span className="ds2-m14 text-amber-500 flex items-center gap-1">
                ★★★★★ ({group.ratingsCount.toLocaleString()} reviews)
              </span>
            </div>

            <div className="space-y-2 pt-2">
              {[
                { stars: 5, pct: 84 },
                { stars: 4, pct: 12 },
                { stars: 3, pct: 3 },
                { stars: 2, pct: 1 },
                { stars: 1, pct: 0 },
              ].map((row) => (
                <div key={row.stars} className="flex items-center gap-2 ds2-m12">
                  <span className="w-12">{row.stars} stars</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400" style={{ width: `${row.pct}%` }} />
                  </div>
                  <span className="w-8 text-right text-gray-500">{row.pct}%</span>
                </div>
              ))}
            </div>
          </aside>

          <div className="lg:col-span-8 space-y-6">
            <form
              onSubmit={handleAddReview}
              className="bg-white rounded-ds2-24 border border-gray-200 p-6 space-y-4"
            >
              <h3 className="ds2-b20 text-gray-900">Share your experience</h3>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setRating(st)}
                    className={`p-1 ${rating >= st ? 'text-amber-400' : 'text-gray-300'}`}
                  >
                    <Star className="w-6 h-6 fill-current" />
                  </button>
                ))}
              </div>
              <textarea
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="What did you enjoy about this Meetup group?"
                className="w-full px-4 py-2.5 rounded-ds2-12 border border-gray-300 ds2-r14"
              />
              <button
                type="submit"
                className="px-6 py-2.5 rounded-ds2-max bg-gray-900 text-white ds2-b16"
              >
                Submit review
              </button>
            </form>

            <div className="space-y-4">
              {reviews.map((rev: any) => (
                <div
                  key={rev.id}
                  className="bg-white rounded-ds2-24 border border-gray-200 p-6 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={rev.author?.avatarUrl || user.avatarUrl}
                        alt={rev.author?.name || user.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <p className="ds2-b16 text-gray-900">{rev.author?.name || user.name}</p>
                        <p className="ds2-r12 text-gray-500">
                          {new Date(rev.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 text-amber-400">
                      {Array.from({ length: rev.rating }).map((_, idx) => (
                        <Star key={idx} className="w-4 h-4 fill-current" />
                      ))}
                    </div>
                  </div>
                  <p className="ds2-r16 text-gray-700 pt-1">{rev.comment}</p>
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
      memberships: true,
      reviews: { include: { author: true }, orderBy: { createdAt: 'desc' } },
    },
  });

  if (!group) {
    group = await prisma.group.findFirst({
      include: {
        organizer: true,
        memberships: true,
        reviews: { include: { author: true }, orderBy: { createdAt: 'desc' } },
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
