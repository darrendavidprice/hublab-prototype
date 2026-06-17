import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../data/api';
import type { HubRecord, SubBrand as SubBrandId, RecordType } from '../data/types';
import { SUB_BRANDS, RECORD_TYPES, RECORD_TYPE_ORDER } from '../data/vocabularies';
import { SubBrandHero } from '../components/SubBrandHero';
import { RecordCard } from '../components/RecordCard';
import { MailingListSignup } from '../components/MailingListSignup';
import { formatDateShort, formatTime } from '../lib/format';
import { useDocumentTitle } from '../lib/useDocumentTitle';

/** Plain-language, audience-first intro per lab. Kept here as page copy rather
 *  than in the controlled vocabulary (which is for tags, not prose). */
const INTRO: Record<SubBrandId, string> = {
  funlab:
    "Hands-on science for young children and the grown-ups who love them. Shows that go bang, things to make at the kitchen table, and a first look at how the world works — no lab coat required.",
  futurelab:
    "For ages 11 and up who want to see where science and engineering could take them. Get hands on with real tools, meet people doing the actual work, and try the future on for size.",
  lifelab:
    "Science doesn't stop when school does. For curious adults: talks, deep dives, and plain-English explainers on what Manchester's researchers are working on right now.",
};

/** Optional illustrated "taste of it" gallery per lab. Populated for FunLab for
 *  now; real event photography can be swapped in or added as a separate strip.
 *  Self-contained square brand illustrations, captions below (no text overlap). */
const GALLERY: Partial<Record<SubBrandId, { src: string; alt: string; cap: string }[]>> = {
  funlab: [
    { src: './brand/Volcano_HL.png', alt: 'Cartoon erupting volcano', cap: 'Make things erupt' },
    { src: './brand/Robot_HL.png', alt: 'Friendly cartoon robot', cap: 'Meet the robots' },
    { src: './brand/Paper_Plane_HL.png', alt: 'Paper plane with a dotted flight trail', cap: 'Build and fly things' },
    { src: './brand/Dinosaur_in_Egg_HL.png', alt: 'Cartoon dinosaur hatching from an egg', cap: 'Dig into dinosaurs' },
  ],
};

/** Real event photography strip ("real moments"), shown below the illustrated
 *  gallery. FunLab for now — these are FunLab-audience event shots. Photos sit
 *  in their own band with captions below (never behind live text). */
const PHOTO_STRIP: Partial<Record<SubBrandId, { src: string; alt: string; cap: string }[]>> = {
  funlab: [
    { src: './brand/photos/event-dinosaurs.jpg', alt: 'A HubLab team member kneels to chat with a young child at a stall, pointing past a tall banner of brightly coloured dinosaur and bird heads.', cap: 'Up close with prehistoric creatures' },
    { src: './brand/photos/event-simulator.jpg', alt: 'A grinning child sits strapped into a racing-style simulator seat holding the controls, with other children watching behind.', cap: 'Take the controls' },
    { src: './brand/photos/event-robot-dog.jpg', alt: 'A young child smiles with a HubLab team member as they watch a four-legged walking robot move across the floor.', cap: 'Walking, talking robots' },
    { src: './brand/photos/event-astrophysics.jpg', alt: 'A smiling University team member at a Centre for Astrophysics stall talks with visitors about building their own model telescope dish.', cap: 'Reach for the stars' },
  ],
};

