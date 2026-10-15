import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type { GetServerSideProps } from 'next';
import { ArrowLeft, Check } from 'lucide-react';
import Layout from '@/components/Layout';
import AccountShell from '@/components/AccountShell';
import { getActiveUser } from '@/lib/auth-helper';

export default function GroupCommDetailPage({ user }: { user: any }) {
  const router = useRouter();
  const groupUrlname = (router.query.groupUrlname as string) || 'singles-mingle-getting-people-together';
  const [newEventEmails, setNewEventEmails] = useState(true);
  const [organizerMessages, setOrganizerMessages] = useState(true);
  const [discussionDigest, setDiscussionDigest] = useState(true);
  const [saved, setSaved] = useState(false);

  return (
    <Layout user={user}>
      <Head>
        <title>Group Email Settings — {groupUrlname} | Meetup</title>
      </Head>

      <AccountShell
        title={`Notification preferences: ${groupUrlname}`}
        subtitle="Customize how often you hear from this specific Meetup group."
      >
        <div className="space-y-4">
          <Link
            href="/account/comm"
            className="inline-flex items-center gap-1.5 ds2-m13 text-[#00798A] hover:underline"
          >
            <ArrowLeft className="w-4 h-4" /> Back to all email settings
          </Link>

          {[
            { label: 'New event announcements', val: newEventEmails, setVal: setNewEventEmails },
            { label: 'Organizer broadcasts & reminders', val: organizerMessages, setVal: setOrganizerMessages },
            { label: 'Group discussion daily digest', val: discussionDigest, setVal: setDiscussionDigest },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between p-4 rounded-ds2-16 bg-gray-50 border border-gray-200"
            >
              <span className="ds2-m14 text-gray-800">{item.label}</span>
              <button
                type="button"
                role="switch"
                aria-checked={item.val}
                onClick={() => item.setVal(!item.val)}
                className={`w-12 h-7 rounded-full p-1 flex items-center transition ${
                  item.val ? 'bg-[#00798A] justify-end' : 'bg-gray-300 justify-start'
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-white" />
              </button>
            </div>
          ))}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setSaved(true);
                setTimeout(() => setSaved(false), 2000);
              }}
              className="px-6 py-2.5 rounded-ds2-max bg-gray-900 text-white ds2-b16"
            >
              Save preferences
            </button>
            {saved && (
              <span className="ds2-m13 text-emerald-700 flex items-center gap-1">
                <Check className="w-4 h-4" /> Saved!
              </span>
            )}
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
