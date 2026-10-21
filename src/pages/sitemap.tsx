import Head from 'next/head';
import Link from 'next/link';
import Layout from '@/components/Layout';

export default function Sitemap() {
  return <Layout><Head><title>Find your way | Meetup</title></Head><div className="shell-container py-12"><p className="eyebrow">A little orientation</p><h1 className="page-heading mt-4 mb-10">Find your way.</h1><div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">{[['Discover', [['Events & communities', '/find'], ['Interests', '/topics'], ['Cities', '/cities']]], ['Your space', [['Your events', '/your-events'], ['Your communities', '/groups'], ['Messages', '/messages'], ['Your profile', '/account']]], ['Start something', [['Create a community', '/start'], ['Hosting guide', '/how-to-group-start'], ['About', '/about']]]].map(([title, links]) => <section className="surface p-7" key={String(title)}><h2 className="text-2xl font-semibold mb-5">{String(title)}</h2>{Array.isArray(links) && links.map(([label, href]) => <Link className="block py-2 text-sm underline underline-offset-4" key={href} href={href}>{label}</Link>)}</section>)}</div></div></Layout>;
}
