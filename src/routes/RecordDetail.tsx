import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, isPublic, daysToExpiry } from '../data/api';
import type { HubRecord } from '../data/types';
import {
  RECORD_TYPES, SUB_BRANDS, ageLabel, subjectLabel,
} from '../data/vocabularies';
import { RecordCard } from '../components/RecordCard';
import { EngagementBar } from '../components/EngagementBar';
import { VideoEmbed } from '../components/VideoEmbed';
import { isEmbeddableVideo } from '../lib/video';
import { formatEventWhen, formatDate } from '../lib/format';
import { eventToIcs, downloadText } from '../lib/ics';
import { googleCalendarUrl, outlookCalendarUrl } from '../lib/calendarLinks';
import { findLink } from '../lib/facets';
import { useDocumentTitle } from '../lib/useDocumentTitle';

/** Records whose view has already been counted this session, so a page-load
 *  (or React StrictMode's double effect in dev) counts at most once. */
const viewed = new Set<string>();

/** An external "go do the thing" button, clearly marked as leaving the site. */
function OutLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a className="btn btn--primary btn--lg relative-link" href={href} target="_blank" rel="noopener noreferrer">
      {children} <span aria-hidden="true">↗</span>
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

/** Add-to-calendar options for an event (D1). The .ics download is the
 *  universal fallback; Google and Outlook are one-click convenience links for
 *  people who live in those calendars. Grouped in a fieldset so the relationship
 *  is clear to assistive tech. The record's own URL is passed through so the
 *  saved calendar entry links back to the full details. */
function AddToCalendar({ record }: { record: HubRecord }) {
  const recordUrl = typeof window !== 'undefined' ? window.location.href : undefined;
  return (
    <fieldset className="cal-add">
      <legend className="cal-add__legend">Add to your calendar</legend>
      <div className="cluster">
        <button
          type="button"
          className="btn btn--ghost relative-link"
          style={{ borderColor: 'var(--c-line)', color: 'var(--c-ink)' }}
          onClick={() => downloadText(`${record.id}.ics`, eventToIcs(record))}
        >
          Download (.ics)
        </button>
        <a
          className="btn btn--ghost relative-link"
          style={{ borderColor: 'var(--c-line)', color: 'var(--c-ink)' }}
          href={googleCalendarUrl(record, recordUrl)}
          target="_blank"
          rel="noopener noreferrer"
        >
          Google Calendar <span aria-hidden="true">↗</span>
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
        <a
          className="btn btn--ghost relative-link"
          style={{ borderColor: 'var(--c-line)', color: 'var(--c-ink)' }}
          href={outlookCalendarUrl(record, recordUrl)}
          target="_blank"
          rel="noopener noreferrer"
        >
          Outlook <span aria-hidden="true">↗</span>
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      </div>
    </fieldset>
  );
}

export function RecordDetail() {
  const { id } = useParams();
  const [record, setRecord] = useState<HubRecord | null | undefined>(undefined); // undefined = loading
  const countedRef = useRef(false);
  useDocumentTitle(record ? record.title : '');

  useEffect(() => {
    if (!id) return;
    let live = true;
    api.get(id).then(r => { if (live) setRecord(r ?? null); });
    return () => { live = false; };
  }, [id]);

  // Count one view once the record is known to be public.
  useEffect(() => {
    if (!record || countedRef.current) return;
    if (!isPublic(record) || viewed.has(record.id)) return;
    countedRef.current = true;
    viewed.add(record.id);
    api.update(record.id, { engagement: { ...record.engagement, views: record.engagement.views + 1 } })
      .then(setRecord);
  }, [record]);

  if (record === undefined) {
    return <section className="section section--paper"><div className="container"><p>Loading…</p></div></section>;
  }

  // Not found, or not currently public (expired / unpublished / scheduled).
  if (!record || !isPublic(record)) {
    return (
      <section className="section section--paper">
        <div className="container">
          <div className="empty" style={{ maxWidth: 640, margin: '0 auto' }}>
            <h1 style={{ fontSize: 'var(--fs-700)' }}>This isn't available</h1>
            <p>It may have finished, been taken down, or not be live just yet. Plenty more to
              explore in the meantime.</p>
            <Link to="/find" className="btn btn--primary">Find something else</Link>
          </div>
        </div>
      </section>
    );
  }

  const type = RECORD_TYPES[record.type];
  const lab = record.audiences[0] ?? 'hublab';
  const dte = daysToExpiry(record);

  return (
    <article data-lab={lab}>
      {/* Shared header */}
      <header className="detail__hero">
        <div className="container detail__hero-inner">
          <div>
            <p className="detail__crumb">
              <Link to="/">Home</Link> › <Link to="/find">Find stuff</Link> › {type.noun}
            </p>
            <div className="detail__chips">
              <Link className="chip chip--type chip--link" to={findLink({ types: [record.type] })}>{type.label}</Link>
              {record.audiences.map(a => (
                <Link key={a} className="chip chip--lab chip--link" data-lab={a} to={findLink({ audiences: [a] })}>{SUB_BRANDS[a].label}</Link>
              ))}
              {record.usefulForTeachers && <Link className="chip chip--teacher chip--link" to={findLink({ usefulForTeachers: true })}>For teachers</Link>}
            </div>
            <h1 className="detail__title">{record.title}</h1>
            <p className="hero__lead">{record.summary}</p>
          </div>
          {record.promoImage && (
            <div className="detail__heroimg">
              <img src={record.promoImage} alt={record.promoImageAlt ?? ''} />
            </div>
          )}
        </div>
      </header>

      {/* Body: type-specific main + factbox sidebar */}
      <div className="section section--paper">
        <div className="container detail__body">
          <div>
            <TypeBody record={record} onChange={setRecord} />

            <div style={{ marginTop: 'var(--s-7)' }}>
              <EngagementBar record={record} onChange={setRecord} />
            </div>
          </div>

          <aside>
            <FactBox record={record} />
          </aside>
        </div>
      </div>

      <RelatedStrip record={record} />

      {dte >= 0 && dte <= 14 && (
        <div className="container" style={{ paddingBottom: 'var(--s-7)' }}>
          <p className="notice">Heads up: this one is only available until {formatDate(record.expiryDate)}.</p>
        </div>
      )}
    </article>
  );
}

