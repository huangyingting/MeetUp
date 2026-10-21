import { useState, type FormEvent } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import type { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import { ArrowUpRight, Users, MapPin, Check } from 'lucide-react';
import Layout from '@/components/Layout';
import Select from '@/components/Select';
import { getActiveUser } from '@/lib/auth-helper';
import { prisma } from '@/lib/prisma';
import { gqlRequest } from '@/lib/gqlClient';

export default function StartCommunity({ user, topics, draft }: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [selected, setSelected] = useState<string[]>(draft?.topics?.map((item: { topicId: string }) => item.topicId) || []);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setSaved(false);
    const data = new FormData(event.currentTarget);
    const publish = (event.nativeEvent as SubmitEvent).submitter?.getAttribute('value') === 'publish';
    try {
      const draftResult = await gqlRequest<{ saveGroupDraft: { group: { id: string } } }>('saveGroupDraft', { input: {
        name: data.get('name'), city: data.get('city'), state: data.get('state'),
        country: data.get('country'), description: data.get('description'),
        isPrivate: data.get('privacy') === 'private', topicIds: selected,
      } });
      if (publish) {
        const result = await gqlRequest<{ completeGroupCreation: { group: { urlname: string } } }>('completeGroupCreation', { input: { groupId: draftResult.saveGroupDraft.group.id } });
        await router.push(`/${result.completeGroupCreation.group.urlname}`);
      } else setSaved(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Your community could not be saved.');
    } finally { setBusy(false); }
  }

  return (
    <Layout user={user}>
      <Head><title>Start a community | Meetup</title></Head>
      <div className="shell-container py-12 lg:py-20 grid lg:grid-cols-[.8fr_1.2fr] gap-12 lg:gap-20">
        <section className="order-2 lg:order-1">
          <p className="eyebrow">Make the first move</p>
          <h1 className="page-heading mt-5">Something good<br />starts with you.</h1>
          <p className="page-intro mt-6">Bring people together around something you care about. Start small. Make it yours.</p>
          <div className="mt-10 space-y-5 text-sm">
            <p className="flex gap-3"><Users size={19} /> A home for your people, not another feed.</p>
            <p className="flex gap-3"><MapPin size={19} /> Local meetups or connections from anywhere.</p>
            <p className="flex gap-3"><Check size={19} /> Free communities and free events. No card required.</p>
          </div>
        </section>
        <form className="surface p-6 sm:p-9 space-y-6 order-1 lg:order-2" onSubmit={save}>
          <div><label className="field-label" htmlFor="group-name">Community name</label><input className="field" id="group-name" name="name" required minLength={3} maxLength={100} defaultValue={draft?.name || ''} placeholder="A name that feels like your people" /></div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className="field-label" htmlFor="group-city">City</label><input className="field" id="group-city" name="city" required maxLength={100} defaultValue={draft?.city || user.city || ''} /></div>
            <div><label className="field-label" htmlFor="group-state">Region <span className="font-normal">(optional)</span></label><input className="field" id="group-state" name="state" maxLength={100} defaultValue={draft?.state || user.state || ''} /></div>
          </div>
          <div><label className="field-label" htmlFor="group-country">Country code <span className="font-normal">(optional, e.g. GB)</span></label><input className="field" id="group-country" name="country" maxLength={2} pattern="[A-Za-z]{2}" defaultValue={draft?.country || user.country || ''} /></div>
          <div><label className="field-label" htmlFor="group-description">What brings you together?</label><textarea className="field" id="group-description" name="description" required minLength={50} maxLength={10000} rows={6} defaultValue={draft?.description || ''} placeholder="Tell people who this community is for and what you hope to do together." /><p className="text-xs mt-2 text-[var(--muted)]">At least 50 characters. Be specific, welcoming, and honest.</p></div>
          <fieldset><legend className="field-label">Interests <span className="font-normal">(choose up to 5)</span></legend><div className="flex flex-wrap gap-2">
            {topics.map((topic: { id: string; name: string }) => <button className={`px-3 py-2 rounded-lg border text-sm ${selected.includes(topic.id) ? 'bg-[var(--forest)] text-white border-[var(--forest)]' : 'border-[var(--line)]'}`} type="button" key={topic.id} aria-pressed={selected.includes(topic.id)} onClick={() => setSelected(selected.includes(topic.id) ? selected.filter(id => id !== topic.id) : selected.length < 5 ? [...selected, topic.id] : selected)}>{topic.name}</button>)}
          </div></fieldset>
          <div><label className="field-label" id="privacy-label" htmlFor="privacy">Visibility</label><Select name="privacy" id="privacy" defaultValue={draft?.isPrivate ? 'private' : 'public'} options={[{ value: 'public', label: 'Public — anyone can explore' }, { value: 'private', label: 'Private — activity is visible to members' }]} /></div>
          {error && <p className="form-error" role="alert">{error}</p>}
          {saved && <p role="status" className="text-sm text-[var(--forest)]">Draft saved. You can return here whenever you are ready.</p>}
          <div className="flex flex-wrap gap-3"><button className="button-primary" name="action" value="publish" disabled={busy}>Publish community <ArrowUpRight size={17} /></button><button className="button-secondary" name="action" value="draft" disabled={busy}>Save draft</button></div>
        </form>
      </div>
    </Layout>
  );
}

export const getServerSideProps = (async (ctx) => {
  const user = await getActiveUser(ctx.req, ctx.res);
  if (!user) return { redirect: { destination: '/login?callbackUrl=%2Fstart', permanent: false } };
  const [topics, draft] = await Promise.all([
    prisma.topic.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    prisma.group.findFirst({ where: { organizerId: user.id, isDraft: true }, include: { topics: { select: { topicId: true } } } }),
  ]);
  return { props: { user: JSON.parse(JSON.stringify(user)), topics, draft: draft ? JSON.parse(JSON.stringify(draft)) : null } };
}) satisfies GetServerSideProps;
