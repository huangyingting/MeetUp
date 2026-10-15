import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import type { GetServerSideProps } from 'next';
import { Search, Sparkles, Users, ArrowRight } from 'lucide-react';
import Layout from '@/components/Layout';
import { prisma } from '@/lib/prisma';
import { getActiveUser } from '@/lib/auth-helper';

export default function TopicsHubPage({
  user,
  categories,
  topics,
}: {
  user: any;
  categories: any[];
  topics: any[];
}) {
  const [search, setSearch] = useState('');

  const filteredTopics = search.trim()
    ? topics.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()))
    : topics;

  return (
    <Layout user={user}>
      <Head>
        <title>Explore Meetup Topics & Categories | Meetup</title>
      </Head>

      <div className="max-w-[1200px] mx-auto px-4 lg:px-6 pt-8 space-y-10">
        <div className="bg-gradient-to-r from-[#141416] via-[#1F2937] to-[#00798A] rounded-ds2-32 p-8 lg:p-12 text-white space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-ds2-max bg-white/15 ds2-m12">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            20 Categories · Thousands of Topics
          </span>
          <h1 className="ds2-b32">Explore topics and communities</h1>
          <p className="ds2-r16 text-white/85 max-w-2xl">
            Browse by interest to find your people—from AI & LLM Builders and Python to Hiking, Singles Mixers, and Board Games.
          </p>
          <div className="relative max-w-md pt-2">
            <Search className="w-4 h-4 text-gray-400 absolute left-4 top-5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter topics (e.g. Artificial Intelligence, Hiking)..."
              className="w-full pl-10 pr-4 py-3 rounded-ds2-max bg-white text-gray-900 ds2-r14 focus:outline-none"
            />
          </div>
        </div>

        {/* Popular Topics Grid */}
        <section className="space-y-4">
          <h2 className="ds2-b24 text-gray-900">Popular topics</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredTopics.map((t) => (
              <Link
                key={t.id}
                href={`/topics/${t.urlkey}`}
                className="bg-white rounded-ds2-20 border border-gray-200 p-5 hover:border-gray-900 hover:shadow-ds2-sm transition flex flex-col justify-between"
              >
                <div>
                  <span className="ds2-m11 text-[#00798A] uppercase">
                    {t.category?.iconEmoji} {t.category?.name}
                  </span>
                  <h3 className="ds2-b16 text-gray-900 mt-1">{t.name}</h3>
                  <p className="ds2-r12 text-gray-500 mt-1 line-clamp-2">{t.description}</p>
                </div>
                <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between ds2-m12 text-gray-600">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {(t.followersCount / 1000).toFixed(0)}k members
                  </span>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Browse All 20 Categories */}
        <section className="space-y-4">
          <h2 className="ds2-b24 text-gray-900">Browse all 20 categories</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/find?category=${cat.urlkey}`}
                className="bg-white rounded-ds2-20 border border-gray-200 p-4 hover:border-gray-900 transition flex items-center gap-3"
              >
                <span className="text-2xl">{cat.iconEmoji}</span>
                <div>
                  <p className="ds2-b16 text-gray-900">{cat.name}</p>
                  <p className="ds2-r12 text-gray-500">Explore events →</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const user = await getActiveUser(ctx.req, ctx.res);
  const categories = await prisma.topicCategory.findMany({ orderBy: { name: 'asc' } });
  const topics = await prisma.topic.findMany({
    include: { category: true },
    orderBy: { followersCount: 'desc' },
  });

  return {
    props: {
      user: JSON.parse(JSON.stringify(user)),
      categories: JSON.parse(JSON.stringify(categories)),
      topics: JSON.parse(JSON.stringify(topics)),
    },
  };
};
