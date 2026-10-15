import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import type { GetServerSideProps } from 'next';
import { Key, Plus, ArrowLeft } from 'lucide-react';
import Layout from '@/components/Layout';
import { prisma } from '@/lib/prisma';
import { getActiveUser } from '@/lib/auth-helper';
import { gqlRequest } from '@/lib/gqlClient';

export default function GraphqlOauthListPage({
  user,
  initialApps,
}: {
  user: any;
  initialApps: any[];
}) {
  const [apps, setApps] = useState<any[]>(initialApps);
  const [name, setName] = useState('');
  const [redirectUri, setRedirectUri] = useState('http://localhost:3000/api/auth/callback');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const res = await gqlRequest('createOAuthApp', {
      input: { name, redirectUri, websiteUrl: 'http://localhost:3000' },
    });
    const created = res?.data?.createOAuthApp?.app;
    if (created) {
      setApps([...apps, created]);
      setName('');
    }
  };

  return (
    <Layout user={user}>
      <Head>
        <title>OAuth 2.0 Clients — GraphQL Portal | Meetup</title>
      </Head>

      <div className="max-w-4xl mx-auto px-4 lg:px-6 pt-8 space-y-6">
        <Link
          href="/graphql"
          className="inline-flex items-center gap-1.5 ds2-m14 text-[#00798A] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Developer Portal
        </Link>

        <div className="bg-white rounded-ds2-28 border border-gray-200 p-8 space-y-6 shadow-xs">
          <h1 className="ds2-b28 text-gray-900">Your OAuth 2.0 Consumers</h1>

          <div className="space-y-3">
            {apps.map((app) => (
              <div
                key={app.id}
                className="p-4 rounded-ds2-16 border border-gray-200 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <Key className="w-5 h-5 text-[#00798A]" />
                  <div>
                    <p className="ds2-b16 text-gray-900">{app.name}</p>
                    <p className="ds2-r12 text-gray-500">
                      Key: <code>{app.clientId}</code> · Redirect URI: {app.redirectUri}
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 ds2-b12">
                  Active
                </span>
              </div>
            ))}
          </div>

          <form onSubmit={handleCreate} className="pt-4 border-t border-gray-100 space-y-3">
            <h2 className="ds2-b20 text-gray-900">Register a new OAuth Consumer</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Application Name"
                className="px-4 py-2.5 rounded-ds2-12 border border-gray-300 ds2-r14"
              />
              <input
                type="url"
                required
                value={redirectUri}
                onChange={(e) => setRedirectUri(e.target.value)}
                placeholder="Redirect URI"
                className="px-4 py-2.5 rounded-ds2-12 border border-gray-300 ds2-r14"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-ds2-max bg-gray-900 text-white ds2-b16 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Register OAuth App
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const user = await getActiveUser(ctx.req, ctx.res);
  const apps = user ? await prisma.oAuthClientApp.findMany({ where: { userId: user.id } }) : [];
  return {
    props: {
      user: JSON.parse(JSON.stringify(user)),
      initialApps: JSON.parse(JSON.stringify(apps)),
    },
  };
};
