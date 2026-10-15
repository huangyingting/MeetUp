import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import type { GetServerSideProps } from 'next';
import { Crown, Plus } from 'lucide-react';
import Layout from '@/components/Layout';
import AccountShell from '@/components/AccountShell';
import { getActiveUser } from '@/lib/auth-helper';

export default function AccountOrganizerSubscriptionPage({ user }: { user: any }) {
  return (
    <Layout user={user}>
      <Head>
        <title>Organizer Subscription — Settings | Meetup</title>
      </Head>

      <AccountShell
        title="Organizer Subscription"
        subtitle="Manage your Meetup group organizer plans and billing cycle."
      >
        <div className="p-6 rounded-ds2-20 bg-gray-50 border border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <Crown className="w-8 h-8 text-amber-500 shrink-0" />
            <div>
              <h2 className="ds2-b20 text-gray-900">Ready to lead your own community?</h2>
              <p className="ds2-r14 text-gray-600 mt-1">
                Start a Meetup group today and save 30% on your first 6-month Standard or Pro subscription.
              </p>
            </div>
          </div>

          <Link
            href="/start"
            className="px-5 py-2.5 rounded-ds2-max bg-[#E51937] text-white ds2-b16 shrink-0 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Start a group
          </Link>
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
