import Head from 'next/head';
import Link from 'next/link';
import Layout from '@/components/Layout';

export default function NotFound() {
  return <Layout><Head><title>A different direction | Meetup</title></Head><div className="shell-container py-20"><p className="eyebrow">404 / A different direction</p><h1 className="page-heading mt-5">Not here.<br />But there&apos;s more out there.</h1><p className="page-intro mt-6 max-w-xl">This page is unavailable, private, or no longer exists. Find your way back to something worth showing up for.</p><Link className="button-primary mt-9" href="/find">Back to discovery</Link></div></Layout>;
}
