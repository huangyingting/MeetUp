import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import type { GetServerSideProps } from 'next';
import Layout from '@/components/Layout';
import AccountShell from '@/components/AccountShell';
import { getActiveUser } from '@/lib/auth-helper';

export default function AccountCommPage({ user }: { user: any }) {
  const [eventReminders, setEventReminders] = useState(true);
  const [suggestedEvents, setSuggestedEvents] = useState(true);
  const [messageAlerts, setMessageAlerts] = useState(true);

  return (
    <Layout user={user}>
      <Head>
        <title>Email Updates — Settings | Meetup</title>
      </Head>

      <AccountShell
        title="Email & Notification Updates"
        subtitle="Choose which emails and push notifications you want to receive."
      >
        <div className="space-y-6">
          <div className="space-y-3">
            {[
              {
                label: 'Event reminders & RSVP confirmations',
                checked: eventReminders,
                setChecked: setEventReminders,
              },
              {
                label: 'Weekly recommended events in San Francisco, CA',
                checked: suggestedEvents,
                setChecked: setSuggestedEvents,
              },
              {
                label: 'Direct messages from members and organizers',
                checked: messageAlerts,
                setChecked: setMessageAlerts,
              },
            ].map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between p-4 rounded-ds2-16 bg-gray-50 border border-gray-200"
              >
                <span className="ds2-m14 text-gray-800">{row.label}</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={row.checked}
                  onClick={() => row.setChecked(!row.checked)}
                  className={`w-12 h-7 rounded-full p-1 flex items-center transition ${
                    row.checked ? 'bg-[#00798A] justify-end' : 'bg-gray-300 justify-start'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-white" />
                </button>
              </div>
            ))}
          </div>

          <div className="space-y-3 pt-4 border-t border-gray-100">
            <h2 className="ds2-b20 text-gray-900">Your groups&apos; notification settings</h2>
            {user.memberships?.map((m: any) => (
              <div
                key={m.id}
                className="flex items-center justify-between p-4 rounded-ds2-16 border border-gray-200"
              >
                <div>
                  <p className="ds2-b16 text-gray-900">{m.group.name}</p>
                  <p className="ds2-r12 text-gray-500">All event announcements enabled</p>
                </div>
                <Link
                  href={`/account/comm/${m.group.urlname}`}
                  className="px-4 py-1.5 rounded-ds2-max border border-gray-300 hover:border-gray-900 ds2-m13"
                >
                  Edit group preferences
                </Link>
              </div>
            ))}
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
