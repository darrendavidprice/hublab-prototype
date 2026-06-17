import type { HubRecord, RecordStatus } from '../data/types';
import { STATUS_META } from '../lib/admin';
import { formatDateShort } from '../lib/format';

export function StatusBadge({ status }: { status: RecordStatus }) {
  return <span className={`badge badge--${status}`}>{STATUS_META[status].label}</span>;
}

/** The record's moderation history, newest last (as stored). Each entry is a
 *  status change written by the data layer's `transition`. */
export function AuditTrail({ record }: { record: HubRecord }) {
  if (record.audit.length === 0) {
    return <p className="atable__meta">No history yet.</p>;
  }
  return (
    <ul className="audit">
      {record.audit.map((e, i) => (
        <li key={i} className="audit__row">
          <span className="audit__when">{formatDateShort(e.at)}</span>
          <span className="audit__what">
            <b>{STATUS_META[e.to].label}</b>
            {e.from ? <> — from {STATUS_META[e.from].label}</> : null} · {e.by}
            {e.note ? <><br /><em>“{e.note}”</em></> : null}
          </span>
        </li>
      ))}
    </ul>
  );
}
