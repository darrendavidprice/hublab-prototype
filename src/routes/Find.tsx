import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../data/api';
import type { HubRecord } from '../data/types';
import { Facets } from '../components/Facets';
import { RecordCard } from '../components/RecordCard';
import {
  facetsFromParams, facetsToParams, facetsToQuery, facetCount, EMPTY_FACETS,
} from '../lib/facets';
import { useDocumentTitle } from '../lib/useDocumentTitle';

/** The faceted directory: every public record, filterable by who it's for,
 *  age, subject, type, a teacher flag and free text. Filter state lives in the
 *  URL (useSearchParams) so a filtered view can be bookmarked or shared. */
export function Find() {
  useDocumentTitle('Find stuff to do');

  const [params, setParams] = useSearchParams();
  const facets = useMemo(() => facetsFromParams(params), [params]);
  const [results, setResults] = useState<HubRecord[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Local mirror of the text box so typing is smooth; committed to the URL.
  const [text, setText] = useState(facets.text);
  useEffect(() => { setText(facets.text); }, [facets.text]);

  // Re-query whenever the facet state (i.e. the URL) changes.
  useEffect(() => {
    let live = true;
    api.query(facetsToQuery(facets)).then(r => {
      if (!live) return;
      setResults(r);
      setLoaded(true);
    });
    return () => { live = false; };
  }, [facets]);

  const commit = (next: typeof facets) => {
    const p = facetsToParams(next);
    setParams(p, { replace: true });
  };

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    commit({ ...facets, text });
  };

  const active = facetCount(facets);
  const headingRef = useRef<HTMLParagraphElement>(null);

  return (
    <section className="section section--tint">
      <div className="container">
        <div className="section__head">
          <span className="section__eyebrow">The whole collection</span>
          <h1 className="section__title">Find stuff to do</h1>
          <p className="section__lead">
            Browse everything in one place. Narrow it down by who it's for, age, subject or
            type — or search for something specific.
          </p>
        </div>

        <div className="find">
          <Facets value={facets} onChange={commit} />

          <div>
            <form className="search-field" role="search" onSubmit={submitSearch} style={{ marginBottom: 'var(--s-5)' }}>
              <label htmlFor="dir-search" className="sr-only">Search activities, events and more</label>
              <input
                id="dir-search"
                type="search"
                placeholder="Search — e.g. volcano, robots, space"
                value={text}
                onChange={e => setText(e.target.value)}
              />
              <button type="submit" className="btn btn--primary">Search</button>
            </form>

            <div className="results__bar">
              <p className="results__count" ref={headingRef} aria-live="polite">
                {!loaded ? 'Loading…'
                  : results.length === 0 ? 'Nothing found'
                  : `${results.length} ${results.length === 1 ? 'result' : 'results'}`}
                {active > 0 && loaded && ` for your filters`}
              </p>
              {active > 0 && (
                <button type="button" className="linkbtn" onClick={() => { setText(''); commit(EMPTY_FACETS); }}>
                  Clear everything
                </button>
              )}
            </div>

            {loaded && results.length === 0 ? (
              <div className="empty">
                <h3>No matches yet</h3>
                <p>Try removing a filter or searching for something broader. Everything here is
                  tagged by hand, so a wider net usually turns something up.</p>
                <button type="button" className="btn btn--primary" onClick={() => { setText(''); commit(EMPTY_FACETS); }}>
                  Start over
                </button>
              </div>
            ) : (
              <div className="grid">
                {results.map(r => <RecordCard key={r.id} record={r} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
