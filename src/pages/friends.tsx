import Head from 'next/head';
import Link from 'next/link';
import type { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import { Users } from 'lucide-react';
import Layout from '@/components/Layout';
import Avatar from '@/components/Avatar';
import { prisma } from '@/lib/prisma';
import { getActiveUser } from '@/lib/auth-helper';
import { publicViewer } from '@/lib/presentation';

export default function Connections({ user, people }: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return <Layout user={user}><Head><title>Your connections | Meetup</title></Head><div className="shell-container py-12"><p className="eyebrow">Familiar faces</p><h1 className="page-heading mt-4 mb-10">Your connections.</h1>{people.length ? <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{people.map(person => <Link href={`/members/${person.memberId}`} key={person.memberId} className="surface p-6 flex items-center gap-4"><Avatar name={person.name} image={person.image} /><h2 className="font-semibold">{person.name}</h2></Link>)}</div> : <div className="empty-state"><Users size={32} /><h2 className="text-2xl font-semibold">The start of a wider circle.</h2><p>Your accepted connections will appear here.</p><Link className="button-primary" href="/find">Meet people through events</Link></div>}</div></Layout>;
}

export const getServerSideProps = (async (ctx) => {
  const user = await getActiveUser(ctx.req, ctx.res);
  if (!user) return { redirect: { destination: '/login', permanent: false } };
  const connections = await prisma.connection.findMany({ where: { status: 'CONNECTED', OR: [{ requesterId: user.id }, { addresseeId: user.id }] }, select: { requesterId: true, requester: { select: { name: true, memberId: true, image: true } }, addressee: { select: { name: true, memberId: true, image: true } } }, take: 200 });
  return { props: { user: publicViewer(user), people: connections.map(connection => connection.requesterId === user.id ? connection.addressee : connection.requester) } };
}) satisfies GetServerSideProps;
