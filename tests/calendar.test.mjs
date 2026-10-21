import assert from 'node:assert/strict';
import test from 'node:test';
import { buildCalendarEvent } from '../src/lib/calendar.ts';

test('calendar export escapes event text and prevents extra ICS properties', () => {
  const result = buildCalendarEvent({
    eventId: 'test-event',
    title: 'Tea, talk; together\r\nBEGIN:VEVENT',
    description: 'One\\two\nThree',
    dateTime: '2027-01-10T10:00:00Z',
    endTime: '2027-01-10T11:00:00Z',
  }, new Date('2027-01-01T00:00:00Z'));
  assert.equal(result.match(/(?:^|\r\n)BEGIN:VEVENT/g)?.length, 1);
  assert.match(result, /SUMMARY:Tea\\, talk\\; together\\nBEGIN:VEVENT/);
  assert.match(result, /DESCRIPTION:One\\\\two\\nThree/);
  assert.match(result, /DTSTART:20270110T100000Z/);
});

test('calendar export folds at 75 UTF-8 bytes without splitting characters', () => {
  const result = buildCalendarEvent({
    title: '你好'.repeat(80), description: 'A'.repeat(200),
    dateTime: '2027-01-10T10:00:00Z', endTime: '2027-01-10T11:00:00Z',
  });
  for (const line of result.split('\r\n')) assert(Buffer.byteLength(line) <= 75);
  assert(!result.includes('\uFFFD'));
  assert(result.replace(/\r\n /g, '').includes('SUMMARY:' + '你好'.repeat(80)));
});