/* ---------- Per-type main content ----------
   Each content type renders its own body + primary action, per the locked
   "every type gets its own detail layout" decision. */
function TypeBody({ record, onChange }: { record: HubRecord; onChange: (r: HubRecord) => void }) {
  const downloadCount = async () => {
    const updated = await api.update(record.id, {
      engagement: { ...record.engagement, downloads: record.engagement.downloads + 1 },
    });
    onChange(updated);
  };

  switch (record.type) {
    case 'event': {
      const ev = record.event!;
      return (
        <div className="prose">
          {record.body && <p>{record.body}</p>}
          <p style={{ fontWeight: 700 }}>{formatEventWhen(ev.start, ev.end)}{ev.venue ? ` · ${ev.venue}` : ''}{ev.isOnline ? ' · Online' : ''}</p>
          <div className="cluster" style={{ marginTop: 'var(--s-5)' }}>
            {ev.bookingUrl
              ? <OutLink href={ev.bookingUrl}>Book your place</OutLink>
              : <p className="notice" style={{ margin: 0 }}>{ev.capacityNote ?? 'Just turn up — no booking needed.'}</p>}
          </div>
          {ev.bookingUrl && ev.capacityNote && <p style={{ marginTop: 'var(--s-4)', color: '#5b5170' }}>{ev.capacityNote}</p>}
          <AddToCalendar record={record} />
        </div>
      );
    }

    case 'video':
      return (
        <div className="prose">
          {record.body && <p>{record.body}</p>}
          <p>{record.resource?.durationNote ?? 'Short watch.'}</p>
          <VideoEmbed
            url={record.resource?.externalUrl}
            title={record.title}
            fallback={record.resource?.externalUrl
              ? <div style={{ marginTop: 'var(--s-5)' }}><OutLink href={record.resource.externalUrl}>Watch the video</OutLink></div>
              : null}
          />
        </div>
      );

    case 'downloadable':
    case 'teaching_guide':
      return (
        <div className="prose">
          {record.body && <p>{record.body}</p>}
          {record.resource?.externalUrl && !record.resource.fileUrl && (
            <div style={{ marginTop: 'var(--s-5)' }}><OutLink href={record.resource.externalUrl}>Open the resource</OutLink></div>
          )}
          {record.resource?.fileUrl && (
            <div style={{ marginTop: 'var(--s-5)' }}>
              <a className="btn btn--primary btn--lg relative-link" href={record.resource.fileUrl}
                onClick={downloadCount} download={record.resource.fileName ?? ''}>
                {record.type === 'teaching_guide' ? 'Download the guide' : 'Download the activity'}
                {record.resource.fileLabel ? ` (${record.resource.fileLabel})` : ''}
              </a>
            </div>
          )}
        </div>
      );

    case 'research_explainer': {
      const rs = record.research!;
      return (
        <div className="prose">
          <p style={{ fontSize: 'var(--fs-600)', fontFamily: 'var(--font-display)' }}>{rs.plainSummary}</p>
          {record.body && <p>{record.body}</p>}
          {rs.paperUrl && (
            <div style={{ marginTop: 'var(--s-5)' }}>
              <OutLink href={rs.paperUrl}>Read the research paper</OutLink>
            </div>
          )}
        </div>
      );
    }

    case 'activity':
      return (
        <div className="prose">
          {record.body ? record.body.split('\n\n').map((p, i) => <p key={i}>{p}</p>) : <p>{record.summary}</p>}
          {record.resource?.externalUrl && (
            isEmbeddableVideo(record.resource.externalUrl)
              ? <VideoEmbed url={record.resource.externalUrl} title={record.title} />
              : <div style={{ marginTop: 'var(--s-5)' }}><OutLink href={record.resource.externalUrl}>Get started</OutLink></div>
          )}
        </div>
      );

    case 'schools_resource':
      // Schools resources are hosted and shown like any other resource: the
      // submitted content always appears. (We no longer replace the record with
      // a "we point you elsewhere" signpost.) Surface whatever the record carries
      // — body, a downloadable file, and/or an out-link — same as a downloadable.
      return (
        <div className="prose">
          {record.body
            ? record.body.split('\n\n').map((p, i) => <p key={i}>{p}</p>)
            : <p>{record.summary}</p>}
          {record.resource?.fileUrl && (
            <div style={{ marginTop: 'var(--s-5)' }}>
              <a className="btn btn--primary btn--lg relative-link" href={record.resource.fileUrl}
                onClick={downloadCount} download={record.resource.fileName ?? ''}>
                Download the resource{record.resource.fileLabel ? ` (${record.resource.fileLabel})` : ''}
              </a>
            </div>
          )}
          {record.resource?.externalUrl && (
            <div style={{ marginTop: 'var(--s-5)' }}><OutLink href={record.resource.externalUrl}>Open the resource</OutLink></div>
          )}
        </div>
      );

    case 'work_experience':
    case 'tutoring':
    case 'book':
    case 'external_link':
    default: {
      const cta = record.type === 'work_experience' ? 'How to apply'
        : record.type === 'tutoring' ? 'Find out more'
        : record.type === 'book' ? 'See the book'
        : 'Take a look';
      return (
        <div className="prose">
          {record.body && <p>{record.body}</p>}
          {record.resource?.externalUrl && (
            isEmbeddableVideo(record.resource.externalUrl)
              ? <VideoEmbed url={record.resource.externalUrl} title={record.title} />
              : <div style={{ marginTop: 'var(--s-5)' }}><OutLink href={record.resource.externalUrl}>{cta}</OutLink></div>
          )}
        </div>
      );
    }
  }
}

