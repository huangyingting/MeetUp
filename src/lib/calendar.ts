export interface CalendarEvent {
  eventId?: string;
  title: string;
  description?: string;
  dateTime: string;
  endTime: string;
  venueName?: string;
  venueAddress?: string;
}

export function calendarDate(value: string | Date) {
  return new Date(value).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function escapeText(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/\r\n|\r|\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,');
}

export function buildCalendarEvent(event: CalendarEvent, now = new Date()) {
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Meetup//Community Events//EN', 'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT', `UID:${escapeText(event.eventId || crypto.randomUUID())}@community`,
    `DTSTAMP:${calendarDate(now)}`, `DTSTART:${calendarDate(event.dateTime)}`, `DTEND:${calendarDate(event.endTime)}`,
    `SUMMARY:${escapeText(event.title)}`,
    `DESCRIPTION:${escapeText(event.description || '')}`,
    `LOCATION:${escapeText([event.venueName, event.venueAddress].filter(Boolean).join(', '))}`,
    'END:VEVENT', 'END:VCALENDAR',
  ];
  return lines.map(line => {
    const folded: string[] = [];
    let current = '';
    let bytes = 0;
    for (const character of line) {
      const size = new TextEncoder().encode(character).length;
      if (bytes + size > 75) { folded.push(current); current = ' '; bytes = 1; }
      current += character; bytes += size;
    }
    folded.push(current);
    return folded.join('\r\n');
  }).join('\r\n') + '\r\n';
}
