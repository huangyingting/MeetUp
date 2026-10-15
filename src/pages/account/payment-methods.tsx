import React, { useState } from 'react';
import Head from 'next/head';
import type { GetServerSideProps } from 'next';
import { CreditCard, Plus } from 'lucide-react';
import Layout from '@/components/Layout';
import AccountShell from '@/components/AccountShell';
import { prisma } from '@/lib/prisma';
import { getActiveUser } from '@/lib/auth-helper';
import { gqlRequest } from '@/lib/gqlClient';

export default function AccountPaymentMethodsPage({
  user,
  initialMethods,
}: {
  user: any;
  initialMethods: any[];
}) {
  const [methods, setMethods] = useState<any[]>(initialMethods);
  const [last4, setLast4] = useState('8891');

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await gqlRequest('addPaymentMethod', {
      input: { brand: 'Mastercard', last4, expMonth: 11, expYear: 2029 },
    });
    const pm = res?.data?.addPaymentMethod?.paymentMethod;
    if (pm) setMethods([...methods, pm]);
  };

  return (
    <Layout user={user}>
      <Head>
        <title>Payment Methods — Settings | Meetup</title>
      </Head>

      <AccountShell
        title="Payment Methods"
        subtitle="Manage saved cards for event tickets, Meetup+, and organizer subscriptions."
      >
        <div className="space-y-4">
          {methods.map((pm) => (
            <div
              key={pm.id}
              className="flex items-center justify-between p-4 rounded-ds2-16 border border-gray-200"
            >
              <div className="flex items-center gap-3">
                <CreditCard className="w-6 h-6 text-[#00798A]" />
                <div>
                  <p className="ds2-b16 text-gray-900">
                    {pm.brand} ending in •••• {pm.last4}
                  </p>
                  <p className="ds2-r12 text-gray-500">
                    Expires {pm.expMonth}/{pm.expYear}
                  </p>
                </div>
              </div>
              {pm.isDefault && (
                <span className="px-2.5 py-0.5 rounded-full bg-teal-50 text-[#00798A] ds2-b12">
                  Default
                </span>
              )}
            </div>
          ))}

          <form onSubmit={handleAddCard} className="pt-4 border-t border-gray-100 flex items-center gap-3">
            <input
              type="text"
              maxLength={4}
              value={last4}
              onChange={(e) => setLast4(e.target.value)}
              placeholder="Last 4 digits"
              className="px-3.5 py-2 rounded-ds2-12 border border-gray-300 ds2-r14 w-36"
            />
            <button
              type="submit"
              className="px-5 py-2 rounded-ds2-max bg-gray-900 text-white ds2-b16 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add payment card
            </button>
          </form>
        </div>
      </AccountShell>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const user = await getActiveUser(ctx.req, ctx.res);
  if (!user) return { redirect: { destination: '/login', permanent: false } };

  const methods = await prisma.paymentMethod.findMany({ where: { userId: user.id } });

  return {
    props: {
      user: JSON.parse(JSON.stringify(user)),
      initialMethods: JSON.parse(JSON.stringify(methods)),
    },
  };
};
