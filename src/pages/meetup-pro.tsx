import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import type { GetServerSideProps } from 'next';
import { Globe, BarChart3, Users, Mail, Check, Sparkles } from 'lucide-react';
import Layout from '@/components/Layout';
import { getActiveUser } from '@/lib/auth-helper';

export default function MeetupProPage({ user }: { user: any }) {
  const [groupCount, setGroupCount] = useState(5);
  const monthlyTotal = groupCount * 55;

  return (
    <Layout user={user}>
      <Head>
        <title>Meetup Pro — Enterprise Community & Event Networks | Meetup</title>
      </Head>

      <div className="max-w-[1200px] mx-auto px-4 lg:px-6 pt-8 space-y-12">
        {/* Hero */}
        <section className="rounded-ds2-32 bg-gradient-to-r from-[#141416] via-[#1E1B4B] to-[#00798A] text-white p-8 lg:p-14 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-ds2-max bg-white/15 ds2-m12">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Meetup Pro for Brands & Global Communities
            </span>
            <h1 className="ds2-b32">Scale global community networks with Meetup Pro</h1>
            <p className="ds2-r16 text-white/85">
              Powering developer user groups, brand communities, and global chapters with centralized analytics, attendee email opt-ins, and CRM integrations.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/start"
                className="px-6 py-3 rounded-ds2-max bg-white text-gray-900 ds2-b16 hover:bg-gray-100 transition"
              >
                Start free trial
              </Link>
              <Link
                href="/stackle-your-career-lab"
                className="px-6 py-3 rounded-ds2-max border border-white/30 text-white ds2-b16 hover:bg-white/10 transition"
              >
                View live Pro Network demo
              </Link>
            </div>
          </div>

          {/* Interactive Pro Pricing Calculator */}
          <div className="lg:col-span-5 bg-white text-gray-900 rounded-ds2-28 p-6 space-y-5 shadow-ds2-lg-default">
            <h2 className="ds2-b20">Meetup Pro Network Calculator</h2>
            <div>
              <div className="flex justify-between ds2-m14 mb-2">
                <span>Number of chapters / groups</span>
                <span className="font-bold text-[#00798A]">{groupCount} groups</span>
              </div>
              <input
                type="range"
                min={2}
                max={50}
                value={groupCount}
                onChange={(e) => setGroupCount(Number(e.target.value))}
                className="w-full accent-[#00798A]"
              />
            </div>

            <div className="p-4 rounded-ds2-16 bg-gray-50 border border-gray-200 flex items-baseline justify-between">
              <div>
                <p className="ds2-m12 text-gray-500">Estimated Network Investment</p>
                <p className="ds2-b28 text-gray-900">${monthlyTotal}/mo</p>
              </div>
              <span className="ds2-r12 text-gray-500">$55/group/mo</span>
            </div>

            <ul className="space-y-2 ds2-r14 text-gray-700">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" /> Member email sharing & CSV/CRM export
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" /> Global world map & chapter directory
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" /> Cross-group event syndication
              </li>
            </ul>
          </div>
        </section>

        {/* Feature Pillars */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: Globe,
              title: 'Global Chapter Management',
              desc: 'Organize dozens or hundreds of local chapters from a single centralized dashboard.',
            },
            {
              icon: Mail,
              title: 'First-Party Lead & Email Capture',
              desc: 'Collect opt-in attendee emails during RSVP (like Stackle Career Lab) and sync with HubSpot, Salesforce, or Mailchimp.',
            },
            {
              icon: BarChart3,
              title: 'Real-Time Network Analytics',
              desc: 'Track RSVP growth, attendance retention, and chapter performance across regions.',
            },
          ].map((feat) => (
            <div
              key={feat.title}
              className="bg-white rounded-ds2-24 border border-gray-200 p-6 space-y-3 shadow-xs"
            >
              <feat.icon className="w-8 h-8 text-[#00798A]" />
              <h3 className="ds2-b20 text-gray-900">{feat.title}</h3>
              <p className="ds2-r14 text-gray-600">{feat.desc}</p>
            </div>
          ))}
        </section>
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const user = await getActiveUser(ctx.req, ctx.res);
  return { props: { user: JSON.parse(JSON.stringify(user)) } };
};
