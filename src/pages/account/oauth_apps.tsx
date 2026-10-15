import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import type { GetServerSideProps } from 'next';
import { Code2, ExternalLink } from 'lucide-react';
import Layout from '@/components/Layout';
import AccountShell from '@/components/AccountShell';
import { prisma } from '@/lib/prisma';
import { getActiveUser } from '@/lib/auth-helper';

export default function AccountOauthAppsPage({
  user,
  apps,
}: {
  user: any;
  apps: any[];
}) {
  return (
    <Layout user={user}>
      <Head>
        <title>Authorized OAuth Apps — Settings | Meetup</title>
      </Head>

      <AccountShell
        title="Authorized Applications"
        subtitle="Manage third-party OAuth 2.0 applications connected to your Meetup account."
      >
        <div className="space-y-4">
          {apps.map((app) => (
            <div
              key={app.id}
              className="p-4 rounded-ds2-16 border border-gray-200 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <Code2 className="w-6 h-6 text-[#00798A]" />
                <div>
                  <p className="ds2-b16 text-gray-900">{app.name}</p>
                  <p className="ds2-r12 text-gray-500">
                    Client ID: <code>{app.clientId}</code> · Redirect: {app.redirectUri}
                  </p>
                </div>
              </div>
              <Link
                href="/graphql/oauth/list"
                className="px-4 py-1.5 rounded-ds2-max border border-gray-300 hover:border-gray-900 ds2-m13 flex items-center gap-1"
              >
                Manage in Developer Portal <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      </AccountShell>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const user = await getActiveUser(ctx.req, ctx.res);
  if (!user) return { redirect: { destination: '/login', permanent: false } };

  const apps = await prisma.oAuthClientApp.findMany({ where: { userId: user.id } });

  return {
    props: {
      user: JSON.parse(JSON.stringify(user)),
      apps: JSON.parse(JSON.stringify(apps)),
    },
  };
};
