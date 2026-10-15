import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import type { GetServerSideProps } from 'next';
import { BookOpen, ArrowLeft, Terminal } from 'lucide-react';
import Layout from '@/components/Layout';
import { getActiveUser } from '@/lib/auth-helper';

export default function GraphqlGuidePage({ user }: { user: any }) {
  return (
    <Layout user={user}>
      <Head>
        <title>GraphQL Developer Guide | Meetup</title>
      </Head>

      <div className="max-w-4xl mx-auto px-4 lg:px-6 pt-8 space-y-6">
        <Link
          href="/graphql"
          className="inline-flex items-center gap-1.5 ds2-m14 text-[#00798A] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Developer Portal
        </Link>

        <div className="bg-white rounded-ds2-28 border border-gray-200 p-8 space-y-6 shadow-xs">
          <div className="flex items-center justify-between">
            <h1 className="ds2-b32 text-gray-900">Meetup GraphQL API Guide</h1>
            <Link
              href="/graphql/playground"
              className="px-4 py-2 rounded-ds2-max bg-gray-900 text-white ds2-m13 flex items-center gap-1.5"
            >
              <Terminal className="w-4 h-4" /> Try in Playground
            </Link>
          </div>

          <div className="space-y-3">
            <h2 className="ds2-b20 text-gray-900">Endpoint & Authentication</h2>
            <p className="ds2-r14 text-gray-600">
              All GraphQL requests are sent via HTTP <code>POST</code> to <code>/gql2</code> (or <code>/api/gql2</code>). Both single operation payloads and batched operation arrays are supported.
            </p>
            <pre className="p-4 rounded-ds2-16 bg-gray-900 text-teal-300 text-xs overflow-x-auto">
{`POST /gql2
Content-Type: application/json

{
  "operationName": "getRecommendedEvents",
  "variables": { "city": "San Francisco" },
  "extensions": {
    "persistedQuery": {
      "version": 1,
      "sha256Hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    }
  }
}`}
            </pre>
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
