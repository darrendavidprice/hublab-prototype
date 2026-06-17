import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../data/api';
import type { HubRecord } from '../data/types';
import { MonthCalendar } from '../components/MonthCalendar';
import { Facets } from '../components/Facets';
import { MailingListSignup } from '../components/MailingListSignup';
import { SUB_BRANDS } from '../data/vocabularies';
import { facetsFromParams, facetsToParams, facetsToQuery, facetCount, EMPTY_FACETS } from '../lib/facets';
import { formatDateShort, formatTime } from '../lib/format';
import { useDocumentTitle } from '../lib/useDocumentTitle';

const CAL_OPEN_KEY = 'hublab.calendarOpen';

/** "What's on" — the events calendar. Now filterable by the same tags as the
 *  directory (audience, age, subject, teacher — type is fixed to events), with
 *  filter state in the URL so a filtered view is shareable. The "Next up" list
 *  leads; the month grid sits behind an "Open calendar" disclosure so the most
 *  useful view is visible first (especially on mobile). */
export function Calendar() {
  useDocumentTitle("What's on");

  const [params, setParams] = useSearchParams();
  const facets = useMemo(() => facetsFromParams(params), [params]);
  const active = facetCount({ ...facets, text: '' }); // text isn't used here
  const commit = (next: typeof facets) => setParams(facetsToParams(next), { replace: true });

  // "Browse all our stuff" from an empty calendar carries the active filters into
  // the directory. The calendar never sets a type facet, so the directory link is
  // unrestricted by type — surfacing activities, videos, guides etc. (not just events)
  // for the same audience/age/subject the visitor was after.
  const findHref = useMemo(() => {
    const qs = facetsToParams(facets).toString();
    return qs ? `/find?${qs}` : '/find';
  }, [facets]);

  const [upcoming, setUpcoming] = useState<HubRecord[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Remember whether the month grid is open across the session.
  const [calOpen, setCalOpen] = useState<boolean>(() => {
    try { return sessionStorage.getItem(CAL_OPEN_KEY) === '1'; } catch { return false; }
  });
  const toggleCal = () => setCalOpen(o => {
    const next = !o;
    try { sessionStorage.setItem(CAL_OPEN_KEY, next ? '1' : '0'); } catch { /* ignore */ }
    return next;
  });

  // Month-grid loader: events in range, narrowed by the active facets.
  const loadRange = useCallback(
    (from: string, to: string) =>
      api.query({ ...facetsToQuery(facets), types: ['event'], publicOnly: true, eventsBetween: { from, to } }),
    [facets],
  );

  // "Next up": the next ~6 months of events, narrowed by the active facets.
  useEffect(() => {
    let live = true;
    setLoaded(false);
    const now = new Date();
    api.query({
      ...facetsToQuery(facets), types: ['event'], publicOnly: true,
      eventsBetween: { from: now.toISOString(), to: new Date(now.getTime() + 180 * 86400000).toISOString() },
    }).then(evts => {
      if (!live) return;
      setUpcoming(evts.sort((a, b) => new Date(a.event!.start).getTime() - new Date(b.event!.start).getTime()));
      setLoaded(true);
    });
    return () => { live = false; };
  }, [facets]);

  return (
    <section className="section section--paper">
      <div className="container">
        <div className="section__head">
          <span className="section__eyebrow">Out and about</span>
          <h1 className="section__title">What's on</h1>
          <p className="section__lead">
            Shows, taster sessions, drop-ins and showcases. Filter by who it's for, age or subject;
            booking (where it's needed) happens on the University's own pages — we'll send you straight there.
          </p>
        </div>

        <div className="find">
          <Facets value={facets} onChange={commit} showTypes={false} />

          <div>
            <div className="results__bar">
              <p className="results__count" aria-live="polite">
                {!loaded ? 'Loading…'
                  : upcoming.length === 0 ? 'Nothing coming up'
                  : `${upcoming.length} ${upcoming.length === 1 ? 'event' : 'events'} coming up`}
                {active > 0 && loaded && ' for your filters'}
              </p>
              {active > 0 && (
                <button type="button" className="linkbtn" onClick={() => commit(EMPTY_FACETS)}>Clear filters</button>
              )}
            </div>

            <h2 className="section__title" style={{ fontSize: 'var(--fs-600)', margin: 'var(--s-2) 0 var(--s-5)' }}>Next up</h2>
            {loaded && upcoming.length === 0 ? (
              <>
                <div className="empty">
                  <h3>Nothing in the diary right now</h3>
                  <p>{active > 0
                    ? "Try removing a filter — there may be more on other dates. In the meantime, there's plenty more to explore."
                    : "New events are added all the time. While you wait, there's lots more to dip into."}</p>
                  <div className="empty__actions">
                    <Link className="btn btn--primary" to={findHref}>
                      {active > 0 ? 'See other stuff for these filters' : 'Browse all our stuff'}
                    </Link>
                    {active > 0 && (
                      <button type="button" className="linkbtn" onClick={() => commit(EMPTY_FACETS)}>Clear filters</button>
                    )}
                  </div>
                </div>
                <div className="empty__signup">
                  <p className="empty__signup-lead">Or be first to know when something new is on:</p>
                  <MailingListSignup initialPrefs={facets.audiences} />
                </div>
              </>
            ) : (
              <div className="upcoming">
                {upcoming.map(e => {
                  const start = new Date(e.event!.start);
                  return (
                    <Link key={e.id} to={`/record/${e.id}`} className="upcoming__item" data-lab={e.audiences[0]}>
                      <span className="upcoming__date" aria-hidden="true">
                        <span className="d">{start.getDate()}</span>
                        <span className="m">{start.toLocaleString('en-GB', { month: 'short' })}</span>
                      </span>
                      <span className="upcoming__when">
                        <strong style={{ fontFamily: 'var(--font-display)' }}>{e.title}</strong>
                        <span style={{ display: 'block', color: '#5b5170', fontSize: 'var(--fs-300)' }}>
                          {formatDateShort(e.event!.start)} · {formatTime(e.event!.start)}
                          {e.event!.venue ? ` · ${e.event!.venue}` : ''}
                          {e.event!.isOnline ? ' · Online' : ''}
                        </span>
                      </span>
                      <span className="chip chip--lab" data-lab={e.audiences[0]} style={{ alignSelf: 'center' }}>
                        {SUB_BRANDS[e.audiences[0]].label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Month grid behind a disclosure — Next up leads */}
            <div style={{ marginTop: 'var(--s-7)' }}>
              <button
                type="button"
                className="disclosure"
                aria-expanded={calOpen}
                aria-controls="month-grid"
                onClick={toggleCal}
              >
                <span className="disclosure__chevron" aria-hidden="true">{calOpen ? '▾' : '▸'}</span>
                {calOpen ? 'Hide calendar' : 'Open calendar'}
                <span className="disclosure__hint">browse by date</span>
              </button>
              {calOpen && (
                <div id="month-grid" style={{ marginTop: 'var(--s-5)' }}>
                  <MonthCalendar loadRange={loadRange} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
