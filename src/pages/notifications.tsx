import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import { Bell, Check } from 'lucide-react';
import Layout from '@/components/Layout';
import { prisma } from '@/lib/prisma';
import { getActiveUser } from '@/lib/auth-helper';
import { publicViewer } from '@/lib/presentation';
import { gqlRequest } from '@/lib/gqlClient';

export default function Notifications({ user, notifications }: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function markRead() {
    setBusy(true); setError('');
    try { await gqlRequest('markNotificationsRead'); await router.replace(router.asPath); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Notifications could not be updated.'); }
    finally { setBusy(false); }
  }
  return <Layout user={user}><Head><title>Your updates | Meetup</title></Head><div className="shell-container py-12 max-w-4xl"><p className="eyebrow">From your circles</p><div className="flex flex-wrap justify-between gap-5 items-end mt-4 mb-10"><h1 className="page-heading">In the loop.</h1>{notifications.some(item => !item.isRead) && <button className="button-secondary" disabled={busy} onClick={markRead}><Check size={16} />Mark all read</button>}</div>{error && <p className="form-error mb-6" role="alert">{error}</p>}{notifications.length ? <div className="space-y-3">{notifications.map(item => <Link key={item.id} href={item.link.startsWith('/') && !item.link.startsWith('//') ? item.link : '/home'} className={`surface p-6 block ${!item.isRead ? 'border-l-4 border-l-[var(--accent)]' : ''}`}><p className="text-xs text-[var(--muted)]">{new Date(item.createdAt).toLocaleDateString('en-US', { timeZone: 'UTC' })}</p><h2 className="font-semibold text-xl mt-2">{item.title}</h2><p className="text-sm text-[var(--muted)] mt-2">{item.body}</p></Link>)}</div> : <div className="empty-state"><Bell size={32} /><h2 className="text-2xl font-semibold">All quiet, in a good way.</h2><p>Updates from your communities and events will appear here. No manufactured activity.</p><Link href="/find" className="button-primary">Explore what&apos;s happening</Link></div>}</div></Layout>;
}

export const getServerSideProps = (async (ctx) => {
  const user = await getActiveUser(ctx.req, ctx.res);
  if (!user) return { redirect: { destination: '/login?callbackUrl=%2Fnotifications', permanent: false } };
  const notifications = await prisma.notification.findMany({ where: { userId: user.id }, select: { id: true, title: true, body: true, link: true, isRead: true, createdAt: true }, orderBy: { createdAt: 'desc' }, take: 100 });
  return { props: { user: publicViewer(user), notifications: notifications.map(item => ({ ...item, createdAt: item.createdAt.toISOString() })) } };
}) satisfies GetServerSideProps;
