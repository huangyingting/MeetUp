import { useEffect, useRef } from 'react';
import { X, Download, ArrowUpRight } from 'lucide-react';
import { buildCalendarEvent, calendarDate, type CalendarEvent } from '@/lib/calendar';

export default function AddToCalendarModal({ isOpen, onClose, event }: { isOpen: boolean; onClose: () => void; event: CalendarEvent }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { if (isOpen) dialog.current?.showModal(); else dialog.current?.close(); }, [isOpen]);
  const google = new URLSearchParams({ action: 'TEMPLATE', text: event.title, dates: `${calendarDate(event.dateTime)}/${calendarDate(event.endTime)}`, details: event.description || '', location: [event.venueName, event.venueAddress].filter(Boolean).join(', ') });
  const outlook = new URLSearchParams({ subject: event.title, startdt: event.dateTime, enddt: event.endTime, body: event.description || '', location: event.venueName || '' });
  function download() {
    const url = URL.createObjectURL(new Blob([buildCalendarEvent(event)], { type: 'text/calendar;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url; link.download = `${event.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'event'}.ics`;
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <dialog ref={dialog} onCancel={onClose} aria-labelledby="calendar-title" className="surface p-7 max-w-md w-[calc(100%-2rem)] backdrop:bg-black/50">
    <div className="flex items-start gap-5 justify-between"><div><p className="eyebrow">Make a little room</p><h2 className="text-2xl font-semibold mt-3" id="calendar-title">Keep the date.</h2></div><button type="button" onClick={onClose} aria-label="Close calendar choices" className="p-2"><X size={19} /></button></div>
    <p className="text-sm text-[var(--muted)] mt-5 mb-7">{event.title}</p>
    <div className="space-y-3"><button className="button-primary w-full justify-between" onClick={download}>Download calendar file <Download size={17} /></button><a className="button-secondary w-full justify-between" href={`https://calendar.google.com/calendar/render?${google}`} target="_blank" rel="noopener noreferrer">Google Calendar <ArrowUpRight size={17} /></a><a className="button-secondary w-full justify-between" href={`https://outlook.live.com/calendar/0/deeplink/compose?${outlook}`} target="_blank" rel="noopener noreferrer">Outlook Calendar <ArrowUpRight size={17} /></a></div>
  </dialog>;
}
