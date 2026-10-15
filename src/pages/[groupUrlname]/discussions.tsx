import React, { useState } from 'react';
import Head from 'next/head';
import type { GetServerSideProps } from 'next';
import { ThumbsUp, MessageCircle, Send } from 'lucide-react';
import Layout from '@/components/Layout';
import GroupShell from '@/components/GroupShell';
import { prisma } from '@/lib/prisma';
import { getActiveUser } from '@/lib/auth-helper';
import { gqlRequest } from '@/lib/gqlClient';

export default function GroupDiscussionsPage({
  user,
  group,
  initialIsMember,
}: {
  user: any;
  group: any;
  initialIsMember: boolean;
}) {
  const [discussions, setDiscussions] = useState<any[]>(group.discussions || []);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [commentMap, setCommentMap] = useState<Record<string, string>>({});

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    const res = await gqlRequest('createDiscussion', {
      input: { groupId: group.id, title, body },
    });
    const newPost = res?.data?.createDiscussion?.discussion;
    if (newPost) {
      setDiscussions([newPost, ...discussions]);
      setTitle('');
      setBody('');
    }
  };

  const handleAddComment = async (discussionId: string) => {
    const text = commentMap[discussionId];
    if (!text?.trim()) return;
    const res = await gqlRequest('addDiscussionComment', {
      input: { discussionId, body: text },
    });
    const newComment = res?.data?.addDiscussionComment?.comment;
    if (newComment) {
      setDiscussions(
        discussions.map((d) =>
          d.id === discussionId ? { ...d, comments: [...(d.comments || []), newComment] } : d
        )
      );
      setCommentMap({ ...commentMap, [discussionId]: '' });
    }
  };

  const handleLike = async (discussionId: string) => {
    await gqlRequest('likeDiscussion', { input: { discussionId } });
    setDiscussions(
      discussions.map((d) =>
        d.id === discussionId ? { ...d, likesCount: (d.likesCount || 0) + 1 } : d
      )
    );
  };

  return (
    <Layout user={user}>
      <Head>
        <title>Discussions — {group.name} | Meetup</title>
      </Head>

      <GroupShell
        user={user}
        group={group}
        activeTab="discussions"
        initialIsMember={initialIsMember}
      >
        <div className="max-w-3xl space-y-6">
          {/* New Discussion Composer */}
          <form
            onSubmit={handleCreatePost}
            className="bg-white rounded-ds2-24 border border-gray-200 p-6 space-y-4 shadow-xs"
          >
            <h2 className="ds2-b20 text-gray-900">Start a discussion in {group.name}</h2>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title or topic..."
              className="w-full px-4 py-2.5 rounded-ds2-12 border border-gray-300 ds2-b16"
            />
            <textarea
              rows={3}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Share an idea, ask a question, or introduce yourself..."
              className="w-full px-4 py-2.5 rounded-ds2-12 border border-gray-300 ds2-r14"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-ds2-max bg-gray-900 hover:bg-black text-white ds2-b16"
              >
                Post discussion
              </button>
            </div>
          </form>

          {/* Discussions List */}
          <div className="space-y-4">
            {discussions.map((d: any) => (
              <div
                key={d.id}
                className="bg-white rounded-ds2-24 border border-gray-200 p-6 space-y-4 shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={d.author?.avatarUrl || user.avatarUrl}
                    alt={d.author?.name || user.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <p className="ds2-b16 text-gray-900">{d.author?.name || user.name}</p>
                    <p className="ds2-r12 text-gray-500">
                      {new Date(d.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="ds2-b20 text-gray-900">{d.title}</h3>
                  <p className="ds2-r16 text-gray-700 mt-1">{d.body}</p>
                </div>

                <div className="flex items-center gap-4 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => handleLike(d.id)}
                    className="inline-flex items-center gap-1.5 ds2-m13 text-gray-600 hover:text-[#00798A]"
                  >
                    <ThumbsUp className="w-4 h-4" />
                    Like ({d.likesCount || 0})
                  </button>
                  <span className="inline-flex items-center gap-1.5 ds2-m13 text-gray-500">
                    <MessageCircle className="w-4 h-4" />
                    {d.comments?.length || 0} replies
                  </span>
                </div>

                {/* Replies */}
                {d.comments?.length > 0 && (
                  <div className="space-y-2.5 pl-4 border-l-2 border-gray-100">
                    {d.comments.map((c: any) => (
                      <div key={c.id} className="p-3 rounded-ds2-16 bg-gray-50 space-y-1">
                        <p className="ds2-b12 text-gray-900">{c.author?.name || user.name}</p>
                        <p className="ds2-r14 text-gray-700">{c.body}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Reply Input */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={commentMap[d.id] || ''}
                    onChange={(e) => setCommentMap({ ...commentMap, [d.id]: e.target.value })}
                    placeholder="Write a reply..."
                    className="flex-1 px-3.5 py-2 rounded-ds2-max border border-gray-300 ds2-r14"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddComment(d.id)}
                    className="p-2.5 rounded-full bg-gray-900 text-white hover:bg-black"
                  >
                    <Send className="w-4 h-4" />
                  </button>
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

  let group = await prisma.group.findUnique({
    where: { urlname },
    include: {
      organizer: true,
      memberships: true,
      discussions: {
        include: { author: true, comments: { include: { author: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!group) {
    group = await prisma.group.findFirst({
      include: {
        organizer: true,
        memberships: true,
        discussions: {
          include: { author: true, comments: { include: { author: true } } },
          orderBy: { createdAt: 'desc' },
        },
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
