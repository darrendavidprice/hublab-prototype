import type { HubRecord, RecordStatus, RecordType } from '../data/types';

/** Who the moderation actions are attributed to in the prototype. In the real
 *  build this is the signed-in @manchester admin (SSO); here it's a constant. */
export const ADMIN_ACTOR = 'Moderator (you)';

/** How a form save was triggered. 'submit' sends a new/draft record to the
 *  moderation queue; 'draft' keeps it as the author's work-in-progress; 'save'
 *  is a content-only edit that leaves an item's status/history untouched. */
export type SaveIntent = 'submit' | 'draft' | 'save';

/** Plain-language label + badge tone for each status. */
export const STATUS_META: Record<RecordStatus, { label: string }> = {
  draft: { label: 'Draft' },
  submitted: { label: 'In queue' },
  needs_clarification: { label: 'Sent back' },
  rejected: { label: 'Rejected' },
  approved: { label: 'Scheduled' },
  live: { label: 'Live' },
  unpublished: { label: 'Unpublished' },
  expired: { label: 'Expired' },
};

export const QUEUE_STATUSES: RecordStatus[] = ['submitted', 'needs_clarification'];

export function newRecordId(): string {
  return 'rec-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

/** ISO → value for <input type="date"> (YYYY-MM-DD). */
export const isoToDateInput = (iso: string) => (iso ? new Date(iso).toISOString().slice(0, 10) : '');
/** ISO → value for <input type="datetime-local"> (YYYY-MM-DDTHH:mm), local time. */
export function isoToDatetimeLocal(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
/** <input> value back to ISO. */
export const inputToIso = (v: string) => (v ? new Date(v).toISOString() : '');

/** A blank record scaffold for the submission form. Defaults expiry to +1 year
 *  (the locked default) and go-live to today. */
export function blankRecord(): HubRecord {
  const now = new Date();
  const inAYear = new Date(now); inAYear.setFullYear(now.getFullYear() + 1);
  return {
    id: '',
    type: 'activity' as RecordType,
    title: '',
    summary: '',
    body: '',
    audiences: [],
    ageGroups: [],
    subjects: [],
    usefulForTeachers: false,
    featured: false,
    status: 'submitted',
    goLiveDate: now.toISOString(),
    expiryDate: inAYear.toISOString(),
    submitter: { name: '', email: '', department: '' },
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    audit: [],
    engagement: { views: 0, downloads: 0, thumbsUp: 0, ratingSum: 0, ratingCount: 0 },
  };
}
