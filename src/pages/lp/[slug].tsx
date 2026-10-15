import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type { GetServerSideProps } from 'next';
import { Sparkles, ArrowRight } from 'lucide-react';
import Layout from '@/components/Layout';
import { getActiveUser } from '@/lib/auth-helper';

export default function LandingSlugPage({ user }: { user: any }) {
  const router = useRouter();
  const slug = (router.query.slug as string) || 'how-to-join-meetup-events';

  const isFriendship = slug.includes('friendship');

  return (
    <Layout user={user}>
      <Head>
        <title>
          {isFriendship
            ? 'Make New Friends & Social Groups | Meetup'
            : 'How to Join Meetup Events | Meetup'}
        </title>
      </Head>

      <div className="max-w-4xl mx-auto px-4 lg:px-6 pt-8">
        <div className="bg-white rounded-ds2-32 border border-gray-200 p-8 lg:p-12 space-y-5 shadow-xs">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-ds2-max bg-teal-50 text-[#00798A] ds2-b12">
            <Sparkles className="w-3.5 h-3.5" /> Meetup Community Guide
          </span>
          <h1 className="ds2-b32 text-gray-900">
            {isFriendship
              ? 'Find friendship groups and social mixers near you'
              : 'How to find and join your first Meetup event'}
          </h1>
          <p className="ds2-r16 text-gray-600">
            Browse local San Francisco events, RSVP with a single click, and connect with welcoming organizers and members.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/find"
              className="px-6 py-3 rounded-ds2-max bg-gray-900 text-white ds2-b16 flex items-center gap-2"
            >
              Browse upcoming events <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/welcome/intent"
              className="px-6 py-3 rounded-ds2-max border border-gray-300 ds2-b16 text-gray-800"
            >
              Personalize your interests
            </Link>
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
