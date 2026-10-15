import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import type { GetServerSideProps } from 'next';
import { Play, Code2, ArrowLeft } from 'lucide-react';
import Layout from '@/components/Layout';
import { getActiveUser } from '@/lib/auth-helper';

const DEFAULT_QUERY = `query GetSelfAndEvents {
  self {
    id
    memberId
    name
    email
    city
    state
    isMeetupPlus
  }
  events {
    eventId
    title
    dateTime
    eventType
    venueName
    venueCity
  }
  groups {
    groupId
    name
    urlname
    membersCount
    rating
  }
}`;

export default function GraphqlPlaygroundPage({ user }: { user: any }) {
  const [query, setQuery] = useState(DEFAULT_QUERY);
  const [variables, setVariables] = useState('{\n  "city": "San Francisco"\n}');
  const [responseJson, setResponseJson] = useState<string>('// Click "Execute Query" to run against /gql2');
  const [loading, setLoading] = useState(false);

  const handleRunQuery = async () => {
    setLoading(true);
    try {
      let parsedVars = {};
      try {
        parsedVars = JSON.parse(variables);
      } catch {
        parsedVars = {};
      }
      const res = await fetch('/gql2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          variables: parsedVars,
        }),
      });
      const data = await res.json();
      setResponseJson(JSON.stringify(data, null, 2));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout user={user}>
      <Head>
        <title>GraphiQL Playground — Meetup GraphQL API | Meetup</title>
      </Head>

      <div className="max-w-[1200px] mx-auto px-4 lg:px-6 pt-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/graphql"
              className="inline-flex items-center gap-1 ds2-m13 text-[#00798A] hover:underline"
            >
              <ArrowLeft className="w-4 h-4" /> Portal
            </Link>
            <h1 className="ds2-b24 text-gray-900 flex items-center gap-2">
              <Code2 className="w-6 h-6 text-[#E51937]" />
              GraphiQL Playground (`/gql2`)
            </h1>
          </div>

          <button
            type="button"
            onClick={handleRunQuery}
            disabled={loading}
            className="px-6 py-2.5 rounded-ds2-max bg-[#E51937] hover:bg-[#c8142f] text-white ds2-b16 flex items-center gap-2 shadow-xs transition"
          >
            <Play className="w-4 h-4 fill-white" />
            {loading ? 'Executing...' : 'Execute Query'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left Query & Variables Editor */}
          <div className="bg-[#141416] text-gray-100 rounded-ds2-24 p-5 space-y-4 border border-gray-800">
            <div>
              <label className="block ds2-k13 text-teal-400 uppercase mb-2">
                GraphQL Operation
              </label>
              <textarea
                rows={14}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-black/50 text-emerald-300 font-mono text-xs p-4 rounded-ds2-16 border border-gray-800 focus:outline-none"
              />
            </div>

            <div>
              <label className="block ds2-k13 text-amber-400 uppercase mb-2">
                Query Variables (JSON)
              </label>
              <textarea
                rows={4}
                value={variables}
                onChange={(e) => setVariables(e.target.value)}
                className="w-full bg-black/50 text-amber-200 font-mono text-xs p-3 rounded-ds2-16 border border-gray-800 focus:outline-none"
              />
            </div>
          </div>

          {/* Right Live Response Inspector */}
          <div className="bg-[#141416] text-gray-100 rounded-ds2-24 p-5 border border-gray-800 flex flex-col">
            <label className="block ds2-k13 text-rose-400 uppercase mb-2">
              Response from POST /gql2
            </label>
            <pre className="flex-1 bg-black/50 text-cyan-200 font-mono text-xs p-4 rounded-ds2-16 border border-gray-800 overflow-auto max-h-[460px]">
              {responseJson}
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
