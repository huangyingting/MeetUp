import Head from 'next/head';
import Link from 'next/link';
import Layout from '@/components/Layout';

export default function About() {
  return <Layout><Head><title>For a life more connected | Meetup</title></Head><div className="shell-container py-16 max-w-4xl"><p className="eyebrow">For a life more connected</p><h1 className="page-heading mt-5">The best part<br />is showing up.</h1><div className="max-w-2xl mt-9 space-y-6 page-intro"><p>This is a place to turn shared interests into real communities. Find a gathering, join a circle, or bring people together around something you love.</p><p>Every event and community you see is created by a member. There are no invented attendees or ratings. If your city is quiet, you can be the one to start something.</p><p>Communities and events are free to create. Paid subscriptions, ticket sales, and donations are not offered on this deployment.</p></div><div className="flex flex-wrap gap-4 mt-10"><Link className="button-primary" href="/find">Find your next plan</Link><Link className="button-secondary" href="/start">Start a community</Link></div></div></Layout>;
}
