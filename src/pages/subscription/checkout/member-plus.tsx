import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import type { GetServerSideProps } from 'next';
import { Sparkles, Check, CheckCircle2, CreditCard } from 'lucide-react';
import Layout from '@/components/Layout';
import { getActiveUser } from '@/lib/auth-helper';
import { gqlRequest } from '@/lib/gqlClient';

export default function MemberPlusCheckoutPage({ user }: { user: any }) {
  const [plan, setPlan] = useState<'YEARLY' | 'MONTHLY'>('YEARLY');
  const [subscribed, setSubscribed] = useState(Boolean(user?.isMeetupPlus));

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    await gqlRequest('subscribeMeetupPlus', { input: { plan } });
    setSubscribed(true);
  };

  return (
    <Layout user={user}>
      <Head>
        <title>Meetup+ Subscription Checkout | Meetup</title>
      </Head>

      <div className="max-w-3xl mx-auto px-4 lg:px-6 pt-8">
        <div className="bg-white rounded-ds2-28 border border-gray-200 overflow-hidden shadow-ds2-sm">
          <div className="p-8 bg-gradient-to-r from-[#141416] via-[#3B0764] to-[#D91B5C] text-white space-y-2">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/15 ds2-m12">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Meetup+ 7-Day Free Trial
            </span>
            <h1 className="ds2-b32">Upgrade to Meetup+</h1>
            <p className="ds2-r16 text-white/85">
              Stand out with the Meetup+ gold badge, unlock full attendee insights, and message anyone.
            </p>
          </div>

          <div className="p-8 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setPlan('YEARLY')}
                className={`p-5 rounded-ds2-20 border-2 text-left ${
                  plan === 'YEARLY' ? 'border-gray-900 bg-gray-50' : 'border-gray-200'
                }`}
              >
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 ds2-b12">
                  Save 25%
                </span>
                <p className="ds2-b20 text-gray-900 mt-2">Yearly Plan</p>
                <p className="ds2-r14 text-gray-600">$10.83/mo ($129.99 billed annually after trial)</p>
              </button>
              <button
                type="button"
                onClick={() => setPlan('MONTHLY')}
                className={`p-5 rounded-ds2-20 border-2 text-left ${
                  plan === 'MONTHLY' ? 'border-gray-900 bg-gray-50' : 'border-gray-200'
                }`}
              >
                <p className="ds2-b20 text-gray-900 mt-2">Monthly Plan</p>
                <p className="ds2-r14 text-gray-600">$14.99/mo billed monthly after trial</p>
              </button>
            </div>

            {subscribed ? (
              <div className="p-5 rounded-ds2-20 bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  <span className="ds2-b16 text-emerald-900">
                    Your Meetup+ 7-day free trial is active!
                  </span>
                </div>
                <Link href="/home" className="ds2-b16 text-[#00798A] hover:underline">
                  Return Home →
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="space-y-4">
                <div>
                  <label className="block ds2-m13 text-gray-700 mb-1">Payment Card</label>
                  <div className="relative">
                    <CreditCard className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      defaultValue="4242 •••• •••• 4242 (Visa)"
                      className="w-full pl-10 pr-4 py-2.5 rounded-ds2-12 border border-gray-300 ds2-r14"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-ds2-max bg-gray-900 hover:bg-black text-white ds2-b16"
                >
                  Start 7-day free trial ($0.00 due today)
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const user = await getActiveUser(ctx.req, ctx.res);
  return {
    props: {
      user: JSON.parse(JSON.stringify(user)),
    },
  };
};
