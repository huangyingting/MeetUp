import React, { useState } from 'react';
import Head from 'next/head';
import type { GetServerSideProps } from 'next';
import Layout from '@/components/Layout';
import AccountShell from '@/components/AccountShell';
import { getActiveUser } from '@/lib/auth-helper';

export default function AccountServicesPage({ user }: { user: any }) {
  const [connected, setConnected] = useState<Record<string, boolean>>({
    Google: true,
    Facebook: false,
    Apple: false,
  });

  return (
    <Layout user={user}>
      <Head>
        <title>Social Media — Settings | Meetup</title>
      </Head>

      <AccountShell
        title="Social Media & Connected Services"
        subtitle="Manage your linked single-sign-on accounts."
      >
        <div className="space-y-3">
          {['Google', 'Facebook', 'Apple'].map((provider) => {
            const isLinked = connected[provider];
            return (
              <div
                key={provider}
                className="flex items-center justify-between p-4 rounded-ds2-16 border border-gray-200"
              >
                <div>
                  <p className="ds2-b16 text-gray-900">{provider}</p>
                  <p className="ds2-r12 text-gray-500">
                    {isLinked ? `Connected as ${user.email}` : 'Not connected'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setConnected({ ...connected, [provider]: !isLinked })}
                  className={`px-4 py-2 rounded-ds2-max ds2-m13 ${
                    isLinked
                      ? 'border border-gray-300 text-gray-700 hover:bg-gray-100'
                      : 'bg-gray-900 text-white'
                  }`}
                >
                  {isLinked ? 'Disconnect' : 'Connect'}
                </button>
              </div>
            );
          })}
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
