import React, { useState } from 'react';
import Head from 'next/head';
import type { GetServerSideProps } from 'next';
import { Check } from 'lucide-react';
import Layout from '@/components/Layout';
import AccountShell from '@/components/AccountShell';
import { getActiveUser } from '@/lib/auth-helper';
import { gqlRequest } from '@/lib/gqlClient';

export default function AccountPersonalPage({ user }: { user: any }) {
  const [birthDate, setBirthDate] = useState(user.birthDate || '1993-05-15');
  const [gender, setGender] = useState(user.gender || 'Man');
  const [phone, setPhone] = useState(user.phone || '+1 415-555-0192');
  const [saved, setSaved] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await gqlRequest('updateMemberData', {
      input: { birthDate, gender, phone },
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <Layout user={user}>
      <Head>
        <title>Personal Info — Settings | Meetup</title>
      </Head>

      <AccountShell
        title="Personal Info"
        subtitle="Manage your birthday, gender identity, and phone numbers."
      >
        <form onSubmit={handleSave} className="space-y-5 max-w-xl">
          <div>
            <label className="block ds2-m13 text-gray-700 mb-1">Birth Date</label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-ds2-12 border border-gray-300 ds2-r14"
            />
          </div>

          <div>
            <label className="block ds2-m13 text-gray-700 mb-1">Gender</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full px-4 py-2.5 rounded-ds2-12 border border-gray-300 ds2-r14 bg-white"
            >
              <option value="Woman">Woman</option>
              <option value="Man">Man</option>
              <option value="Non-binary">Non-binary</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </div>

          <div>
            <label className="block ds2-m13 text-gray-700 mb-1">SMS Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-2.5 rounded-ds2-12 border border-gray-300 ds2-r14"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-ds2-max bg-gray-900 text-white ds2-b16"
            >
              Save personal info
            </button>
            {saved && (
              <span className="ds2-m13 text-emerald-700 flex items-center gap-1">
                <Check className="w-4 h-4" /> Saved!
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
