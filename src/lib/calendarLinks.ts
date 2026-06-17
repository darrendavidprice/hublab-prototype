import type { HubRecord } from '../data/types';

/** "Add to calendar" deep links (D1). The existing `.ics` download
 *  (`lib/ics.ts`) stays the universal fallback; these are convenience links for
 *  people who live in Google Calendar or Outlook/Office 365 and would rather add
 *  an event in one click than download a file.
 *
 *  Notes:
 *  - All times are emitted in UTC. Google wants compact basic-format UTC
 *    (YYYYMMDDTHHMMSSZ); Outlook wants ISO-8601 (the `toISOString()` form).
 *  - Everything user-supplied is URL-encoded.
 *  - An optional absolute record URL is appended to the description so the saved
 *    event links back to the full details. We don't have the public origin at
 *    build time (HashRouter on Pages), so callers pass the current absolute URL. */

/** Google's compact UTC stamp: 2025-06-21T14:00:00.000Z -> 20250621T140000Z */
function gcalStamp(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function descriptionWith(summary: string, recordUrl?: string): string {
  return recordUrl ? `${summary}\n\n${recordUrl}` : summary;
}

/** Google Calendar "template" link that pre-fills a new event. */
export function googleCalendarUrl(r: HubRecord, recordUrl?: string): string {
  if (!r.event) throw new Error('Not an event');
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: r.title,
    dates: `${gcalStamp(r.event.start)}/${gcalStamp(r.event.end)}`,
    details: descriptionWith(r.summary, recordUrl),
  });
  if (r.event.venue) params.set('location', r.event.isOnline ? `Online — ${r.event.venue}` : r.event.venue);
  else if (r.event.isOnline) params.set('location', 'Online');
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** Outlook / Office 365 "compose event" deep link (office.com works for both
 *  personal Outlook.com and Microsoft 365 work accounts). */
export function outlookCalendarUrl(r: HubRecord, recordUrl?: string): string {
  if (!r.event) throw new Error('Not an event');
  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: r.title,
    startdt: new Date(r.event.start).toISOString(),
    enddt: new Date(r.event.end).toISOString(),
    body: descriptionWith(r.summary, recordUrl),
  });
  if (r.event.venue) params.set('location', r.event.isOnline ? `Online — ${r.event.venue}` : r.event.venue);
  else if (r.event.isOnline) params.set('location', 'Online');
  return `https://outlook.office.com/calendar/0/deeplink/compose?${params.toString()}`;
}
