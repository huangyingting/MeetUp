import Head from 'next/head';
import Link from 'next/link';
import type { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import Layout from '@/components/Layout';
import { prisma } from '@/lib/prisma';
import { getActiveUser } from '@/lib/auth-helper';
import { publicViewer } from '@/lib/presentation';

export default function Topic({ user, topic, groups }: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return <Layout user={user}><Head><title>{topic.name} communities | Meetup</title></Head><div className="shell-container py-12"><Link className="eyebrow" href="/topics">Explore interests /</Link><h1 className="page-heading mt-4 mb-6">{topic.name}.</h1><p className="page-intro max-w-2xl mb-10">{topic.description}</p>{groups.length ? <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">{groups.map(({ group }) => <Link key={group.urlname} href={`/${group.urlname}`} className="surface p-7"><h2 className="text-2xl font-semibold">{group.name}</h2><p className="text-sm text-[var(--muted)] mt-3">{group.city} · {group.membersCount} members</p></Link>)}</div> : <div className="empty-state"><h2 className="text-2xl font-semibold">Someone has to start it.</h2><p>No public communities around this interest yet. Yours could be the first.</p><Link className="button-primary" href="/start">Start a community</Link></div>}</div></Layout>;
}

export const getServerSideProps = (async (ctx) => {
  const user = await getActiveUser(ctx.req, ctx.res);
  const topic = await prisma.topic.findUnique({ where: { urlkey: String(ctx.params?.slug || '') }, select: { id: true, name: true, description: true } });
  if (!topic) return { notFound: true };
  const groups = await prisma.groupTopic.findMany({ where: { topicId: topic.id, group: { isDraft: false, isPrivate: false } }, select: { group: { select: { name: true, urlname: true, city: true, membersCount: true } } }, take: 100 });
  return { props: { user: publicViewer(user), topic, groups } };
}) satisfies GetServerSideProps;
