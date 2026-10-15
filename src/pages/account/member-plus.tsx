import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import type { GetServerSideProps } from 'next';
import { Sparkles, Check } from 'lucide-react';
import Layout from '@/components/Layout';
import AccountShell from '@/components/AccountShell';
import { getActiveUser } from '@/lib/auth-helper';
import { gqlRequest } from '@/lib/gqlClient';

export default function AccountMemberPlusPage({ user }: { user: any }) {
  const [isPlus, setIsPlus] = useState(Boolean(user.isMeetupPlus));

  return (
    <Layout user={user}>
      <Head>
        <title>Meetup+ Subscription — Settings | Meetup</title>
      </Head>

      <AccountShell
        title="Meetup+ Membership"
        subtitle="Manage your Meetup+ subscriber perks and billing."
      >
        <div className="rounded-ds2-24 bg-gradient-to-r from-[#141416] via-[#3B0764] to-[#D91B5C] p-6 text-white space-y-4">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/15 ds2-m12">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              {isPlus ? 'Active Subscriber' : '7-Day Free Trial Available'}
            </span>
          </div>
          <h2 className="ds2-b24">Supercharge your social life with Meetup+</h2>
          <ul className="space-y-1.5 ds2-r14 text-white/90">
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-300" /> Unlock full event attendee insights & shared interests
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-300" /> Priority waitlist access on popular San Francisco events
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-300" /> Stand out with the exclusive Meetup+ profile badge
            </li>
          </ul>
          {!isPlus ? (
            <button
              type="button"
              onClick={async () => {
                await gqlRequest('subscribeMeetupPlus', { input: { plan: 'YEARLY' } });
                setIsPlus(true);
              }}
              className="px-6 py-2.5 rounded-ds2-max bg-white text-gray-900 ds2-b16"
            >
              Start 7-day free trial
            </button>
          ) : (
            <p className="ds2-b16 text-emerald-300">✓ Your Meetup+ plan is active</p>
          )}
        </div>
      </AccountShell>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const user = await getActiveUser(ctx.req, ctx.res);
  if (!user) return { redirect: { destination: '/login', permanent: false } };
  return { props: { user: JSON.parse(JSON.stringify(user)) } };
};
