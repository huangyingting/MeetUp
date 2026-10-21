import { useState, type FormEvent } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { signIn } from 'next-auth/react';
import { ArrowUpRight, ArrowLeft, ShieldCheck } from 'lucide-react';
import Layout from './Layout';

export default function AuthPage({ register = false }: { register?: boolean }) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [emailPending, setEmailPending] = useState(false);
  const callback = typeof router.query.callbackUrl === 'string'
    && router.query.callbackUrl.startsWith('/') && !router.query.callbackUrl.startsWith('//')
    ? router.query.callbackUrl : '/home';

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setBusy(true);
    const fields = new FormData(event.currentTarget);
    const email = String(fields.get('email') || '').trim();
    const password = String(fields.get('password') || '');
    try {
      if (register) {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: fields.get('name'), city: fields.get('city'), email, password }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || result.message || 'Your account could not be created.');
        if (result.verificationRequired) { setEmailPending(true); return; }
      }
      const result = await signIn('credentials', { email, password, redirect: false, callbackUrl: callback });
      if (!result?.ok || result.error) {
        throw new Error(register
          ? 'Your account was created, but sign-in failed. Please try logging in.'
          : 'We could not sign you in. Check your email and password and try again.');
      }
      await router.push(callback);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Layout>
      <Head><title>{register ? 'Create your account' : 'Welcome back'} | Meetup</title></Head>
      <div className="shell-container py-12 lg:py-20 grid lg:grid-cols-2 gap-12 lg:gap-24 items-center">
        <section className="max-w-xl order-2 lg:order-1">
          <Link href="/home" className="inline-flex items-center gap-2 text-sm mb-12"><ArrowLeft size={15} /> Back to discovery</Link>
          <p className="eyebrow">Less scrolling. More showing up.</p>
          <h1 className="page-heading mt-5">Your people.<br />Your next chapter.</h1>
          <p className="page-intro mt-6">A good conversation, a shared interest, a reason to step outside. Make room for something real.</p>
          <div className="mt-10 border-t border-[var(--line)] pt-5 flex items-center gap-3 text-sm text-[var(--muted)]">
            <ShieldCheck size={20} className="shrink-0" /> Your account, your communities. No pre-filled profiles.
          </div>
        </section>
        <section className="surface p-6 sm:p-10 order-1 lg:order-2">
          <p className="eyebrow">{register ? 'A fresh beginning' : 'Pick up where you left off'}</p>
          <h2 className="text-3xl font-semibold tracking-tight mt-3 mb-7">{register ? 'Create an account' : 'Welcome back.'}</h2>
          {!register && router.query.passwordChanged === '1' && <p role="status" className="text-sm text-[var(--forest)] mb-6">Password changed. Log in with your new password.</p>}
          {emailPending ? <div role="status"><p className="text-sm leading-7 text-[var(--forest)]">Your account has been created. Check your inbox for a verification link before logging in.</p><Link className="text-sm underline block mt-5" href="/verify-email">Need another verification email?</Link></div> : <form onSubmit={submit} className="space-y-5">
            {register && <div><label className="field-label" htmlFor="name">Your name</label><input className="field" id="name" name="name" autoComplete="name" minLength={2} maxLength={80} required /></div>}
            <div><label className="field-label" htmlFor="email">Email address</label><input className="field" id="email" name="email" type="email" autoComplete="email" maxLength={254} required /></div>
            <div><label className="field-label" htmlFor="password">Password</label><input className="field" id="password" name="password" type="password" autoComplete={register ? 'new-password' : 'current-password'} minLength={register ? 12 : undefined} maxLength={128} required />{register && <p className="text-xs text-[var(--muted)] mt-2">Use at least 12 characters. A unique passphrase works well.</p>}</div>
            {register && <div><label className="field-label" htmlFor="city">Your city <span className="font-normal text-[var(--muted)]">(optional)</span></label><input className="field" id="city" name="city" autoComplete="address-level2" maxLength={100} /></div>}
            {error && <p className="form-error" role="alert">{error}{register && <> <Link href="/verify-email" className="underline">Verify email.</Link></>}</p>}
            <button className="button-primary w-full justify-between" type="submit" disabled={busy}>{busy ? 'One moment…' : register ? 'Create account' : 'Log in'}<ArrowUpRight size={18} /></button>
          </form>}
          {!register && <div className="flex flex-wrap justify-between gap-3 mt-5 text-xs"><Link href="/forgot-password" className="underline underline-offset-4">Forgot your password?</Link><Link href="/verify-email" className="underline underline-offset-4">Verify your email</Link></div>}
          <p className="text-sm mt-7 text-[var(--muted)]">{register ? 'Already part of the community?' : 'New around here?'}{' '}<Link className="underline underline-offset-4 text-[var(--ink)]" href={{ pathname: register ? '/login' : '/signup', query: { callbackUrl: callback } }}>{register ? 'Log in' : 'Create an account'}</Link></p>
        </section>
      </div>
    </Layout>
  );
}
