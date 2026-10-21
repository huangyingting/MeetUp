import { useState, type FormEvent } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { signOut } from 'next-auth/react';
import type { InferGetServerSidePropsType } from 'next';
import type { getAccountServerSideProps } from '@/server/account';
import Layout from './Layout';
import AccountShell from './AccountShell';
import Avatar from './Avatar';
import Select from './Select';
import { gqlRequest } from '@/lib/gqlClient';

export default function AccountSettings({ user, section, topics, followedIds }: InferGetServerSidePropsType<typeof getAccountServerSideProps>) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const titles: Record<string, string> = { profile: 'A little more you.', privacy: 'Your space. Your choice.', interests: 'Follow your curiosity.', security: 'Keep your account yours.' };

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(''); setSuccess('');
    const form = event.currentTarget;
    const fields = new FormData(form);
    const input = section === 'security'
      ? { currentPassword: fields.get('currentPassword'), newPassword: fields.get('newPassword') }
      : section === 'privacy' ? { showGroups: fields.get('showGroups') === 'on', showInterests: fields.get('showInterests') === 'on', whoCanContact: fields.get('whoCanContact') }
        : { name: fields.get('name'), city: fields.get('city'), state: fields.get('state'), country: fields.get('country'), bio: fields.get('bio') };
    try {
      await gqlRequest(section === 'security' ? 'changePassword' : 'updateAccountSettings', { input });
      setSuccess(section === 'security' ? 'Password changed.' : 'Your changes have been saved.');
      if (section === 'security') {
        form.reset();
        await signOut({ callbackUrl: '/login?passwordChanged=1' });
        return;
      }
      await router.replace(router.asPath);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Your changes could not be saved.'); }
    finally { setBusy(false); }
  }
  async function toggleTopic(id: string) {
    setBusy(true); setError(''); setSuccess('');
    try { await gqlRequest(followedIds.includes(id) ? 'unfollowTopic' : 'followTopics', { input: followedIds.includes(id) ? { topicId: id } : { topicIds: [id] } }); await router.replace(router.asPath); setSuccess('Interests updated.'); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Your interests could not be saved.'); }
    finally { setBusy(false); }
  }
  return <Layout user={user}><Head><title>Account settings | Meetup</title></Head><AccountShell title={titles[section]} subtitle={section === 'profile' ? 'Only share what you want your community to know.' : section === 'security' ? 'A strong, unique password is a good start.' : undefined}>
    {section === 'interests' ? <div><p className="text-sm text-[var(--muted)] mb-6">Choose the things you care about. Your selected interests are highlighted.</p><div className="flex flex-wrap gap-3">{topics.map(topic => <button type="button" key={topic.id} disabled={busy} aria-pressed={followedIds.includes(topic.id)} onClick={() => toggleTopic(topic.id)} className={`px-4 py-3 border rounded-lg text-sm ${followedIds.includes(topic.id) ? 'bg-[var(--forest)] text-white border-[var(--forest)]' : 'border-[var(--line)]'}`}>{topic.name}</button>)}</div></div> : <form onSubmit={submit} className="space-y-6 max-w-2xl">
      {section === 'profile' && <><div className="flex gap-4 items-center mb-8"><Avatar name={user.name} image={user.image} size={64} /><p className="text-sm text-[var(--muted)]">Your name and introduction appear on your public profile.</p></div><div><label className="field-label" htmlFor="account-name">Your name</label><input className="field" id="account-name" name="name" required minLength={2} maxLength={80} defaultValue={user.name} /></div><div className="grid sm:grid-cols-2 gap-4"><div><label className="field-label" htmlFor="account-city">City</label><input className="field" id="account-city" name="city" maxLength={100} defaultValue={user.city} /></div><div><label className="field-label" htmlFor="account-state">Region</label><input className="field" id="account-state" name="state" maxLength={100} defaultValue={user.state} /></div></div><div><label className="field-label" htmlFor="account-country">Country code (optional)</label><input className="field" id="account-country" name="country" maxLength={2} pattern="[A-Za-z]{2}" defaultValue={user.country} /></div><div><label className="field-label" htmlFor="account-bio">Your introduction</label><textarea className="field" id="account-bio" name="bio" rows={5} maxLength={5000} defaultValue={user.bio || ''} /></div></>}
      {section === 'privacy' && <><div className="space-y-5"><label className="flex gap-3 items-center text-sm"><input type="checkbox" name="showGroups" defaultChecked={user.showGroups} className="w-5 h-5 accent-[var(--forest)]" />Show public communities on my profile</label><label className="flex gap-3 items-center text-sm"><input type="checkbox" name="showInterests" defaultChecked={user.showInterests} className="w-5 h-5 accent-[var(--forest)]" />Show interests on my profile</label></div><div><label className="field-label" id="message-privacy-label" htmlFor="message-privacy">Who can send you messages?</label><Select id="message-privacy" name="whoCanContact" defaultValue={user.whoCanContact} options={[{ value: 'ANYONE', label: 'Any signed-in member' }, { value: 'SHARED_GROUPS', label: 'People in my communities' }, { value: 'ORGANIZERS_ONLY', label: 'My community organizers' }, { value: 'NOBODY', label: 'Nobody' }]} /></div><p className="text-xs text-[var(--muted)]">Your email address, password, and private account details never appear on your public profile.</p></>}
      {section === 'security' && <><div><p className="field-label">Account email</p><p className="text-sm text-[var(--muted)]">{user.email}</p><p className="text-xs mt-2">{user.emailVerified ? 'Email verified' : <Link className="underline" href="/verify-email">Verify your email address</Link>}</p></div><div><label className="field-label" htmlFor="current-password">Current password</label><input className="field" type="password" id="current-password" name="currentPassword" autoComplete="current-password" maxLength={128} required /></div><div><label className="field-label" htmlFor="new-password">New password</label><input className="field" type="password" id="new-password" name="newPassword" autoComplete="new-password" minLength={12} maxLength={128} required /><p className="text-xs text-[var(--muted)] mt-2">At least 12 characters. Use a password you don&apos;t use elsewhere.</p></div></>}
      <button type="submit" className="button-primary" disabled={busy}>{busy ? 'Saving…' : section === 'security' ? 'Change password' : 'Save changes'}</button>
    </form>}
    {error && <p className="form-error mt-5" role="alert">{error}</p>}{success && <p className="text-sm text-[var(--forest)] mt-5" role="status">{success}</p>}
  </AccountShell></Layout>;
}
