import React from 'react';
import Head from 'next/head';
import type { GetServerSideProps } from 'next';
import { Smartphone } from 'lucide-react';
import Layout from '@/components/Layout';
import AccountShell from '@/components/AccountShell';
import { getActiveUser } from '@/lib/auth-helper';

export default function AccountMobilePage({ user }: { user: any }) {
  return (
    <Layout user={user}>
      <Head>
        <title>Mobile Settings — Settings | Meetup</title>
      </Head>

      <AccountShell
        title="Mobile Settings"
        subtitle="Manage your Meetup iOS and Android app push notifications."
      >
        <div className="p-6 rounded-ds2-20 bg-gray-50 border border-gray-200 flex items-center gap-4">
          <Smartphone className="w-10 h-10 text-[#00798A] shrink-0" />
          <div>
            <h2 className="ds2-b16 text-gray-900">Get the Meetup App on iOS & Android</h2>
            <p className="ds2-r14 text-gray-600 mt-0.5">
              Connected phone: <strong>{user.phone || '+1 415-555-0192'}</strong> · WhatsApp:{' '}
              <strong>{user.whatsappPhone || '+1 415-555-0192'}</strong>
            </p>
          </div>
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
