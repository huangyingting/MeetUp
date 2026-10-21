import { useEffect, useRef, useState, type FormEvent } from 'react';
import { X, Flag, Check } from 'lucide-react';
import { gqlRequest } from '@/lib/gqlClient';
import Select from './Select';

export default function ReportModal({ isOpen, onClose, targetType, targetId, targetName }: {
  isOpen: boolean; onClose: () => void; targetType: 'EVENT' | 'GROUP' | 'MEMBER'; targetId: string; targetName: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (isOpen) { setError(''); setSubmitted(false); dialog.current?.showModal(); }
    else dialog.current?.close();
  }, [isOpen]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError('');
    const data = new FormData(event.currentTarget);
    try { await gqlRequest('submitReport', { input: { targetType, targetId, reason: data.get('reason'), details: data.get('details') } }); setSubmitted(true); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Your report could not be submitted.'); }
    finally { setBusy(false); }
  }
  return <dialog ref={dialog} onCancel={onClose} aria-labelledby="report-title" className="surface p-6 sm:p-8 max-w-lg w-[calc(100%-2rem)] backdrop:bg-black/50">
    <div className="flex justify-between gap-6 items-start"><div><p className="eyebrow flex gap-2"><Flag size={14} />Community care</p><h2 id="report-title" className="text-2xl font-semibold mt-3">Report a concern.</h2></div><button className="p-2" type="button" aria-label="Close report" onClick={onClose}><X size={19} /></button></div>
    {submitted ? <div className="space-y-4 mt-8"><Check size={26} /><p role="status">Your report about {targetName} has been recorded for the site operator.</p><p className="text-sm text-[var(--muted)]">For immediate danger, contact local emergency services. Reports are not an emergency response channel.</p><button className="button-primary" onClick={onClose}>Done</button></div> : <form className="mt-7 space-y-5" onSubmit={submit}><div><label className="field-label" id="report-reason-label" htmlFor="report-reason">What happened?</label><Select id="report-reason" name="reason" options={['Spam or misleading content', 'Harassment or discrimination', 'Unsafe behavior', 'Inappropriate content', 'Something else'].map(reason => ({ value: reason, label: reason }))} /></div><div><label className="field-label" htmlFor="report-details">Additional context (optional)</label><textarea id="report-details" name="details" className="field" rows={4} maxLength={5000} /></div>{error && <p className="form-error" role="alert">{error}</p>}<button className="button-primary" disabled={busy}>Submit report</button></form>}
  </dialog>;
}
