import { useState, type FormEvent } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import { MessageSquare, Send } from 'lucide-react';
import Layout from '@/components/Layout';
import Avatar from '@/components/Avatar';
import { prisma } from '@/lib/prisma';
import { getActiveUser } from '@/lib/auth-helper';
import { publicViewer } from '@/lib/presentation';
import { gqlRequest } from '@/lib/gqlClient';

export default function MessagesPage({ user, peers, messages, selected }: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    const form = event.currentTarget;
    const body = String(new FormData(form).get('body') || '').trim();
    setError(''); setBusy(true);
    try { await gqlRequest('sendMessage', { input: { receiverId: selected.id, body } }); form.reset(); await router.replace(router.asPath); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Your message could not be sent.'); }
    finally { setBusy(false); }
  }
  return <Layout user={user}><Head><title>Conversations | Meetup</title></Head><div className="shell-container py-12"><p className="eyebrow">Keep the conversation going</p><h1 className="page-heading mt-4 mb-10">A little more connection.</h1>
    <div className="surface grid md:grid-cols-[280px_1fr] min-h-[480px] overflow-hidden"><aside className="border-b md:border-b-0 md:border-r border-[var(--line)] p-4"><h2 className="eyebrow px-3 py-4">Your conversations</h2>{peers.length ? peers.map(peer => <Link key={peer.id} className={`flex gap-3 p-3 rounded-lg items-center ${selected?.id === peer.id ? 'bg-[var(--canvas)]' : ''}`} href={`/messages?to=${peer.memberId}`}><Avatar name={peer.name} image={peer.image} size={36} /><span className="text-sm font-medium">{peer.name}</span></Link>) : <p className="text-sm px-3 py-5 text-[var(--muted)]">No conversations yet. Meet someone at an event, then say hello from their profile.</p>}</aside>
      {selected ? <section className="flex flex-col min-w-0"><div className="p-5 border-b border-[var(--line)] flex gap-3 items-center"><Avatar name={selected.name} image={selected.image} size={36} /><Link href={`/members/${selected.memberId}`} className="font-semibold">{selected.name}</Link></div><div className="p-5 flex-1 space-y-4 max-h-[500px] overflow-y-auto">{messages.length ? messages.map(message => <article key={message.id} className={`rounded-xl p-4 max-w-[85%] ${message.senderId === user?.id ? 'ml-auto bg-[var(--forest)] text-white' : 'bg-[var(--canvas)]'}`}><p className="text-sm whitespace-pre-wrap break-words">{message.body}</p><time className="block mt-2 text-[10px] opacity-70">{new Date(message.createdAt).toLocaleString('en-US', { timeZone: 'UTC' })} UTC</time></article>) : <p className="text-sm text-[var(--muted)]">A thoughtful hello is a good place to start.</p>}</div><form onSubmit={send} className="p-5 border-t border-[var(--line)] space-y-3"><label className="sr-only" htmlFor="message-body">Your message</label><div className="flex gap-3"><input className="field" id="message-body" name="body" maxLength={5000} required placeholder={`Write to ${selected.name}`} /><button className="button-primary shrink-0" disabled={busy} aria-label="Send message"><Send size={17} /></button></div>{error && <p className="form-error" role="alert">{error}</p>}</form></section> : <div className="empty-state border-0"><MessageSquare size={34} /><h2 className="text-xl font-semibold">Real conversations start here.</h2><p>Select a conversation or visit a member&apos;s profile to get in touch.</p></div>}
    </div>
  </div></Layout>;
}

export const getServerSideProps = (async (ctx) => {
  const user = await getActiveUser(ctx.req, ctx.res);
  if (!user) return { redirect: { destination: '/login?callbackUrl=%2Fmessages', permanent: false } };
  const ownMessages = await prisma.message.findMany({
    where: { OR: [{ senderId: user.id }, { receiverId: user.id }] },
    select: { senderId: true, receiverId: true }, take: 1000, orderBy: { createdAt: 'desc' },
  });
  const peerIds = [...new Set(ownMessages.flatMap(message => [message.senderId, message.receiverId]).filter(id => id !== user.id))];
  const requestedMember = typeof ctx.query.to === 'string' ? ctx.query.to : '';
  const peers = await prisma.user.findMany({
    where: { id: { not: user.id }, OR: [{ id: { in: peerIds } }, ...(requestedMember ? [{ memberId: requestedMember }] : [])] },
    select: { id: true, memberId: true, name: true, image: true },
  });
  const selected = peers.find(peer => peer.memberId === requestedMember) || peers[0] || null;
  const messages = selected ? await prisma.message.findMany({ where: { OR: [{ senderId: user.id, receiverId: selected.id }, { senderId: selected.id, receiverId: user.id }] }, select: { id: true, senderId: true, body: true, createdAt: true }, orderBy: { createdAt: 'desc' }, take: 100 }) : [];
  if (selected) await prisma.message.updateMany({ where: { receiverId: user.id, senderId: selected.id, isRead: false }, data: { isRead: true } });
  return { props: { user: publicViewer(user), peers, selected, messages: messages.reverse().map(message => ({ ...message, createdAt: message.createdAt.toISOString() })) } };
}) satisfies GetServerSideProps;
