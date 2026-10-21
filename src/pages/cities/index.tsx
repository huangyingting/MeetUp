import Head from 'next/head';
import Link from 'next/link';
import type { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import Layout from '@/components/Layout';
import { prisma } from '@/lib/prisma';
import { getActiveUser } from '@/lib/auth-helper';
import { publicViewer } from '@/lib/presentation';

export default function Cities({ user, cities }: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return <Layout user={user}><Head><title>Around the corner | Meetup</title></Head><div className="shell-container py-12"><p className="eyebrow">Closer than you think</p><h1 className="page-heading mt-4 mb-8">Meet your city.</h1><p className="page-intro max-w-xl mb-10">Places with real communities, built by people who call them home.</p>{cities.length ? <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{cities.map(city => <Link className="surface p-7" href={`/find?source=GROUPS&location=${encodeURIComponent(city)}`} key={city}><h2 className="text-2xl font-semibold">{city}</h2></Link>)}</div> : <div className="empty-state"><h2 className="text-2xl font-semibold">Put your city on the map.</h2><p>Published communities will bring their cities here. Start one where you live.</p><Link className="button-primary" href="/start">Start locally</Link></div>}</div></Layout>;
}

export const getServerSideProps = (async (ctx) => {
  const user = await getActiveUser(ctx.req, ctx.res);
  const groups = await prisma.group.findMany({ where: { isDraft: false, isPrivate: false, city: { not: '' } }, select: { city: true }, distinct: ['city'], orderBy: { city: 'asc' }, take: 200 });
  return { props: { user: publicViewer(user), cities: groups.map(group => group.city) } };
}) satisfies GetServerSideProps;
