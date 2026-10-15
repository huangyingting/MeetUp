import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import type { GetServerSideProps } from 'next';
import { Users, Globe, Sparkles, Heart } from 'lucide-react';
import Layout from '@/components/Layout';
import { getActiveUser } from '@/lib/auth-helper';

export default function AboutMeetupPage({ user }: { user: any }) {
  return (
    <Layout user={user}>
      <Head>
        <title>About Meetup — The People Platform | Meetup</title>
      </Head>

      <div className="max-w-5xl mx-auto px-4 lg:px-6 pt-8 space-y-10">
        <div className="bg-white rounded-ds2-32 border border-gray-200 p-8 lg:p-12 space-y-4 shadow-xs">
          <span className="ds2-k13 text-[#E51937] uppercase">About Meetup</span>
          <h1 className="ds2-b32 text-gray-900">
            The people platform—where interests become friendships
          </h1>
          <p className="ds2-r16 text-gray-600 leading-relaxed">
            For over 20 years, Meetup has helped more than 64 million members across 190 countries gather in person and online around shared passions—from AI engineering and hiking to board games and language exchange.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
            {[
              { stat: '64M+', label: 'Global members' },
              { stat: '330K+', label: 'Active Meetup groups' },
              { stat: '10,000+', label: 'Cities worldwide' },
              { stat: '100K+', label: 'Events every week' },
            ].map((item) => (
              <div key={item.label} className="p-4 rounded-ds2-20 bg-gray-50 border border-gray-100">
                <p className="ds2-b28 text-[#00798A]">{item.stat}</p>
                <p className="ds2-r12 text-gray-600">{item.label}</p>
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
  return { props: { user: JSON.parse(JSON.stringify(user)) } };
};
