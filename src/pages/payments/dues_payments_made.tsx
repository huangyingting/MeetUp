import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import type { GetServerSideProps } from 'next';
import { Receipt } from 'lucide-react';
import Layout from '@/components/Layout';
import AccountShell from '@/components/AccountShell';
import { prisma } from '@/lib/prisma';
import { getActiveUser } from '@/lib/auth-helper';

export default function DuesPaymentsMadePage({
  user,
  transactions,
}: {
  user: any;
  transactions: any[];
}) {
  return (
    <Layout user={user}>
      <Head>
        <title>Group Dues & Subscriptions — Settings | Meetup</title>
      </Head>

      <AccountShell
        title="Group Dues & Organizer Ledger"
        subtitle="Track recurring member dues and contributions."
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
            <Link
              href="/payments/payments_made"
              className="px-4 py-1.5 rounded-ds2-max bg-gray-100 text-gray-700 ds2-m13"
            >
              Payments Made
            </Link>
            <Link
              href="/payments/dues_payments_made"
              className="px-4 py-1.5 rounded-ds2-max bg-gray-900 text-white ds2-m13"
            >
              Organizer Dues & Subscriptions
            </Link>
          </div>

          <div className="divide-y divide-gray-100">
            {transactions.map((tx) => (
              <div key={tx.id} className="py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Receipt className="w-5 h-5 text-[#00798A]" />
                  <div>
                    <p className="ds2-b16 text-gray-900">{tx.description}</p>
                    <p className="ds2-r12 text-gray-500">
                      {new Date(tx.createdAt).toLocaleDateString()} · {tx.type}
                    </p>
                  </div>
                </div>
                <span className="ds2-b16 text-gray-900">${tx.amount.toFixed(2)}</span>
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

  const transactions = await prisma.paymentTransaction.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  });

  return {
    props: {
      user: JSON.parse(JSON.stringify(user)),
      transactions: JSON.parse(JSON.stringify(transactions)),
    },
  };
};