export function SubBrand({ lab }: { lab: SubBrandId }) {
  const sb = SUB_BRANDS[lab];
  useDocumentTitle(sb.label);
  const [records, setRecords] = useState<HubRecord[]>([]);
  const [loaded, setLoaded] = useState(false);

  // One query for the whole page: every public record for this lab (overlap
  // match, so cross-category records tagged with other labs show up too).
  useEffect(() => {
    let live = true;
    setLoaded(false);
    api.query({ subBrand: lab, publicOnly: true }).then(r => {
      if (!live) return;
      setRecords(r);
      setLoaded(true);
    });
    return () => { live = false; };
  }, [lab]);

  const featured = useMemo(() => records.filter(r => r.featured), [records]);

  const upcoming = useMemo(() => {
    const now = Date.now();
    return records
      .filter(r => r.type === 'event' && r.event && new Date(r.event.start).getTime() >= now)
      .sort((a, b) => new Date(a.event!.start).getTime() - new Date(b.event!.start).getTime())
      .slice(0, 3);
  }, [records]);

  // Tally records by type for the "explore by type" entry points.
  const typeCounts = useMemo(() => {
    const counts = new Map<RecordType, number>();
    for (const r of records) counts.set(r.type, (counts.get(r.type) ?? 0) + 1);
    return RECORD_TYPE_ORDER
      .filter(t => counts.has(t))
      .map(t => ({ type: t, count: counts.get(t)! }));
  }, [records]);

  const crossCategory = useMemo(
    () => records.some(r => r.audiences.length > 1),
    [records],
  );

  return (
    <div data-lab={lab}>
      <SubBrandHero subBrand={lab} intro={INTRO[lab]} />

      {/* A taste of it — illustrated gallery (overlap-safe: caption sits below) */}
      {GALLERY[lab] && (
        <section className="section section--paper">
          <div className="container">
            <div className="section__head">
              <span className="section__eyebrow">A taste of it</span>
              <h2 className="section__title">Things you might get up to</h2>
            </div>
            <ul className="gallerystrip">
              {GALLERY[lab]!.map(g => (
                <li key={g.src} className="gallerystrip__item">
                  <img src={g.src} alt={g.alt} loading="lazy" width={320} height={320} />
                  <span className="gallerystrip__cap">{g.cap}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Real moments — event photography strip (overlap-safe: caption below) */}
      {PHOTO_STRIP[lab] && (
        <section className="section section--tint">
          <div className="container">
            <div className="section__head">
              <span className="section__eyebrow">Real moments</span>
              <h2 className="section__title">From our events</h2>
              <p className="section__lead">
                A few snapshots from recent {sb.label} days out — hands-on, noisy and a lot of fun.
              </p>
            </div>
            <ul className="gallerystrip gallerystrip--photos">
              {PHOTO_STRIP[lab]!.map(g => (
                <li key={g.src} className="gallerystrip__item">
                  <img src={g.src} alt={g.alt} loading="lazy" width={800} height={600} />
                  <span className="gallerystrip__cap">{g.cap}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Featured */}
      {featured.length > 0 && (
        <section className="section section--paper">
          <div className="container">
            <div className="section__head">
              <span className="section__eyebrow">Start here</span>
              <h2 className="section__title">Featured in {sb.label}</h2>
            </div>
            <div className="grid grid--featured">
              {featured.map(r => <RecordCard key={r.id} record={r} featured />)}
            </div>
          </div>
        </section>
      )}

      {/* Coming up */}
      {upcoming.length > 0 && (
        <section className="section section--tint">
          <div className="container">
            <div className="section__headrow">
              <div>
                <span className="section__eyebrow">Mark your calendar</span>
                <h2 className="section__title">Coming up</h2>
              </div>
              <Link to="/calendar" className="btn btn--primary">Full calendar</Link>
            </div>
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
                      </span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Explore by type — deep links into the filtered directory */}
      {typeCounts.length > 0 && (
        <section className="section section--paper">
          <div className="container">
            <div className="section__head">
              <span className="section__eyebrow">Browse by kind</span>
              <h2 className="section__title">What you'll find</h2>
            </div>
            <div className="typegrid">
              {typeCounts.map(({ type, count }) => (
                <Link key={type} to={`/find?aud=${lab}&type=${type}`} className="typecard">
                  <span className="typecard__label">{RECORD_TYPES[type].label}</span>
                  <span className="typecard__count">{count}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Everything in this lab */}
      <section className="section section--tint">
        <div className="container">
          <div className="section__headrow">
            <div>
              <span className="section__eyebrow">The full set</span>
              <h2 className="section__title">Everything in {sb.label}</h2>
            </div>
            <Link to={`/find?aud=${lab}`} className="btn btn--ghost" style={{ borderColor: 'var(--c-line)', color: 'var(--c-ink)' }}>
              Open in the directory
            </Link>
          </div>

          {crossCategory && (
            <p className="notice" style={{ marginBottom: 'var(--s-5)' }}>
              Spot another lab's badge on a card? Some things suit more than one audience, so
              they live in each lab — that's the point of one shared home.
            </p>
          )}

          {!loaded ? (
            <p>Loading…</p>
          ) : records.length === 0 ? (
            <div className="empty">
              <h3>Nothing here just yet</h3>
              <p>New {sb.label} content is on the way. In the meantime, the other labs have
                plenty to explore.</p>
              <Link to="/find" className="btn btn--primary">Browse everything</Link>
            </div>
          ) : (
            <div className="grid">
              {records.map(r => <RecordCard key={r.id} record={r} />)}
            </div>
          )}
        </div>
      </section>

      {/* Mailing list, pre-tuned to this lab */}
      <section className="section section--paper">
        <div className="container">
          <MailingListSignup initialPrefs={[lab]} />
        </div>
      </section>
    </div>
  );
}
