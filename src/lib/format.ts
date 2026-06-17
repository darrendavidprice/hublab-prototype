/* Shared, presentation-only formatting helpers. No data-layer concerns live
   here — these just turn ISO strings and numbers into plain, friendly text.
   Locale fixed to en-GB to match the University audience. */

const DT = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('en-GB', opts);

const fDate = DT({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const fDateShort = DT({ day: 'numeric', month: 'short', year: 'numeric' });
const fTime = DT({ hour: 'numeric', minute: '2-digit', hour12: true });
const fMonthYear = DT({ month: 'long', year: 'numeric' });

export const formatDate = (iso: string) => fDate.format(new Date(iso));
export const formatDateShort = (iso: string) => fDateShort.format(new Date(iso));
export const formatTime = (iso: string) => fTime.format(new Date(iso)).replace(':00', '');
export const formatMonthYear = (d: Date) => fMonthYear.format(d);

/** "Saturday 21 June, 2–3:30pm" style line for an event. */
export function formatEventWhen(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const sameDay = start.toDateString() === end.toDateString();
  const date = fDate.format(start);
  if (sameDay) return `${date}, ${formatTime(startIso)}–${formatTime(endIso)}`;
  return `${formatDateShort(startIso)} – ${formatDateShort(endIso)}`;
}

/** Compact counts: 1,204 → "1.2k". Keeps small numbers exact. */
export function compact(n: number): string {
  if (n < 1000) return String(n);
  return new Intl.NumberFormat('en-GB', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
}
