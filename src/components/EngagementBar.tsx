import { useState } from 'react';
import type { HubRecord } from '../data/types';
import { api, ratingAverage } from '../data/api';
import { compact } from '../lib/format';

/** Feedback controls for a record's detail page.
 *  The brief has real, accumulating feedback arriving in the pilot; for the
 *  prototype these controls are live but local — they write straight through
 *  the data layer (api.update), so the persistence path and the schema fields
 *  are exercised end to end. The record itself is owned by the parent and
 *  passed in, so counts updated elsewhere on the page (e.g. the view counter)
 *  stay in step here. A thumbs-up and a rating each count once per visitor,
 *  tracked in local state for this session. */
export function EngagementBar({ record, onChange }: { record: HubRecord; onChange: (r: HubRecord) => void }) {
  const [thumbed, setThumbed] = useState(false);
  const [myRating, setMyRating] = useState(0);

  const avg = ratingAverage(record);

  async function thumb() {
    const delta = thumbed ? -1 : 1;
    const updated = await api.update(record.id, {
      engagement: { ...record.engagement, thumbsUp: Math.max(0, record.engagement.thumbsUp + delta) },
    });
    setThumbed(!thumbed);
    onChange(updated);
  }

  async function rate(stars: number) {
    // Replace this visitor's previous rating if they change their mind.
    const had = myRating > 0;
    const sum = record.engagement.ratingSum - (had ? myRating : 0) + stars;
    const count = record.engagement.ratingCount + (had ? 0 : 1);
    const updated = await api.update(record.id, {
      engagement: { ...record.engagement, ratingSum: sum, ratingCount: count },
    });
    setMyRating(stars);
    onChange(updated);
  }

  return (
    <div className="engage" aria-label="Your feedback">
      <div className="engage__group">
        <button type="button" className="thumb-btn" aria-pressed={thumbed} onClick={thumb}>
          <span aria-hidden="true">👍</span>
          {thumbed ? 'Liked' : 'Helpful'} · {compact(record.engagement.thumbsUp)}
        </button>
      </div>

      <div className="engage__group">
        <span id="rate-label" style={{ fontWeight: 600 }}>Rate this</span>
        <span className="stars" role="radiogroup" aria-labelledby="rate-label">
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={myRating === n}
              aria-label={`${n} star${n > 1 ? 's' : ''}`}
              className={`star-btn${(myRating || Math.round(avg ?? 0)) >= n ? ' on' : ''}`}
              onClick={() => rate(n)}
            >
              ★
            </button>
          ))}
        </span>
      </div>

      <div className="engage__counts">
        {avg !== null && <span>{avg.toFixed(1)} / 5 from {compact(record.engagement.ratingCount)} {record.engagement.ratingCount === 1 ? 'rating' : 'ratings'}</span>}
        {record.engagement.views > 0 && <span>{compact(record.engagement.views)} views</span>}
        {record.engagement.downloads > 0 && <span>{compact(record.engagement.downloads)} downloads</span>}
      </div>
    </div>
  );
}
