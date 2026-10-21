import { useEffect, useRef, useState, type FormEvent } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from './Layout';

export default function AccountAccess({ mode }: { mode: 'forgot' | 'reset' | 'verify' }) {
  const [token, setToken] = useState('');
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const tokenRead = useRef(false);
  useEffect(() => {
    if (tokenRead.current) return;
    tokenRead.current = true;
    setToken(new URLSearchParams(window.location.hash.slice(1)).get('token') || '');
    window.history.replaceState(window.history.state, '', window.location.pathname);
    setReady(true);
  }, []);
  const title = mode === 'forgot' ? 'Find your way back.' : mode === 'reset' ? 'A fresh start.' : 'Make it official.';
  const requesting = mode === 'forgot' || (mode === 'verify' && !token);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError(''); setMessage('');
    const fields = new FormData(event.currentTarget);
    try {
      if (mode === 'reset' && fields.get('password') !== fields.get('confirmation')) throw new Error('Your new passwords do not match.');
      const response = await fetch('/api/auth/account', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requesting
          ? { action: mode === 'forgot' ? 'request-reset' : 'request-verification', email: fields.get('email') }
          : { action: mode === 'reset' ? 'reset-password' : 'verify-email', token, password: fields.get('password') }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'This request could not be completed.');
      setMessage(result.message);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'This request could not be completed.');
    } finally { setBusy(false); }
  }
  return <Layout><Head><title>{mode === 'verify' ? 'Verify email' : 'Account recovery'} | Meetup</title><meta name="referrer" content="no-referrer" /></Head>
    <div className="shell-container py-12 lg:py-20"><div className="surface max-w-lg mx-auto p-7 sm:p-10">
      <p className="eyebrow">Your account, kept yours</p><h1 className="text-4xl font-semibold tracking-tight mt-4">{title}</h1>
      <p className="text-sm leading-7 text-[var(--muted)] mt-5 mb-7">{requesting ? `Enter your account email and we will send a single-use ${mode === 'forgot' ? 'password reset' : 'verification'} link.` : mode === 'verify' ? 'Confirm that this is your email address. Your link is used only when you press the button below.' : 'Choose a unique password with at least 12 characters.'}</p>
      {message ? <p role="status" className="text-sm leading-7 text-[var(--forest)]">{message}</p> : ready && mode === 'reset' && !token ? <p className="form-error">This page needs a password reset link. <Link href="/forgot-password" className="underline">Request a new one.</Link></p> : <form onSubmit={submit} className="space-y-5">
        {requesting && <div><label htmlFor="access-email" className="field-label">Email address</label><input className="field" id="access-email" name="email" type="email" autoComplete="email" maxLength={254} required /></div>}
        {mode === 'reset' && token && <><div><label htmlFor="access-password" className="field-label">New password</label><input className="field" id="access-password" name="password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required /></div><div><label htmlFor="access-confirmation" className="field-label">Confirm new password</label><input className="field" id="access-confirmation" name="confirmation" type="password" autoComplete="new-password" minLength={12} maxLength={128} required /></div></>}
        <button className="button-primary w-full" disabled={busy || !ready}>{busy ? 'One moment…' : requesting ? 'Send email link' : mode === 'verify' ? 'Verify my email' : 'Reset password'}</button>
      </form>}
      {error && <p role="alert" className="form-error mt-5">{error}{!requesting && <> <Link href={mode === 'verify' ? '/verify-email' : '/forgot-password'} className="underline">Request a new link.</Link></>}</p>}
      <Link href="/login" className="text-sm underline underline-offset-4 block mt-7">Back to log in</Link>
    </div></div>
  </Layout>;
}
