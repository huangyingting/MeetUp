import React, { useState } from 'react';
import Head from 'next/head';
import type { GetServerSideProps } from 'next';
import { Check } from 'lucide-react';
import Layout from '@/components/Layout';
import AccountShell from '@/components/AccountShell';
import { getActiveUser } from '@/lib/auth-helper';

export default function AccountManagementPage({ user }: { user: any }) {
  const [email, setEmail] = useState(user.email || 'wlfjck@meetup-clone.dev');
  const [timezone, setTimezone] = useState('America/Los_Angeles (PDT)');
  const [saved, setSaved] = useState(false);

  return (
    <Layout user={user}>
      <Head>
        <title>Account Management — Settings | Meetup</title>
      </Head>

      <AccountShell
        title="Account Management"
        subtitle="Manage your email address, password, language, and account status."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
          }}
          className="space-y-5 max-w-xl"
        >
          <div>
            <label className="block ds2-m13 text-gray-700 mb-1">Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-ds2-12 border border-gray-300 ds2-r14"
            />
          </div>

          <div>
            <label className="block ds2-m13 text-gray-700 mb-1">Time Zone</label>
            <input
              type="text"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full px-4 py-2.5 rounded-ds2-12 border border-gray-300 ds2-r14"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-ds2-max bg-gray-900 text-white ds2-b16"
            >
              Save account settings
            </button>
            {saved && (
              <span className="ds2-m13 text-emerald-700 flex items-center gap-1">
                <Check className="w-4 h-4" /> Updated!
              </span>
            )}
          </div>

          <div className="pt-6 border-t border-gray-100">
            <h3 className="ds2-b16 text-rose-700">Deactivate account</h3>
            <p className="ds2-r12 text-gray-500 mt-1">
              Deactivating your account will remove your profile and RSVPs from all Meetup groups.
            </p>
          </div>
        </form>
      </AccountShell>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const user = await getActiveUser(ctx.req, ctx.res);
  if (!user) return { redirect: { destination: '/login', permanent: false } };
  return { props: { user: JSON.parse(JSON.stringify(user)) } };
};
