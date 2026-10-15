import React, { useState } from 'react';
import Head from 'next/head';
import type { GetServerSideProps } from 'next';
import Layout from '@/components/Layout';
import AccountShell from '@/components/AccountShell';
import { getActiveUser } from '@/lib/auth-helper';

export default function AccountPrivacyPage({ user }: { user: any }) {
  const [showGroups, setShowGroups] = useState(true);
  const [showInterests, setShowInterests] = useState(true);
  const [allowMessages, setAllowMessages] = useState('ANYONE');

  return (
    <Layout user={user}>
      <Head>
        <title>Privacy — Settings | Meetup</title>
      </Head>

      <AccountShell
        title="Privacy Settings"
        subtitle="Control who can see your profile groups, interests, and send you messages."
      >
        <div className="space-y-4">
          {[
            { label: 'Show my Meetup groups on my profile', checked: showGroups, set: setShowGroups },
            { label: 'Show my interests on my profile', checked: showInterests, set: setShowInterests },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between p-4 rounded-ds2-16 bg-gray-50 border border-gray-200"
            >
              <span className="ds2-m14 text-gray-800">{item.label}</span>
              <button
                type="button"
                role="switch"
                aria-checked={item.checked}
                onClick={() => item.set(!item.checked)}
                className={`w-12 h-7 rounded-full p-1 flex items-center transition ${
                  item.checked ? 'bg-[#00798A] justify-end' : 'bg-gray-300 justify-start'
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-white" />
              </button>
            </div>
          ))}

          <div className="pt-4">
            <label className="block ds2-b16 text-gray-900 mb-2">Who can message you on Meetup?</label>
            <select
              value={allowMessages}
              onChange={(e) => setAllowMessages(e.target.value)}
              className="px-4 py-2.5 rounded-ds2-12 border border-gray-300 ds2-r14 bg-white"
            >
              <option value="ANYONE">Anyone on Meetup</option>
              <option value="SHARED_GROUPS">Members in my groups & Organizers</option>
              <option value="ORGANIZERS_ONLY">Organizers only</option>
            </select>
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
