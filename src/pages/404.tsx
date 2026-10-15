import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Compass } from 'lucide-react';

export default function Custom404Page() {
  return (
    <div className="min-h-screen bg-[#FCFCFD] flex flex-col items-center justify-center p-6 text-center">
      <Head>
        <title>Page Not Found | Meetup</title>
      </Head>
      <div className="max-w-md bg-white rounded-ds2-28 border border-gray-200 p-8 space-y-4 shadow-ds2-sm">
        <Compass className="w-12 h-12 text-[#E51937] mx-auto" />
        <h1 className="ds2-b28 text-gray-900">We couldn&apos;t find that page</h1>
        <p className="ds2-r14 text-gray-600">
          The event or group you&apos;re looking for may have moved, or you can explore upcoming events near San Francisco.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            href="/home"
            className="px-5 py-2.5 rounded-ds2-max bg-gray-900 text-white ds2-b16"
          >
            Go Home
          </Link>
          <Link
            href="/find"
            className="px-5 py-2.5 rounded-ds2-max border border-gray-300 ds2-b16 text-gray-800"
          >
            Find Events
          </Link>
        </div>
      </div>
    </div>
  );
}
