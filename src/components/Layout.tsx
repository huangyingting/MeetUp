import React, { useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { signOut, useSession } from 'next-auth/react';
import { ArrowUpRight, ChevronDown, Menu, X } from 'lucide-react';

const favicon = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="15" fill="#202922"/><g fill="none" stroke="#fffef9" stroke-width="3"><ellipse cx="32" cy="32" rx="21" ry="13" transform="rotate(-45 32 32)"/><ellipse cx="32" cy="32" rx="21" ry="13" transform="rotate(45 32 32)"/></g><circle cx="32" cy="32" r="5" fill="#fffef9"/></svg>')}`;

interface LayoutProps {
  children: React.ReactNode;
  user?: { name?: string | null; image?: string | null; memberId?: string } | null;
  hideChrome?: boolean;
}

export default function Layout({ children, user, hideChrome = false }: LayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const authenticated = status === 'authenticated' || (status === 'loading' && Boolean(user));
  const name = session?.user?.name || user?.name || 'Your account';
  const documentHead = <Head><link rel="icon" type="image/svg+xml" href={favicon} /></Head>;

  useEffect(() => { setOpen(false); }, [router.asPath]);
  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', escape);
    };
  }, []);

  if (hideChrome) return <div className="site-shell">{documentHead}{children}</div>;

  return (
    <div className="site-shell">
      {documentHead}
      <a href="#main-content" className="skip-link">Skip to content</a>
      <header className="site-header">
        <div className="shell-container header-inner">
          <Link href="/" className="wordmark" aria-label="Meetup home">meetup<span className="wordmark-dot" /></Link>
          <nav aria-label="Main navigation" className="desktop-nav">
            <Link href="/find" aria-current={router.pathname.startsWith('/find') ? 'page' : undefined}>Explore</Link>
            {authenticated && <><Link href="/your-events">Your events</Link><Link href="/groups">Your groups</Link></>}
          </nav>
          <div className="header-actions">
            <Link href="/start" className="start-link">Start a group <ArrowUpRight size={16} aria-hidden="true" /></Link>
            {!authenticated && <><Link href="/login" className="desktop-login">Log in</Link><Link href="/signup" className="button-primary header-signup">Join Meetup</Link></>}
            <div ref={menuRef} className="account-control">
              <button type="button" onClick={() => setOpen(!open)} className="account-trigger" aria-expanded={open} aria-controls="account-navigation" aria-label={authenticated ? 'Open account menu' : 'Open navigation'}>
                {authenticated ? <><span className="account-initial" aria-hidden="true">{name.slice(0, 1).toUpperCase()}</span><ChevronDown size={14} /></> : open ? <X size={22} /> : <Menu size={22} />}
              </button>
              {open && <nav id="account-navigation" className="account-menu" aria-label="Account navigation">
                {authenticated && <p className="account-name">{name}</p>}
                <Link href="/find">Explore events & groups</Link>
                {authenticated ? <><Link href="/your-events">Your events</Link><Link href="/groups">Your groups</Link><Link href="/account">Account settings</Link><Link href="/messages">Messages</Link><Link href="/notifications">Notifications</Link><button type="button" onClick={() => signOut({ callbackUrl: '/' })}>Sign out</button></> : <><Link href="/login">Log in</Link><Link href="/signup">Create an account</Link></>}
                <Link href="/start">Start a group</Link>
              </nav>}
            </div>
          </div>
        </div>
      </header>
      <main id="main-content" tabIndex={-1}>{children}</main>
      <footer className="site-footer">
        <div className="shell-container">
          <div className="footer-invitation"><p>A shared interest.<br /><strong>A whole new beginning.</strong></p><Link href="/start" className="button-secondary">Start your community <ArrowUpRight size={18} /></Link></div>
          <div className="footer-bottom"><Link href="/" className="wordmark">meetup<span className="wordmark-dot" /></Link><p>Make room for real connection.</p><nav aria-label="Footer"><Link href="/find">Explore</Link><Link href="/about">About</Link><Link href="/topics">Interests</Link></nav><span className="metadata">© {new Date().getFullYear()} Meetup</span></div>
        </div>
      </footer>
    </div>
  );
}