/* ---------- Sidebar facts ---------- */
function FactBox({ record }: { record: HubRecord }) {
  const ev = record.event;
  return (
    <div className="factbox">
      <h2>The details</h2>
      <dl>
        {ev && (
          <>
            <div className="factrow"><dt>When</dt><dd>{formatEventWhen(ev.start, ev.end)}</dd></div>
            <div className="factrow"><dt>Where</dt><dd>{ev.isOnline ? 'Online' : (ev.venue ?? 'To be confirmed')}</dd></div>
            {ev.capacityNote && <div className="factrow"><dt>Booking</dt><dd>{ev.capacityNote}</dd></div>}
          </>
        )}
        {record.resource?.durationNote && (
          <div className="factrow"><dt>Time needed</dt><dd>{record.resource.durationNote}</dd></div>
        )}
        {record.research?.researchers && (
          <div className="factrow"><dt>Researchers</dt><dd>{record.research.researchers}</dd></div>
        )}
        {record.research?.department && (
          <div className="factrow"><dt>Department</dt><dd>{record.research.department}</dd></div>
        )}
        <div className="factrow"><dt>Ages</dt><dd className="factrow__tags">{record.ageGroups.map(id => (
          <Link key={id} className="taglink" to={findLink({ ageGroups: [id] })}>{ageLabel(id)}</Link>
        ))}</dd></div>
        <div className="factrow"><dt>Subjects</dt><dd className="factrow__tags">{record.subjects.map(id => (
          <Link key={id} className="taglink" to={findLink({ subjects: [id] })}>{subjectLabel(id)}</Link>
        ))}</dd></div>
      </dl>
    </div>
  );
}

/* ---------- Related ("more like this") ---------- */
function RelatedStrip({ record }: { record: HubRecord }) {
  const [related, setRelated] = useState<HubRecord[]>([]);
  useEffect(() => {
    api.query({ audiences: record.audiences, publicOnly: true }).then(rs =>
      setRelated(rs.filter(r => r.id !== record.id).slice(0, 3)));
  }, [record]);

  if (related.length === 0) return null;
  return (
    <section className="section section--tint">
      <div className="container">
        <div className="section__head">
          <span className="section__eyebrow">Keep going</span>
          <h2 className="section__title">More like this</h2>
        </div>
        <div className="grid">
          {related.map(r => <RecordCard key={r.id} record={r} />)}
        </div>
      </div>
    </section>
  );
}
