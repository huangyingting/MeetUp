import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import type { GetServerSideProps } from 'next';
import { Bell, CheckCheck, Calendar, Sparkles } from 'lucide-react';
import Layout from '@/components/Layout';
import { prisma } from '@/lib/prisma';
import { getActiveUser } from '@/lib/auth-helper';
import { gqlRequest } from '@/lib/gqlClient';

export default function NotificationsPage({
  user,
  initialNotifications,
}: {
  user: any;
  initialNotifications: any[];
}) {
  const [notifications, setNotifications] = useState<any[]>(initialNotifications);

  const handleMarkAllRead = async () => {
    await gqlRequest('markAllNotificationsRead');
    setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
  };

  return (
    <Layout user={user}>
      <Head>
        <title>Notifications | Meetup</title>
      </Head>

      <div className="max-w-3xl mx-auto px-4 lg:px-6 pt-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="ds2-b32 text-gray-900">Notifications</h1>
            <p className="ds2-r14 text-gray-500">Stay up to date with your groups and RSVPs</p>
          </div>

          <button
            type="button"
            onClick={handleMarkAllRead}
            className="px-4 py-2 rounded-ds2-max border border-gray-300 hover:border-gray-900 ds2-m13 flex items-center gap-1.5"
          >
            <CheckCheck className="w-4 h-4 text-[#00798A]" />
            Mark all as read
          </button>
        </div>

        <div className="bg-white rounded-ds2-24 border border-gray-200 divide-y divide-gray-100 overflow-hidden shadow-xs">
          {notifications.map((n) => (
            <Link
              key={n.id}
              href={n.linkUrl || '/home'}
              className={`p-5 flex items-start justify-between gap-4 hover:bg-gray-50 transition block ${
                !n.isRead ? 'bg-teal-50/40' : ''
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`p-2.5 rounded-full shrink-0 ${
                    !n.isRead ? 'bg-[#00798A] text-white' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  <Bell className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="ds2-b16 text-gray-900">{n.title}</h2>
                    {!n.isRead && (
                      <span className="px-2 py-0.5 rounded-full bg-[#E51937] text-white ds2-b12">
                        New
                      </span>
                    )}
                  </div>
                  <p className="ds2-r14 text-gray-600">{n.body}</p>
                  <p className="ds2-r12 text-gray-400">
                    {new Date(n.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const user = await getActiveUser(ctx.req, ctx.res);
  if (!user) return { redirect: { destination: '/login', permanent: false } };

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  });

  return {
    props: {
      user: JSON.parse(JSON.stringify(user)),
      initialNotifications: JSON.parse(JSON.stringify(notifications)),
    },
  };
};
