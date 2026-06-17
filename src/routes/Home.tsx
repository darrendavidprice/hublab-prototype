import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../data/api';
import type { HubRecord } from '../data/types';
import { SUB_BRAND_ORDER, SUB_BRANDS } from '../data/vocabularies';
import { VideoHero } from '../components/VideoHero';
import { RecordCard } from '../components/RecordCard';
import { MailingListSignup } from '../components/MailingListSignup';
import { formatDateShort, formatTime } from '../lib/format';
import { useDocumentTitle } from '../lib/useDocumentTitle';

export function Home() {
  useDocumentTitle('');
  const [featured, setFeatured] = useState<HubRecord[]>([]);
  const [upcoming, setUpcoming] = useState<HubRecord[]>([]);

  useEffect(() => {
    api.query({ featuredOnly: true, publicOnly: true }).then(setFeatured);
    const now = new Date();
    api.query({
      types: ['event'], publicOnly: true,
      eventsBetween: { from: now.toISOString(), to: new Date(now.getTime() + 120 * 86400000).toISOString() },
    }).then(evts =>
      setUpcoming(evts.sort((a, b) =>
        new Date(a.event!.start).getTime() - new Date(b.event!.start).getTime()).slice(0, 3)),
    );
  }, []);

  return (
    <>
      <VideoHero videoSrc="./brand/hero-hublab.mp4" posterSrc="./brand/hero-hublab-poster.jpg">
        <p className="hero__eyebrow">Bringing science and engineering to life</p>
        <h1 className="hero__title">See where curiosity takes you.</h1>
        <p className="hero__lead">
          Events, activities to try at home, videos, and the chance to meet the people who
          do science for a living. No jargon, no gatekeeping — just things to do.
        </p>
        <div className="hero__actions">
          <Link to="/find" className="btn btn--primary btn--lg" style={{ background: '#fff', color: 'var(--c-hublab)' }}>
            Find stuff to do
          </Link>
          <Link to="/calendar" className="btn btn--ghost btn--lg">See what's on</Link>
        </div>
      </VideoHero>

      {/* Featured pieces */}
      {featured.length > 0 && (
        <section className="section section--paper">
          <div className="container">
            <div className="section__head">
              <span className="section__eyebrow">Worth your time</span>
              <h2 className="section__title">Featured right now</h2>
            </div>
            <div className="grid grid--featured">
              {featured.map(r => <RecordCard key={r.id} record={r} featured />)}
            </div>
          </div>
        </section>
      )}

      {/* Explore by audience */}
      <section className="section section--tint">
        <div className="container">
          <div className="section__head">
            <span className="section__eyebrow">Pick your corner</span>
            <h2 className="section__title">Three labs, one home</h2>
            <p className="section__lead">
              Everything lives here together, but each lab is tuned to who it's for. Start
              wherever fits — plenty of things show up in more than one.
            </p>
          </div>
          <div className="audience-trio">
            {SUB_BRAND_ORDER.map(id => {
              const sb = SUB_BRANDS[id];
              const motif: Record<string, string> = {
                funlab: './brand/Volcano_HL.png',
                futurelab: './brand/Robot_HL.png',
                lifelab: './brand/Scientific_Microscope_HL.png',
              };
              return (
                <Link key={id} to={`/${id}`} className="labtile" data-lab={id}>
                  <img className="labtile__logo" src={`./brand/labs/${id}-ink.png`} alt={sb.label} width={300} height={150} />
                  <span className="labtile__aud">{sb.audience}</span>
                  <span className="labtile__tagline">{sb.tagline}</span>
                  <span className="labtile__cta">Explore {sb.label} →</span>
                  <span className="labtile__motif" aria-hidden="true">
                    <img src={motif[id]} alt="" loading="lazy" width={96} height={96} />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Get to know us — image + text band (real event photo, overlap-safe) */}
      <section className="section section--paper">
        <div className="container">
          <div className="mediaband">
            <div className="mediaband__media">
              <img
                src="./brand/photos/event-robot-dog.jpg"
                alt="A young child grins as a HubLab team member kneels beside them to watch a four-legged walking robot at a family event."
                loading="lazy"
                width={800}
                height={533}
              />
            </div>
            <div className="mediaband__text">
              <span className="section__eyebrow">Get to know us</span>
              <h2 className="section__title">You don't need a white coat</h2>
              <p className="section__lead">
                Science and engineering are for everyone — not just people in lab coats. We bring
                real research out of the labs and into shopping centres, classrooms and living
                rooms, so anyone can have a go, ask questions and meet the people behind the work.
              </p>
              <p>
                <Link to="/about" className="btn btn--primary">More about HubLab</Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What's on teaser */}
      {upcoming.length > 0 && (
        <section className="section section--paper">
          <div className="container">
            <div className="section__head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 'var(--s-4)' }}>
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
                    <span className="chip chip--lab" data-lab={e.audiences[0]} style={{ alignSelf: 'center' }}>
                      {SUB_BRANDS[e.audiences[0]].label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Mailing list */}
      <section className="section section--tint">
        <div className="container">
          <MailingListSignup />
        </div>
      </section>
    </>
  );
}
