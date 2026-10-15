import React, { useState } from 'react';
import Head from 'next/head';
import type { GetServerSideProps } from 'next';
import { Check } from 'lucide-react';
import Layout from '@/components/Layout';
import AccountShell from '@/components/AccountShell';
import { getActiveUser } from '@/lib/auth-helper';
import { gqlRequest } from '@/lib/gqlClient';

export default function AccountEditProfilePage({ user }: { user: any }) {
  const [name, setName] = useState(user.name || 'wlfjck');
  const [city, setCity] = useState(user.city || 'San Francisco');
  const [state, setState] = useState(user.state || 'CA');
  const [bio, setBio] = useState(
    user.bio || 'Software engineer & AI enthusiast exploring San Francisco communities.'
  );
  const [savedToast, setSavedToast] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await gqlRequest('updateMemberData', {
      input: { name, city, state, bio },
    });
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2500);
  };

  return (
    <Layout user={user}>
      <Head>
        <title>Edit Profile — Settings | Meetup</title>
      </Head>

      <AccountShell
        title="Edit Profile"
        subtitle="This information will appear on your public Meetup profile."
      >
        <form onSubmit={handleSave} className="space-y-5 max-w-xl">
          <div className="flex items-center gap-4">
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-20 h-20 rounded-full object-cover border border-gray-200"
            />
            <div>
              <p className="ds2-b16 text-gray-900">Profile photo</p>
              <p className="ds2-r12 text-gray-500">Member ID: {user.memberId}</p>
            </div>
          </div>

          <div>
            <label className="block ds2-m13 text-gray-700 mb-1">Display Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-ds2-12 border border-gray-300 ds2-r14"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block ds2-m13 text-gray-700 mb-1">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-4 py-2.5 rounded-ds2-12 border border-gray-300 ds2-r14"
              />
            </div>
            <div>
              <label className="block ds2-m13 text-gray-700 mb-1">State</label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-4 py-2.5 rounded-ds2-12 border border-gray-300 ds2-r14"
              />
            </div>
          </div>

          <div>
            <label className="block ds2-m13 text-gray-700 mb-1">Bio</label>
            <textarea
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-4 py-2.5 rounded-ds2-12 border border-gray-300 ds2-r14"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-ds2-max bg-gray-900 hover:bg-black text-white ds2-b16"
            >
              Save changes
            </button>
            {savedToast && (
              <span className="ds2-m13 text-emerald-700 flex items-center gap-1">
                <Check className="w-4 h-4" /> Profile updated!
              </span>
            )}
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
