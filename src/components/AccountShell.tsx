import type { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { User, Shield, KeyRound, Compass } from 'lucide-react';

const sections = [
  { href: '/account', title: 'Your profile', icon: User },
  { href: '/account/interests', title: 'Your interests', icon: Compass },
  { href: '/account/privacy', title: 'Privacy & messages', icon: Shield },
  { href: '/account/management', title: 'Account security', icon: KeyRound },
];

export default function AccountShell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  const router = useRouter();
  return <div className="shell-container py-10 lg:py-14 grid lg:grid-cols-[240px_1fr] gap-8">
    <aside><p className="eyebrow mb-5">Make yourself at home</p><nav aria-label="Account settings" className="space-y-1">{sections.map(section => <Link className={`flex gap-3 items-center py-3 px-4 rounded-lg text-sm ${router.pathname === section.href ? 'bg-[var(--forest)] text-white' : 'text-[var(--muted)] hover:bg-[var(--paper)]'}`} aria-current={router.pathname === section.href ? 'page' : undefined} key={section.href} href={section.href}><section.icon size={17} />{section.title}</Link>)}</nav></aside>
    <section className="surface p-6 sm:p-9"><div className="border-b border-[var(--line)] pb-6 mb-7"><h1 className="text-3xl font-semibold tracking-tight">{title}</h1>{subtitle && <p className="text-[var(--muted)] mt-3 text-sm">{subtitle}</p>}</div>{children}</section>
  </div>;
}
