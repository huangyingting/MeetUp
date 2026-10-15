import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import type { GetServerSideProps } from 'next';
import { Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import Layout from '@/components/Layout';
import { getActiveUser } from '@/lib/auth-helper';

export default function HowToGroupStartPage({ user }: { user: any }) {
  return (
    <Layout user={user}>
      <Head>
        <title>How to Start a Meetup Group | Meetup</title>
      </Head>

      <div className="max-w-4xl mx-auto px-4 lg:px-6 pt-8 space-y-8">
        <div className="bg-white rounded-ds2-32 border border-gray-200 p-8 lg:p-12 space-y-4">
          <span className="ds2-k13 text-[#00798A] uppercase">Organizer Guide</span>
          <h1 className="ds2-b32 text-gray-900">How to start a thriving Meetup group in 6 easy steps</h1>
          <p className="ds2-r16 text-gray-600">
            You don&apos;t need to be an expert to bring people together—just pick a topic you care about, schedule your first gathering, and let Meetup promote it to local members.
          </p>
          <div className="space-y-3 pt-2">
            {[
              '1. Choose your city and up to 15 targeted interest topics.',
              '2. Pick a clear, welcoming name and generate your group description with AI.',
              '3. Schedule your first kickoff event (coffee chat, hike, or tech demo).',
            ].map((step) => (
              <div key={step} className="flex items-center gap-2.5 ds2-m14 text-gray-800">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{step}</span>
              </div>
            ))}
          </div>
          <div className="pt-4">
            <Link
              href="/start"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-ds2-max bg-[#E51937] text-white ds2-b16"
            >
              Launch the 6-step group wizard <ArrowRight className="w-4 h-4" />
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
