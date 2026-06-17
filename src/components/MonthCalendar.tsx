import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { HubRecord } from '../data/types';
import { formatMonthYear, formatTime } from '../lib/format';

const WEEKDAYS = [
  ['Mon', 'Monday'], ['Tue', 'Tuesday'], ['Wed', 'Wednesday'], ['Thu', 'Thursday'],
  ['Fri', 'Friday'], ['Sat', 'Saturday'], ['Sun', 'Sunday'],
] as const;

const firstOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
/** Monday-based weekday index (0 = Monday … 6 = Sunday). */
const mondayIndex = (d: Date) => (d.getDay() + 6) % 7;
const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

interface MonthCalendarProps {
  /** Fetches events whose start falls in [fromIso, toIso]. Wired to the data
   *  layer's eventsBetween query by the parent route. */
  loadRange: (fromIso: string, toIso: string) => Promise<HubRecord[]>;
}

/** A month-at-a-glance calendar of events. Rendered as a real table so screen
 *  readers can navigate it by row/column; the visible month is announced via a
 *  polite live region when it changes. */
export function MonthCalendar({ loadRange }: MonthCalendarProps) {
  const today = useMemo(() => new Date(), []);
  const [view, setView] = useState(() => firstOfMonth(new Date()));
  const [events, setEvents] = useState<HubRecord[]>([]);

  useEffect(() => {
    const from = firstOfMonth(view);
    const to = new Date(view.getFullYear(), view.getMonth() + 1, 0, 23, 59, 59);
    let live = true;
    loadRange(from.toISOString(), to.toISOString()).then(e => { if (live) setEvents(e); });
    return () => { live = false; };
  }, [view, loadRange]);

  // Group this month's events by day-of-month for quick cell lookup.
  const byDay = useMemo(() => {
    const map = new Map<number, HubRecord[]>();
    for (const e of events) {
      if (!e.event) continue;
      const d = new Date(e.event.start).getDate();
      (map.get(d) ?? map.set(d, []).get(d)!).push(e);
    }
    return map;
  }, [events]);

  const daysInMonth = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
  const lead = mondayIndex(firstOfMonth(view));
  const cells: (number | null)[] = [
    ...Array(lead).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const step = (delta: number) =>
    setView(v => new Date(v.getFullYear(), v.getMonth() + delta, 1));
  const monthLabel = formatMonthYear(view);

  return (
    <div>
      <div className="cal__head">
        <div className="cal__nav">
          <button type="button" className="cal__btn" onClick={() => step(-1)} aria-label="Previous month">‹</button>
          <p className="cal__monthlabel" aria-live="polite">{monthLabel}</p>
          <button type="button" className="cal__btn" onClick={() => step(1)} aria-label="Next month">›</button>
        </div>
        <button type="button" className="btn btn--ghost" style={{ borderColor: 'var(--c-line)', color: 'var(--c-ink)' }} onClick={() => setView(firstOfMonth(new Date()))}>
          Today
        </button>
      </div>

      <table className="cal__table">
        <caption className="sr-only">Events in {monthLabel}. Days with events show links to each event.</caption>
        <thead>
          <tr>
            {WEEKDAYS.map(([short, full]) => (
              <th key={short} scope="col"><abbr title={full}>{short}</abbr></th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, wi) => (
            <tr key={wi}>
              {week.map((day, di) => {
                if (day === null) return <td key={di} className="cal__cell cal__cell--blank" aria-hidden="true" />;
                const date = new Date(view.getFullYear(), view.getMonth(), day);
                const isToday = sameDay(date, today);
                const dayEvents = byDay.get(day) ?? [];
                return (
                  <td key={di} className={`cal__cell${isToday ? ' cal__cell--today' : ''}`}>
                    <span className="cal__daynum">{day}{isToday && <span className="sr-only"> (today)</span>}</span>
                    {dayEvents.map(e => (
                      <Link
                        key={e.id}
                        to={`/record/${e.id}`}
                        className="cal__event"
                        data-lab={e.audiences[0] ?? 'hublab'}
                        title={`${e.title} — ${e.event ? formatTime(e.event.start) : ''}`}
                      >
                        {e.event && <span className="sr-only">{formatTime(e.event.start)}, </span>}
                        {e.title}
                      </Link>
                    ))}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
