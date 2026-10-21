import { useState, type FormEvent } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import type { InferGetServerSidePropsType } from 'next';
import type { getCommunityServerSideProps } from '@/server/community';
import { ArrowUpRight, MapPin, Users, Plus, Lock, Calendar, MessageSquare } from 'lucide-react';
import Layout from './Layout';
import Avatar from './Avatar';
import ReportModal from './ReportModal';
import { gqlRequest } from '@/lib/gqlClient';

export default function CommunityPage({ user, group, events, members, pendingMembers, membershipStatus, discussions, photos, reviews, isMember, canView, activeTab }: InferGetServerSidePropsType<typeof getCommunityServerSideProps>) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [reportOpen, setReportOpen] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const isOrganizer = user?.id === group.organizerId;
  const root = `/${group.urlname}`;

  async function mutate(operation: string, input: Record<string, unknown>) {
    if (!user) { await router.push(`/login?callbackUrl=${encodeURIComponent(router.asPath)}`); return false; }
    setBusy(true);
    setError('');
    try { await gqlRequest(operation, { input }); await router.replace(router.asPath); return true; }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'The change could not be saved.'); return false; }
    finally { setBusy(false); }
  }

  async function postDiscussion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    if (await mutate('createDiscussion', { groupId: group.id, title: data.get('title'), body: data.get('body') })) form.reset();
  }

  async function sharePhoto(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    if (!photoFile) {
      if (await mutate('addGroupPhoto', { groupId: group.id, url: data.get('url'), caption: data.get('caption') })) form.reset();
      return;
    }
    setBusy(true); setError('');
    try {
      const query = new URLSearchParams({ groupId: group.id, caption: String(data.get('caption') || '') });
      const response = await fetch(`/api/media?${query}`, { method: 'POST', headers: { 'Content-Type': photoFile.type }, body: photoFile });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Your photo could not be uploaded.');
      await router.replace(router.asPath);
      form.reset(); setPhotoFile(null);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Your photo could not be uploaded.'); }
    finally { setBusy(false); }
  }
  const tabs = [['About', ''], ['Events', '/events'], ['Members', '/members'], ['Conversations', '/discussions'], ['Photos', '/photos']];
  return (
    <Layout user={user}>
      <Head><title>{group.name} | Meetup</title></Head>
      <section className="border-b border-[var(--line)]">
        <div className="shell-container py-10 lg:py-16 grid lg:grid-cols-[1.3fr_.7fr] gap-10 items-center">
          <div>
            <p className="eyebrow">{group.isPrivate ? 'Private community' : 'A place to belong'} {group.isDraft ? ' / Draft' : ''}</p>
            <h1 className="page-heading mt-4">{group.name}</h1>
            <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm mt-6 text-[var(--muted)]">
              <span className="flex gap-2 items-center"><MapPin size={16} />{[group.city, group.state].filter(Boolean).join(', ') || 'Location not provided'}</span>
              <span className="flex gap-2 items-center"><Users size={16} />{group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}</span>
              {group.ratingsCount > 0 && <span>{group.rating.toFixed(1)} / 5 · {group.ratingsCount} reviews</span>}
            </div>
            <div className="flex gap-3 items-center mt-7">
              <Avatar name={group.organizer.name} image={group.organizer.image} size={36} />
              <p className="text-sm">Hosted by <Link className="underline underline-offset-4" href={`/members/${group.organizer.memberId}`}>{group.organizer.name}</Link></p>
            </div>
            <div className="flex flex-wrap gap-3 mt-8">
              {isOrganizer ? <Link className="button-primary" href={`${root}/events/new`}><Plus size={17} /> Create an event</Link>
                : <button className={isMember ? 'button-secondary' : 'button-primary'} disabled={busy || membershipStatus === 'PENDING' || membershipStatus === 'REJECTED'} onClick={() => mutate(isMember ? 'leaveGroup' : 'joinGroup', { groupId: group.id })}>{busy ? 'Saving…' : isMember ? 'Leave community' : membershipStatus === 'PENDING' ? 'Request pending' : membershipStatus === 'REJECTED' ? 'Request declined' : group.isPrivate ? 'Request to join' : 'Join this community'}<ArrowUpRight size={17} /></button>}
              {group.isDraft && isOrganizer && <Link className="button-secondary" href="/start">Finish your draft</Link>}
            </div>
            {error && <p className="form-error mt-4" role="alert">{error}</p>}
          </div>
          <div className="relative aspect-[5/4] overflow-hidden rounded-2xl bg-[var(--forest)] text-[#e5ecd2]">
            {group.coverImage ? <Image src={group.coverImage} alt="" fill className="object-cover" sizes="(min-width: 1024px) 450px, 90vw" /> : <div className="absolute inset-0 flex items-center justify-center overflow-hidden" aria-hidden="true"><div className="w-56 h-56 rounded-full border-[30px] border-current opacity-50 -rotate-12" /><div className="absolute w-56 h-56 rounded-full border-[30px] border-current opacity-50 translate-x-24 translate-y-14" /><span className="absolute bottom-7 left-7 font-mono uppercase text-xs tracking-widest">Good things happen together.</span></div>}
          </div>
        </div>
        <nav className="shell-container flex gap-7 overflow-x-auto" aria-label="Community sections">{tabs.map(([label, path]) => <Link key={label} href={`${root}${path}`} aria-current={activeTab === path ? 'page' : undefined} className={`py-4 text-sm whitespace-nowrap border-b-2 ${activeTab === path ? 'border-[var(--accent)] font-semibold' : 'border-transparent text-[var(--muted)]'}`}>{label}</Link>)}</nav>
      </section>
      <div className="shell-container py-10 lg:py-14">
        {!canView ? <div className="empty-state"><Lock size={30} /><h2 className="text-2xl font-semibold">A little more private.</h2><p>Join this community to see its events, members, and conversations.</p></div> : (
          <>
            {activeTab === '' && <div className="grid lg:grid-cols-[1.3fr_.7fr] gap-10"><section><p className="eyebrow">The common ground</p><h2 className="text-3xl font-semibold mt-3 mb-6">What we&apos;re about.</h2><p className="whitespace-pre-wrap text-[var(--muted)] leading-8">{group.description}</p><div className="mt-7 flex flex-wrap gap-2">{group.topics.map(topic => <Link key={topic.urlkey} href={`/find?keywords=${encodeURIComponent(topic.name)}`} className="text-xs px-3 py-2 border border-[var(--line)] rounded-lg">{topic.name}</Link>)}</div></section><aside className="surface p-7 h-fit"><Calendar size={24} /><h3 className="text-xl font-semibold mt-4">See you at the next one.</h3><p className="text-sm text-[var(--muted)] mt-3 mb-6">Find a reason to get together. Every gathering starts with someone showing up.</p><Link href={`${root}/events`} className="button-secondary">View events <ArrowUpRight size={16} /></Link></aside></div>}
            {activeTab.startsWith('/events') && <section><div className="flex flex-wrap items-center justify-between gap-4 mb-8"><h2 className="text-3xl font-semibold">{activeTab === '/events/past' ? 'Past gatherings' : 'What’s next.'}</h2><div className="flex gap-4 text-sm"><Link className="underline" href={`${root}/events`}>Upcoming</Link><Link className="underline" href={`${root}/events/past`}>Past</Link></div></div>{events.length === 0 ? <div className="empty-state"><Calendar size={30} /><h3 className="text-xl font-semibold">The calendar is open.</h3><p>{isOrganizer ? 'Give your community something to look forward to.' : 'New gatherings will appear here when the organizer publishes them.'}</p>{isOrganizer && <Link className="button-primary" href={`${root}/events/new`}>Create the first event <Plus size={16} /></Link>}</div> : <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">{events.map(event => <Link key={event.id} href={`${root}/events/${event.eventId}`} className="surface p-6 block hover:border-[var(--forest)] transition"><p className="eyebrow">{new Date(event.dateTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: event.timezone })}</p><h3 className="text-2xl font-semibold my-4">{event.title}</h3><p className="text-sm text-[var(--muted)]">{event.eventType === 'ONLINE' ? 'Online' : event.venueName} · {new Date(event.dateTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: event.timezone })}</p><p className="text-xs text-[var(--muted)] mt-3">{event.attendees} going · Free</p></Link>)}</div>}</section>}
            {activeTab === '/members' && <section><h2 className="text-3xl font-semibold mb-8">The people who make it.</h2>{pendingMembers.length > 0 && <div className="surface p-6 mb-8"><p className="eyebrow mb-5">Membership requests</p>{pendingMembers.map(request => <div className="flex flex-wrap justify-between items-center gap-4 py-4 border-t border-[var(--line)]" key={request.id}><div className="flex gap-3 items-center"><Avatar name={request.user.name} image={request.user.image} size={36} /><span className="font-medium">{request.user.name}</span></div><div className="flex gap-2"><button className="button-primary" disabled={busy} onClick={() => mutate('reviewMembershipRequest', { groupId: group.id, membershipId: request.id, approve: true })}>Approve</button><button className="button-secondary" disabled={busy} onClick={() => mutate('reviewMembershipRequest', { groupId: group.id, membershipId: request.id, approve: false })}>Decline</button></div></div>)}</div>}<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{members.map(member => <Link className="surface p-5 flex gap-4 items-center" href={`/members/${member.memberId}`} key={member.memberId}><Avatar name={member.name} image={member.image} /><div><h3 className="font-semibold">{member.name}</h3><p className="text-xs text-[var(--muted)] mt-1">{member.role === 'ORGANIZER' ? 'Organizer' : 'Member'}</p></div></Link>)}</div></section>}
            {activeTab === '/discussions' && <section className="max-w-3xl"><h2 className="text-3xl font-semibold mb-8">Start a conversation.</h2>{isMember && <form onSubmit={postDiscussion} className="surface p-6 space-y-4 mb-8"><label className="field-label" htmlFor="discussion-title">What&apos;s on your mind?</label><input className="field" id="discussion-title" name="title" required minLength={3} maxLength={200} placeholder="A question, an idea, an introduction" /><label className="sr-only" htmlFor="discussion-body">Your message</label><textarea className="field" id="discussion-body" name="body" required minLength={1} maxLength={10000} rows={4} /><button className="button-primary" disabled={busy}>Post conversation <MessageSquare size={16} /></button></form>}{discussions.length === 0 ? <div className="empty-state"><MessageSquare size={30} /><h3 className="text-xl font-semibold">Quiet, for now.</h3><p>{isMember ? 'Break the ice with a hello.' : 'Join the community to begin a conversation.'}</p></div> : discussions.map(discussion => <article className="surface p-6 mb-4" key={discussion.id}><div className="flex gap-3 items-center"><Avatar name={discussion.author.name} image={discussion.author.image} size={32} /><p className="text-sm">{discussion.author.name}</p><time className="text-xs text-[var(--muted)] ml-auto">{new Date(discussion.createdAt).toLocaleDateString('en-US', { timeZone: 'UTC' })}</time></div><h3 className="text-xl font-semibold mt-5">{discussion.title}</h3><p className="whitespace-pre-wrap mt-3 text-[var(--muted)]">{discussion.body}</p></article>)}</section>}
            {activeTab.startsWith('/photos') && <section><h2 className="text-3xl font-semibold mb-8">Moments, kept.</h2>{isMember && <form onSubmit={sharePhoto} className="surface p-6 mb-8 max-w-2xl space-y-4"><div><label className="field-label" htmlFor="photo-file">Upload a photo</label><input className="field" type="file" id="photo-file" name="file" accept="image/jpeg,image/png,image/webp" onChange={event => setPhotoFile(event.target.files?.[0] || null)} /><p className="text-xs text-[var(--muted)] mt-2">JPEG, PNG or WebP, up to 5 MB. Location metadata is removed.</p></div><div><label className="field-label" htmlFor="photo-url">Or share an HTTPS photo link</label><input className="field" type="url" id="photo-url" name="url" pattern="https://.*" required={!photoFile} disabled={Boolean(photoFile)} placeholder="https://" /><p className="text-xs text-[var(--muted)] mt-2">Only share images that you have permission to use.</p></div><div><label className="field-label" htmlFor="photo-caption">Caption (optional)</label><input className="field" id="photo-caption" name="caption" maxLength={1000} /></div><button className="button-primary" disabled={busy}>{busy ? 'Sharing…' : 'Share photo'}</button></form>}{photos.length ? <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{photos.map(photo => <figure className="surface overflow-hidden" key={photo.id}><Image src={photo.url} alt={photo.caption || 'Community photo'} width={600} height={450} className="w-full aspect-[4/3] object-cover" />{photo.caption && <figcaption className="p-4 text-sm">{photo.caption}</figcaption>}</figure>)}</div> : <div className="empty-state"><h3 className="text-xl font-semibold">Memories come after the first hello.</h3><p>No community photos have been shared.</p></div>}</section>}
            {activeTab === '/feedback-overview' && <section><h2 className="text-3xl font-semibold mb-8">Member reflections.</h2>{reviews.length ? reviews.map(review => <article key={review.id} className="surface p-6 mb-4"><p className="font-semibold">{review.author.name} · {review.rating} / 5</p><p className="mt-3">{review.comment}</p></article>) : <div className="empty-state"><p>No reviews yet. We only show feedback from real members.</p></div>}</section>}
          </>
        )}
      </div>
      {user && <div className="shell-container pb-10"><button className="text-xs text-[var(--muted)] underline underline-offset-4" onClick={() => setReportOpen(true)}>Report a concern about this community</button></div>}
      <ReportModal isOpen={reportOpen} onClose={() => setReportOpen(false)} targetType="GROUP" targetId={group.groupId} targetName={group.name} />
    </Layout>
  );
}
