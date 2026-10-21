import Head from 'next/head';
import Link from 'next/link';
import Layout from '@/components/Layout';

export default function HostingGuide() {
  return <Layout><Head><title>Make the first move | Meetup</title></Head><div className="shell-container py-16 max-w-4xl"><p className="eyebrow">The organizer&apos;s field notes</p><h1 className="page-heading mt-4 mb-12">Start small.<br />Make it matter.</h1><div className="space-y-5">{[['01', 'Find the common ground.', 'Give your community a clear name, a real location, and a welcoming description. People should know who it is for.'], ['02', 'Make a simple plan.', 'Publish a free event with a specific time, place, and realistic capacity. For online events, your meeting link stays with attendees.'], ['03', 'Be a good host.', 'Set clear expectations. Welcome newcomers. Be thoughtful about accessibility, safety, and the people who make time to join you.']].map(([number, title, body]) => <section className="surface p-7 flex gap-6" key={number}><span className="eyebrow">{number}</span><div><h2 className="text-2xl font-semibold">{title}</h2><p className="text-[var(--muted)] leading-7 mt-3">{body}</p></div></section>)}</div><Link className="button-primary mt-10" href="/start">Create your community</Link></div></Layout>;
}
