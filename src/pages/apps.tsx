import React from 'react';
import Head from 'next/head';
import type { GetServerSideProps } from 'next';
import { Smartphone, Check, Star } from 'lucide-react';
import Layout from '@/components/Layout';
import { getActiveUser } from '@/lib/auth-helper';

export default function AppsDownloadPage({ user }: { user: any }) {
  return (
    <Layout user={user}>
      <Head>
        <title>Download the Meetup Mobile App for iOS & Android | Meetup</title>
      </Head>

      <div className="max-w-5xl mx-auto px-4 lg:px-6 pt-8">
        <div className="bg-white rounded-ds2-32 border border-gray-200 p-8 lg:p-12 grid grid-cols-1 md:grid-cols-2 gap-8 items-center shadow-ds2-sm">
          <div className="space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-ds2-max bg-teal-50 text-[#00798A] ds2-b12">
              <Smartphone className="w-4 h-4" /> iOS & Android Apps
            </span>
            <h1 className="ds2-b32 text-gray-900">Take your communities everywhere</h1>
            <p className="ds2-r16 text-gray-600">
              Never miss an RSVP update, group chat message, or last-minute venue pin with the official Meetup mobile app.
            </p>
            <ul className="space-y-2 ds2-r14 text-gray-700">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" /> Instant push notifications & event check-in
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" /> Real-time group discussions & direct messaging
              </li>
              <li className="flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" /> 4.8★ rating across 450,000+ reviews
              </li>
            </ul>
          </div>

          <div className="bg-gray-900 text-white rounded-ds2-28 p-8 text-center space-y-4">
            <p className="ds2-b20">Scan to download</p>
            <div className="w-40 h-40 mx-auto bg-white rounded-ds2-20 flex items-center justify-center text-gray-900 font-mono text-xs p-4">
              [MEETUP MOBILE QR CODE]
            </div>
            <p className="ds2-r12 text-gray-400">Available on the Apple App Store & Google Play</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const user = await getActiveUser(ctx.req, ctx.res);
  return { props: { user: JSON.parse(JSON.stringify(user)) } };
};
