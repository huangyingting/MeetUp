import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import type { GetServerSideProps } from 'next';
import Layout from '@/components/Layout';
import { getActiveUser } from '@/lib/auth-helper';

const SITEMAP_SECTIONS = [
  {
    title: 'Core Experience & Discovery',
    links: [
      { href: '/home', label: 'Home Dashboard (/home)' },
      { href: '/find', label: 'Find Events & Groups (/find)' },
      { href: '/find/online-events', label: 'Online Events (/find/online-events)' },
      { href: '/your-events', label: 'Your Events Calendar (/your-events)' },
      { href: '/groups', label: 'Your Groups Hub (/groups)' },
      { href: '/topics', label: 'Topics Directory (/topics)' },
      { href: '/topics/new-tech', label: 'New Technology Topic (/topics/new-tech)' },
      { href: '/cities', label: 'Cities Directory (/cities)' },
    ],
  },
  {
    title: 'Groups, Events & Creation Wizard',
    links: [
      {
        href: '/singles-mingle-getting-people-together',
        label: 'Singles Mingle Group (/singles-mingle-getting-people-together)',
      },
      {
        href: '/singles-mingle-getting-people-together/events/316287001',
        label: 'In-Person Event Detail (#316287001)',
      },
      {
        href: '/singles-mingle-getting-people-together/events/316287001/attendees',
        label: 'Event Attendees Roster (/attendees)',
      },
      {
        href: '/stackle-your-career-lab/events/316515278',
        label: 'Online Meetup Pro Event (#316515278)',
      },
      { href: '/start', label: '6-Step Group Creation Wizard (/start)' },
      {
        href: '/subscription/checkout/core/organizer',
        label: 'Organizer Subscription Checkout',
      },
      { href: '/welcome/intent', label: '14-Step Onboarding Wizard (/welcome/intent)' },
    ],
  },
  {
    title: 'Profile, Social, Settings & Developer GraphQL',
    links: [
      { href: '/members/484670701', label: 'Member Profile (/members/484670701)' },
      {
        href: '/members/484670701/group/37485736',
        label: 'Group Membership Details (/members/484670701/group/37485736)',
      },
      { href: '/friends', label: 'Connections (/friends)' },
      { href: '/messages', label: 'Messages (/messages)' },
      { href: '/notifications', label: 'Notifications (/notifications)' },
      { href: '/account', label: 'Account Settings (/account)' },
      { href: '/payments/payments_made', label: 'Payments Ledger (/payments/payments_made)' },
      { href: '/meetup-pro', label: 'Meetup Pro (/meetup-pro)' },
      { href: '/graphql', label: 'Developer GraphQL Portal (/graphql)' },
      { href: '/graphql/playground', label: 'Interactive GraphiQL IDE (/graphql/playground)' },
    ],
  },
];

export default function SitemapPage({ user }: { user: any }) {
  return (
    <Layout user={user}>
      <Head>
        <title>Sitemap — All Meetup Pages & Directories | Meetup</title>
      </Head>

      <div className="max-w-[1200px] mx-auto px-4 lg:px-6 pt-8 space-y-8">
        <div>
          <h1 className="ds2-b32 text-gray-900">Meetup Sitemap</h1>
          <p className="ds2-r14 text-gray-500 mt-1">
            Complete index of every route, group subpage, onboarding step, and developer tool.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SITEMAP_SECTIONS.map((sec) => (
            <div
              key={sec.title}
              className="bg-white rounded-ds2-24 border border-gray-200 p-6 space-y-3 shadow-xs"
            >
              <h2 className="ds2-b20 text-gray-900">{sec.title}</h2>
              <ul className="space-y-2 ds2-m14">
                {sec.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-[#00798A] hover:underline">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const user = await getActiveUser(ctx.req, ctx.res);
  return { props: { user: JSON.parse(JSON.stringify(user)) } };
};
