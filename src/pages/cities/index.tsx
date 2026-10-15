import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import type { GetServerSideProps } from 'next';
import { MapPin, Search, Globe } from 'lucide-react';
import Layout from '@/components/Layout';
import { getActiveUser } from '@/lib/auth-helper';

const CITIES_LIST = [
  { name: 'San Francisco, CA', slug: 'us--ca--san-francisco', groups: '4,820 groups', country: 'United States' },
  { name: 'New York, NY', slug: 'us--ny--new-york', groups: '9,410 groups', country: 'United States' },
  { name: 'Los Angeles, CA', slug: 'us--ca--los-angeles', groups: '6,150 groups', country: 'United States' },
  { name: 'Chicago, IL', slug: 'us--il--chicago', groups: '3,890 groups', country: 'United States' },
  { name: 'Austin, TX', slug: 'us--tx--austin', groups: '2,940 groups', country: 'United States' },
  { name: 'Seattle, WA', slug: 'us--wa--seattle', groups: '3,410 groups', country: 'United States' },
  { name: 'Boston, MA', slug: 'us--ma--boston', groups: '2,780 groups', country: 'United States' },
  { name: 'Denver, CO', slug: 'us--co--denver', groups: '2,610 groups', country: 'United States' },
  { name: 'Miami, FL', slug: 'us--fl--miami', groups: '2,120 groups', country: 'United States' },
  { name: 'London, UK', slug: 'gb--london', groups: '7,600 groups', country: 'United Kingdom' },
  { name: 'Berlin, Germany', slug: 'de--berlin', groups: '3,190 groups', country: 'Germany' },
  { name: 'Tokyo, Japan', slug: 'jp--tokyo', groups: '2,850 groups', country: 'Japan' },
  { name: 'Singapore', slug: 'sg--singapore', groups: '1,980 groups', country: 'Singapore' },
  { name: 'Toronto, ON', slug: 'ca--on--toronto', groups: '3,520 groups', country: 'Canada' },
  { name: 'Sydney, Australia', slug: 'au--sydney', groups: '2,740 groups', country: 'Australia' },
  { name: 'Paris, France', slug: 'fr--paris', groups: '2,690 groups', country: 'France' },
];

export default function CitiesPage({ user }: { user: any }) {
  const [query, setQuery] = useState('');

  const filtered = query.trim()
    ? CITIES_LIST.filter(
        (c) =>
          c.name.toLowerCase().includes(query.toLowerCase()) ||
          c.country.toLowerCase().includes(query.toLowerCase())
      )
    : CITIES_LIST;

  return (
    <Layout user={user}>
      <Head>
        <title>Browse Meetup Cities Worldwide | Meetup</title>
      </Head>

      <div className="max-w-[1200px] mx-auto px-4 lg:px-6 pt-8 space-y-8">
        <div className="bg-white rounded-ds2-28 border border-gray-200 p-8 space-y-4">
          <div className="flex items-center gap-2 text-[#00798A] ds2-m13">
            <Globe className="w-4 h-4" />
            <span>Global Community Directory</span>
          </div>
          <h1 className="ds2-b32 text-gray-900">Explore Meetup communities by city</h1>
          <p className="ds2-r16 text-gray-600 max-w-2xl">
            Find local events, tech meetups, outdoor adventures, and social mixers in hundreds of cities around the world.
          </p>

          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for a city or country..."
              className="w-full pl-10 pr-4 py-2.5 rounded-ds2-max border border-gray-300 ds2-r14"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filtered.map((c) => (
            <Link
              key={c.slug}
              href={`/find/${c.slug}?location=${encodeURIComponent(c.name)}`}
              className="bg-white rounded-ds2-20 border border-gray-200 p-5 hover:border-gray-900 hover:shadow-ds2-sm transition space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="ds2-m11 text-gray-400 uppercase">{c.country}</span>
                <MapPin className="w-4 h-4 text-[#E51937]" />
              </div>
              <h2 className="ds2-b16 text-gray-900">{c.name}</h2>
              <p className="ds2-r12 text-[#00798A]">{c.groups}</p>
            </Link>
          ))}
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
