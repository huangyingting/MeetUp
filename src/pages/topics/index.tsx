import Head from 'next/head';
import Link from 'next/link';
import type { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import { ArrowUpRight } from 'lucide-react';
import Layout from '@/components/Layout';
import { prisma } from '@/lib/prisma';
import { getActiveUser } from '@/lib/auth-helper';
import { publicViewer } from '@/lib/presentation';

export default function Topics({ user, categories }: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return <Layout user={user}><Head><title>Follow your curiosity | Meetup</title></Head><div className="shell-container py-12"><p className="eyebrow">Follow a little curiosity</p><h1 className="page-heading mt-4 mb-6">Find your thing.</h1><p className="page-intro max-w-xl mb-12">Big passions. Small obsessions. Whatever brings you to life, there is room for it here.</p><div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">{categories.map(category => <section className="surface p-7" key={category.id}><h2 className="text-2xl font-semibold mb-6">{category.name}</h2><div className="space-y-4">{category.topics.map(topic => <Link key={topic.urlkey} href={`/topics/${topic.urlkey}`} className="text-sm flex justify-between items-center hover:text-[var(--accent)]">{topic.name}<ArrowUpRight size={15} /></Link>)}</div></section>)}</div></div></Layout>;
}

export const getServerSideProps = (async (ctx) => {
  const user = await getActiveUser(ctx.req, ctx.res);
  const categories = await prisma.topicCategory.findMany({ select: { id: true, name: true, topics: { select: { name: true, urlkey: true }, orderBy: { name: 'asc' } } }, orderBy: { name: 'asc' } });
  return { props: { user: publicViewer(user), categories } };
}) satisfies GetServerSideProps;
