import { Link } from 'react-router-dom';
import type { HubRecord } from '../data/types';
import { RECORD_TYPES, SUB_BRANDS } from '../data/vocabularies';
import { daysToExpiry, ratingAverage } from '../data/api';
import { formatEventWhen, compact } from '../lib/format';
import { findLink } from '../lib/facets';

/** The canonical record card. Used by the directory, the featured strip and
 *  (in Phase 3) the sub-brand pages, so they all stay visually consistent.
 *  Themed by the record's first audience via [data-lab]; the whole card is a
 *  link, with the title carrying the accessible name. */
export function RecordCard({ record, featured = false }: { record: HubRecord; featured?: boolean }) {
  const type = RECORD_TYPES[record.type];
  const lab = record.audiences[0] ?? 'hublab';
  const rating = ratingAverage(record);
  const dte = daysToExpiry(record);
  const expiringSoon = dte >= 0 && dte <= 14;

  // The single most useful "when/how long" hint for this type.
  let metaHint: string | null = null;
  if (record.type === 'event' && record.event) {
    metaHint = formatEventWhen(record.event.start, record.event.end);
  } else if (record.resource?.durationNote) {
    metaHint = record.resource.durationNote;
  } else if (record.resource?.fileLabel) {
    metaHint = record.resource.fileLabel;
  }

  return (
    <article className={`card${featured ? ' card--featured' : ''}`} data-lab={lab}>
      <div className="card__accent" aria-hidden="true" />
      {record.promoImage && (
        <div className="card__media">
          <img src={record.promoImage} alt={record.promoImageAlt ?? ''} loading="lazy" />
        </div>
      )}
      <div className="card__body">
        <div className="card__chips">
          <Link className="chip chip--type chip--link" to={findLink({ types: [record.type] })}>{type.noun}</Link>
          {record.audiences.map(a => (
            <Link key={a} className="chip chip--lab chip--link" data-lab={a} to={findLink({ audiences: [a] })}>{SUB_BRANDS[a].label}</Link>
          ))}
          {record.usefulForTeachers && <Link className="chip chip--teacher chip--link" to={findLink({ usefulForTeachers: true })}>For teachers</Link>}
          {expiringSoon && <span className="chip chip--soon">Ending soon</span>}
        </div>

        <h3 className="card__title">
          <Link to={`/record/${record.id}`}>{record.title}</Link>
        </h3>
        <p className="card__summary">{record.summary}</p>

        <div className="card__meta">
          {metaHint && <span className="meta-item">{metaHint}</span>}
          {rating !== null && (
            <span className="meta-item" aria-label={`Rated ${rating.toFixed(1)} out of 5`}>
              <span aria-hidden="true">★</span> {rating.toFixed(1)}
            </span>
          )}
          {record.engagement.views > 0 && (
            <span className="meta-item">{compact(record.engagement.views)} views</span>
          )}
        </div>
      </div>
    </article>
  );
}
