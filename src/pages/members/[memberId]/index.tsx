import Head from 'next/head';
import Link from 'next/link';
import type { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import { MapPin, MessageSquare, ArrowUpRight } from 'lucide-react';
import Layout from '@/components/Layout';
import Avatar from '@/components/Avatar';
import { prisma } from '@/lib/prisma';
import { getActiveUser } from '@/lib/auth-helper';
import { publicViewer } from '@/lib/presentation';

export default function MemberProfile({ user, profile }: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return <Layout user={user}><Head><title>{profile.name} | Meetup</title></Head><div className="shell-container py-12 lg:py-20 grid lg:grid-cols-[.75fr_1.25fr] gap-12">
    <section><Avatar name={profile.name} image={profile.image} size={100} /><p className="eyebrow mt-8">One of the people</p><h1 className="page-heading mt-4">{profile.name}</h1>{profile.city && <p className="flex items-center gap-2 text-sm text-[var(--muted)] mt-5"><MapPin size={16} />{[profile.city, profile.state].filter(Boolean).join(', ')}</p>}<p className="text-xs text-[var(--muted)] mt-4">Here since {new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })}</p>{user?.id === profile.id ? <Link className="button-secondary mt-7" href="/account">Edit your profile <ArrowUpRight size={16} /></Link> : profile.canContact && <Link className="button-primary mt-7" href={user ? `/messages?to=${profile.memberId}` : `/login?callbackUrl=${encodeURIComponent(`/messages?to=${profile.memberId}`)}`}>Say hello <MessageSquare size={16} /></Link>}</section>
    <div className="space-y-10"><section className="surface p-7"><p className="eyebrow">In their own words</p><h2 className="text-2xl font-semibold mt-3 mb-5">A little introduction.</h2><p className="text-[var(--muted)] whitespace-pre-wrap leading-7">{profile.bio || 'This member hasn’t added an introduction yet.'}</p></section>{profile.topics.length > 0 && <section><h2 className="text-2xl font-semibold mb-5">Common interests.</h2><div className="flex flex-wrap gap-2">{profile.topics.map(topic => <Link href={`/topics/${topic.urlkey}`} key={topic.urlkey} className="px-4 py-2 border border-[var(--line)] rounded-lg text-sm">{topic.name}</Link>)}</div></section>}{profile.groups.length > 0 && <section><h2 className="text-2xl font-semibold mb-5">Their circles.</h2><div className="grid sm:grid-cols-2 gap-4">{profile.groups.map(group => <Link className="surface p-6" key={group.urlname} href={`/${group.urlname}`}><h3 className="font-semibold">{group.name}</h3><p className="text-sm text-[var(--muted)] mt-2">{group.city}</p></Link>)}</div></section>}</div>
  </div></Layout>;
}

export const getServerSideProps = (async (ctx) => {
  const user = await getActiveUser(ctx.req, ctx.res);
  const memberId = String(ctx.params?.memberId || '');
  const profile = await prisma.user.findUnique({
    where: { memberId },
    select: { id: true, memberId: true, name: true, image: true, bio: true, city: true, state: true, createdAt: true, showGroups: true, showInterests: true, whoCanContact: true,
      topics: { select: { topic: { select: { name: true, urlkey: true } } } },
      memberships: { where: { status: 'ACTIVE', group: { isPrivate: false, isDraft: false } }, select: { group: { select: { name: true, urlname: true, city: true } } } },
    },
  });
  if (!profile) return { notFound: true };
  return { props: { user: publicViewer(user), profile: { id: profile.id, memberId: profile.memberId, name: profile.name, image: profile.image, bio: profile.bio, city: profile.city, state: profile.state, createdAt: profile.createdAt.toISOString(), canContact: profile.whoCanContact === 'ANYONE', topics: profile.showInterests || profile.id === user?.id ? profile.topics.map(item => item.topic) : [], groups: profile.showGroups || profile.id === user?.id ? profile.memberships.map(item => item.group) : [] } } };
}) satisfies GetServerSideProps;
