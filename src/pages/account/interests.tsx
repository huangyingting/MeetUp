import React, { useState } from 'react';
import Head from 'next/head';
import type { GetServerSideProps } from 'next';
import { Sparkles, Plus, X } from 'lucide-react';
import Layout from '@/components/Layout';
import AccountShell from '@/components/AccountShell';
import { prisma } from '@/lib/prisma';
import { getActiveUser } from '@/lib/auth-helper';
import { gqlRequest } from '@/lib/gqlClient';

export default function AccountInterestsPage({
  user,
  allTopics,
  initialTopicIds,
}: {
  user: any;
  allTopics: any[];
  initialTopicIds: string[];
}) {
  const [followedIds, setFollowedIds] = useState<string[]>(initialTopicIds);

  const toggleTopic = async (topicId: string) => {
    if (followedIds.includes(topicId)) {
      await gqlRequest('unfollowTopic', { input: { topicId } });
      setFollowedIds(followedIds.filter((id) => id !== topicId));
    } else {
      await gqlRequest('followTopics', { input: { topicIds: [topicId] } });
      setFollowedIds([...followedIds, topicId]);
    }
  };

  return (
    <Layout user={user}>
      <Head>
        <title>Interests — Settings | Meetup</title>
      </Head>

      <AccountShell
        title="Interests"
        subtitle="Manage the topics you follow to personalize your event feed."
      >
        <div className="space-y-6">
          <div>
            <h2 className="ds2-b16 text-gray-900 mb-3">
              Your selected interests ({followedIds.length})
            </h2>
            <div className="flex flex-wrap gap-2">
              {allTopics
                .filter((t) => followedIds.includes(t.id))
                .map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggleTopic(t.id)}
                    className="px-3.5 py-2 rounded-ds2-max bg-[#00798A] text-white ds2-m13 flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{t.name}</span>
                    <X className="w-3.5 h-3.5 ml-1" />
                  </button>
                ))}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <h2 className="ds2-b16 text-gray-900 mb-3">Suggested topics to add</h2>
            <div className="flex flex-wrap gap-2">
              {allTopics
                .filter((t) => !followedIds.includes(t.id))
                .map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggleTopic(t.id)}
                    className="px-3.5 py-2 rounded-ds2-max border border-gray-300 hover:border-gray-900 ds2-m13 text-gray-800 flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{t.name}</span>
                  </button>
                ))}
            </div>
          </div>
        </div>
      </AccountShell>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const user = await getActiveUser(ctx.req, ctx.res);
  if (!user) return { redirect: { destination: '/login', permanent: false } };

  const allTopics = await prisma.topic.findMany({ orderBy: { followersCount: 'desc' } });

  return {
    props: {
      user: JSON.parse(JSON.stringify(user)),
      allTopics: JSON.parse(JSON.stringify(allTopics)),
      initialTopicIds: user.topics.map((ut: any) => ut.topicId),
    },
  };
};
