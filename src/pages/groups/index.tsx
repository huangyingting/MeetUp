import Head from 'next/head';
import Link from 'next/link';
import type { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import { ArrowUpRight, Users, Plus } from 'lucide-react';
import Layout from '@/components/Layout';
import { prisma } from '@/lib/prisma';
import { getActiveUser } from '@/lib/auth-helper';
import { publicViewer } from '@/lib/presentation';

export default function MyCommunities({ user, memberships, drafts }: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return <Layout user={user}><Head><title>Your communities | Meetup</title></Head><div className="shell-container py-12">
    <div className="flex flex-wrap justify-between gap-6 items-end mb-10"><div><p className="eyebrow">Your circles</p><h1 className="page-heading mt-4">Places you belong.</h1></div><Link className="button-primary" href="/start">Start a community <Plus size={17} /></Link></div>
    {drafts.length > 0 && <section className="surface p-6 mb-8"><p className="eyebrow mb-3">A work in progress</p>{drafts.map(draft => <Link className="flex justify-between py-3 font-semibold" key={draft.id} href="/start">{draft.name}<span className="text-sm flex gap-2">Finish your draft <ArrowUpRight size={16} /></span></Link>)}</section>}
    {memberships.length ? <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">{memberships.map(({ group, role }) => <Link key={group.id} href={`/${group.urlname}`} className="surface p-7 hover:border-[var(--forest)] transition"><p className="eyebrow">{role === 'ORGANIZER' ? 'You bring them together' : 'Your community'}</p><h2 className="text-2xl font-semibold mt-5">{group.name}</h2><p className="text-sm text-[var(--muted)] mt-3">{[group.city, group.state].filter(Boolean).join(', ')}</p><p className="text-xs text-[var(--muted)] mt-6">{group.membersCount} members</p></Link>)}</div> : <div className="empty-state"><Users size={32} /><h2 className="text-2xl font-semibold">Find your common ground.</h2><p>Your communities will be here when you join. Explore what people are bringing together.</p><Link className="button-primary" href="/find?source=GROUPS">Explore communities <ArrowUpRight size={17} /></Link></div>}
  </div></Layout>;
}

export const getServerSideProps = (async (ctx) => {
  const user = await getActiveUser(ctx.req, ctx.res);
  if (!user) return { redirect: { destination: '/login?callbackUrl=%2Fgroups', permanent: false } };
  const [memberships, drafts] = await Promise.all([
    prisma.groupMembership.findMany({ where: { userId: user.id, status: 'ACTIVE', group: { isDraft: false } }, select: { role: true, group: { select: { id: true, urlname: true, name: true, city: true, state: true, membersCount: true } } } }),
    prisma.group.findMany({ where: { organizerId: user.id, isDraft: true }, select: { id: true, name: true } }),
  ]);
  return { props: { user: publicViewer(user), memberships, drafts } };
}) satisfies GetServerSideProps;
