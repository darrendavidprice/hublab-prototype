import type { HubRecord } from '../data/types';

/** Build a minimal, valid iCalendar (.ics) string for an event record so a
 *  visitor can add it to their own calendar app. Generated on the client — no
 *  server needed — and triggered as a download. */
export function eventToIcs(r: HubRecord): string {
  if (!r.event) throw new Error('Not an event');
  const stamp = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const esc = (s: string) => s.replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n');
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//HubLab//Prototype//EN',
    'BEGIN:VEVENT',
    `UID:${r.id}@hublab.manchester.ac.uk`,
    `DTSTAMP:${stamp(new Date().toISOString())}`,
    `DTSTART:${stamp(r.event.start)}`,
    `DTEND:${stamp(r.event.end)}`,
    `SUMMARY:${esc(r.title)}`,
    `DESCRIPTION:${esc(r.summary)}`,
    r.event.venue ? `LOCATION:${esc(r.event.venue)}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean);
  return lines.join('\r\n');
}

/** Trigger a download of a text blob (e.g. an .ics file) in the browser. */
export function downloadText(filename: string, text: string, mime = 'text/calendar') {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
