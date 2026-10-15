import React from 'react';
import { X, Calendar, Download, ExternalLink } from 'lucide-react';

interface AddToCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: {
    title: string;
    description?: string;
    dateTime: string;
    endTime?: string;
    venueName?: string;
    venueAddress?: string;
  };
}

export default function AddToCalendarModal({ isOpen, onClose, event }: AddToCalendarModalProps) {
  if (!isOpen) return null;

  const start = new Date(event.dateTime);
  const end = event.endTime ? new Date(event.endTime) : new Date(start.getTime() + 2 * 3600 * 1000);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    event.title
  )}&dates=${fmt(start)}/${fmt(end)}&details=${encodeURIComponent(
    event.description || ''
  )}&location=${encodeURIComponent((event.venueName || '') + ' ' + (event.venueAddress || ''))}`;

  const outlookUrl = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(
    event.title
  )}&startdt=${start.toISOString()}&enddt=${end.toISOString()}&body=${encodeURIComponent(
    event.description || ''
  )}&location=${encodeURIComponent(event.venueName || '')}`;

  const handleDownloadIcs = () => {
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      `SUMMARY:${event.title}`,
      `DTSTART:${fmt(start)}`,
      `DTEND:${fmt(end)}`,
      `LOCATION:${event.venueName || ''} ${event.venueAddress || ''}`,
      `DESCRIPTION:${(event.description || '').replace(/\n/g, '\\n')}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${event.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.ics`;
    link.click();
  };

  return (
    <div
      role="dialog"
      data-state="open"
      aria-label="Add to calendar"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-ds2-24 shadow-ds2-lg-default max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <h2 className="ds2-b20 text-gray-900">Add to calendar</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="ds2-m14 text-gray-700 mt-4 mb-4 line-clamp-2">{event.title}</p>

        <div className="space-y-2.5">
          <a
            href={googleUrl}
            target="_blank"
            rel="noreferrer"
            className="w-full py-3 px-4 rounded-ds2-12 border border-gray-200 hover:border-gray-900 flex items-center justify-between ds2-m14 transition"
          >
            <span className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-blue-600" />
              Google Calendar
            </span>
            <ExternalLink className="w-4 h-4 text-gray-400" />
          </a>

          <button
            type="button"
            onClick={handleDownloadIcs}
            className="w-full py-3 px-4 rounded-ds2-12 border border-gray-200 hover:border-gray-900 flex items-center justify-between ds2-m14 transition"
          >
            <span className="flex items-center gap-2.5">
              <Download className="w-4 h-4 text-emerald-600" />
              Apple Calendar / iCal (.ics)
            </span>
            <span className="ds2-r12 text-gray-400">Download</span>
          </button>

          <a
            href={outlookUrl}
            target="_blank"
            rel="noreferrer"
            className="w-full py-3 px-4 rounded-ds2-12 border border-gray-200 hover:border-gray-900 flex items-center justify-between ds2-m14 transition"
          >
            <span className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-sky-600" />
              Outlook Calendar
            </span>
            <ExternalLink className="w-4 h-4 text-gray-400" />
          </a>
        </div>
      </div>
    </div>
  );
}
