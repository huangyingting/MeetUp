import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type { GetServerSideProps } from 'next';
import { CreditCard, ShieldCheck, CheckCircle2, Lock } from 'lucide-react';
import Layout from '@/components/Layout';
import { getActiveUser } from '@/lib/auth-helper';
import { gqlRequest } from '@/lib/gqlClient';

export default function OrganizerCheckoutPage({ user }: { user: any }) {
  const router = useRouter();
  const groupName = (router.query.group as string) || 'SF AI & Creative Builders Meetup';
  const [promoCode, setPromoCode] = useState('LAUNCH30');
  const [cardHolder, setCardHolder] = useState(user?.name || 'wlfjck');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [completed, setCompleted] = useState(false);

  const handleCompletePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    await gqlRequest('createOrUpdateDraftGroup', {
      input: {
        name: groupName,
        city: 'San Francisco',
        state: 'CA',
        description:
          'Welcome to our new San Francisco community! Join us for weekly workshops, demos, and social mixers.',
        isDraft: false,
      },
    });
    setCompleted(true);
  };

  return (
    <Layout user={user}>
      <Head>
        <title>Organizer Subscription Checkout | Meetup</title>
      </Head>

      <div className="max-w-4xl mx-auto px-4 lg:px-6 pt-8 grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-7 bg-white rounded-ds2-28 border border-gray-200 p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-2 text-[#00798A] ds2-m13">
            <Lock className="w-4 h-4" />
            <span>Secure 256-bit Encrypted Checkout</span>
          </div>
          <h1 className="ds2-b28 text-gray-900">Complete your Organizer Subscription</h1>

          {completed ? (
            <div className="p-6 rounded-ds2-20 bg-emerald-50 border border-emerald-200 space-y-4">
              <div className="flex items-center gap-3 text-emerald-900">
                <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                <h2 className="ds2-b20">Your group &ldquo;{groupName}&rdquo; is now live!</h2>
              </div>
              <p className="ds2-r14 text-emerald-800">
                We are now announcing your group to members in San Francisco following your topics.
              </p>
              <Link
                href="/groups"
                className="inline-block px-6 py-2.5 rounded-ds2-max bg-gray-900 text-white ds2-b16"
              >
                Go to Your Groups
              </Link>
            </div>
          ) : (
            <form onSubmit={handleCompletePurchase} className="space-y-4">
              <div>
                <label className="block ds2-m13 text-gray-700 mb-1">Name on Card</label>
                <input
                  type="text"
                  required
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-ds2-12 border border-gray-300 ds2-r14"
                />
              </div>
              <div>
                <label className="block ds2-m13 text-gray-700 mb-1">Card Number</label>
                <div className="relative">
                  <CreditCard className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-ds2-12 border border-gray-300 ds2-r14"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block ds2-m13 text-gray-700 mb-1">Expiration (MM/YY)</label>
                  <input
                    type="text"
                    defaultValue="08/29"
                    className="w-full px-4 py-2.5 rounded-ds2-12 border border-gray-300 ds2-r14"
                  />
                </div>
                <div>
                  <label className="block ds2-m13 text-gray-700 mb-1">CVC</label>
                  <input
                    type="text"
                    defaultValue="842"
                    className="w-full px-4 py-2.5 rounded-ds2-12 border border-gray-300 ds2-r14"
                  />
                </div>
              </div>
              <div>
                <label className="block ds2-m13 text-gray-700 mb-1">Promo Code</label>
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-ds2-12 border border-gray-300 ds2-m14 text-emerald-700"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3.5 rounded-ds2-max bg-[#E51937] hover:bg-[#c8142f] text-white ds2-b16 transition"
              >
                Subscribe & Launch Group ($125.94 for 6 months)
              </button>
            </form>
          )}
        </div>

        <aside className="md:col-span-5 bg-white rounded-ds2-28 border border-gray-200 p-6 space-y-4 h-fit">
          <h2 className="ds2-b20 text-gray-900">Order Summary</h2>
          <div className="p-3.5 rounded-ds2-16 bg-gray-50 space-y-1">
            <p className="ds2-b16 text-gray-900">{groupName}</p>
            <p className="ds2-r12 text-gray-500">Standard Organizer Plan · 6 Months</p>
          </div>
          <div className="space-y-2 ds2-r14 border-t border-gray-100 pt-3">
            <div className="flex justify-between">
              <span className="text-gray-600">6-month Standard Plan</span>
              <span>$179.94</span>
            </div>
            <div className="flex justify-between text-emerald-700 font-medium">
              <span>30% Launch Discount (LAUNCH30)</span>
              <span>-$54.00</span>
            </div>
            <div className="flex justify-between ds2-b16 text-gray-900 pt-2 border-t border-gray-100">
              <span>Total due today</span>
              <span>$125.94</span>
            </div>
          </div>
          <div className="flex items-center gap-2 ds2-r12 text-gray-500 pt-2">
            <ShieldCheck className="w-4 h-4 text-[#00798A] shrink-0" />
            <span>30-day money-back guarantee. Cancel anytime in Account Settings.</span>
          </div>
        </aside>
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
