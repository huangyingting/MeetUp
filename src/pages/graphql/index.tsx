import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import type { GetServerSideProps } from 'next';
import { Code2, Terminal, Key, BookOpen, ArrowRight } from 'lucide-react';
import Layout from '@/components/Layout';
import { getActiveUser } from '@/lib/auth-helper';

export default function GraphqlPortalPage({ user }: { user: any }) {
  return (
    <Layout user={user}>
      <Head>
        <title>Meetup GraphQL API Portal | Meetup Developers</title>
      </Head>

      <div className="max-w-[1200px] mx-auto px-4 lg:px-6 pt-8 space-y-8">
        <div className="rounded-ds2-32 bg-gradient-to-r from-[#141416] via-[#1F2937] to-[#00798A] text-white p-8 lg:p-12 space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-ds2-max bg-white/15 ds2-m12">
            <Code2 className="w-4 h-4 text-teal-300" /> Meetup GraphQL API (`/gql2`)
          </span>
          <h1 className="ds2-b32">Build with the Meetup GraphQL API</h1>
          <p className="ds2-r16 text-white/85 max-w-2xl">
            Query events, groups, venues, RSVPs, and member profiles using our unified GraphQL endpoint (`/gql2`) with Automatic Persisted Queries (APQ) and OAuth 2.0.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/graphql/playground"
              className="px-6 py-3 rounded-ds2-max bg-white text-gray-900 ds2-b16 flex items-center gap-2"
            >
              Open GraphiQL Playground <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/graphql/guide"
              className="px-6 py-3 rounded-ds2-max border border-white/30 text-white ds2-b16"
            >
              Read API Guide
            </Link>
            <Link
              href="/graphql/oauth/list"
              className="px-6 py-3 rounded-ds2-max border border-white/30 text-white ds2-b16"
            >
              Manage OAuth Clients
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/graphql/playground"
            className="bg-white rounded-ds2-24 border border-gray-200 p-6 hover:border-gray-900 transition space-y-2"
          >
            <Terminal className="w-8 h-8 text-[#00798A]" />
            <h2 className="ds2-b20 text-gray-900">Interactive GraphiQL IDE</h2>
            <p className="ds2-r14 text-gray-600">
              Test live GraphQL queries and mutations against `/gql2` directly in your browser.
            </p>
          </Link>

          <Link
            href="/graphql/guide"
            className="bg-white rounded-ds2-24 border border-gray-200 p-6 hover:border-gray-900 transition space-y-2"
          >
            <BookOpen className="w-8 h-8 text-[#E51937]" />
            <h2 className="ds2-b20 text-gray-900">Schema & APQ Documentation</h2>
            <p className="ds2-r14 text-gray-600">
              Learn how Meetup uses Automatic Persisted Queries (SHA-256) and cursor pagination.
            </p>
          </Link>

          <Link
            href="/graphql/oauth/list"
            className="bg-white rounded-ds2-24 border border-gray-200 p-6 hover:border-gray-900 transition space-y-2"
          >
            <Key className="w-8 h-8 text-amber-500" />
            <h2 className="ds2-b20 text-gray-900">OAuth 2.0 Credentials</h2>
            <p className="ds2-r14 text-gray-600">
              Register OAuth applications and configure redirect URIs.
            </p>
          </Link>
        </div>
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const user = await getActiveUser(ctx.req, ctx.res);
  return { props: { user: JSON.parse(JSON.stringify(user)) } };
};
