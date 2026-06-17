import { Link } from 'react-router-dom';
import type { HubRecord } from '../data/types';
import { RECORD_TYPES, SUB_BRANDS, ageLabel, subjectLabel } from '../data/vocabularies';
import { formatDateShort } from '../lib/format';

/** Shown after a new submission (or draft) is saved: confirms what happened,
 *  explains the next step, and recaps the key fields so the submitter can check
 *  at a glance. Drafts and submissions get different copy because they enter the
 *  workflow at different points. */
export function SubmissionConfirmation({
  record, intent, onAnother, onDone,
}: {
  record: HubRecord;
  intent: 'submit' | 'draft';
  onAnother: () => void;
  onDone: () => void;
}) {
  const isDraft = intent === 'draft';
  const rows: { label: string; value: string }[] = [
    { label: 'Type', value: RECORD_TYPES[record.type].label },
    { label: 'For', value: record.audiences.map(a => SUB_BRANDS[a].label).join(', ') || '—' },
  ];
  if (record.ageGroups.length) rows.push({ label: 'Ages', value: record.ageGroups.map(ageLabel).join(', ') });
  if (record.subjects.length) rows.push({ label: 'Subjects', value: record.subjects.map(subjectLabel).join(', ') });
  if (record.type === 'event' && record.event?.start) {
    rows.push({ label: 'When', value: `${formatDateShort(record.event.start)} – ${formatDateShort(record.event.end)}` });
  }
  rows.push({ label: 'Go-live', value: formatDateShort(record.goLiveDate) });
  rows.push({ label: 'Expires', value: formatDateShort(record.expiryDate) });
  rows.push({ label: 'From', value: `${record.submitter.name}${record.submitter.email ? ` (${record.submitter.email})` : ''}` });

  return (
    <div className="confirm">
      <div className="confirm__badge" aria-hidden="true">{isDraft ? '✎' : '✓'}</div>
      <h2 className="confirm__title">
        {isDraft ? 'Saved as a draft' : 'Submitted for review'}
      </h2>
      <p className="confirm__lead">
        {isDraft
          ? <>“{record.title}” is saved as a draft. It stays private and out of public view until you submit it. You’ll find it under <strong>All content</strong> in the admin to finish later.</>
          : <>Thanks — “{record.title}” is now in the moderation queue. A moderator will review it and either publish it, send it back with a note, or get in touch. It won’t appear publicly until it’s approved and reaches its go-live date.</>}
      </p>

      <div className="confirm__summary">
        <h3 className="confirm__subtitle">What you sent</h3>
        <p className="confirm__rsum">{record.summary || <em className="atable__meta">No summary yet.</em>}</p>
        <div className="confirm__grid">
          {rows.map(r => (
            <p key={r.label} className="confirm__row">
              <span className="confirm__k">{r.label}</span>
              <span className="confirm__v">{r.value}</span>
            </p>
          ))}
        </div>
      </div>

      <div className="cluster">
        <button type="button" className="btn btn--primary" style={{ background: 'var(--c-hublab)', color: '#fff' }} onClick={onAnother}>
          Submit another
        </button>
        <Link to={`/admin/edit/${record.id}`} className="btn btn--ghost" style={{ borderColor: 'var(--c-line)', color: 'var(--c-ink)' }}>
          {isDraft ? 'Keep editing this draft' : 'Edit this submission'}
        </Link>
        <button type="button" className="abtn" onClick={onDone}>Back to admin</button>
      </div>
    </div>
  );
}
