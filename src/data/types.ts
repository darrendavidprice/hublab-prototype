/* ============================================================
   Data model — the single source of truth for a "record".
   The same shape is served today by the localStorage adapter and,
   later, by Supabase or headless WordPress. Keep this stable;
   adapters translate to/from it.
   ============================================================ */

/** Which sub-brand audience(s) a record belongs to. A record may belong to
 *  several — this is the multi-select that maps to the sub-brand tag and
 *  drives cross-category surfacing (a record can appear on more than one
 *  sub-brand page). */
export type SubBrand = 'funlab' | 'futurelab' | 'lifelab';

/** Content type. Each type gets its own detail layout (Phase 2+). */
export type RecordType =
  | 'event'
  | 'video'
  | 'downloadable'
  | 'book'
  | 'work_experience'
  | 'tutoring'
  | 'schools_resource'
  | 'teaching_guide'
  | 'external_link'
  | 'activity'
  | 'research_explainer';

/** Editorial workflow states (the moderation queue lives on these). */
export type RecordStatus =
  | 'draft'              // being written by submitter
  | 'submitted'          // in the admin review queue
  | 'needs_clarification'// sent back to submitter
  | 'rejected'           // declined
  | 'approved'           // accepted, awaiting go-live date
  | 'live'               // publicly visible (go-live reached, not expired)
  | 'unpublished'        // pulled from public view by an admin
  | 'expired';           // past expiry; awaiting renew or delete

/** Controlled-vocabulary term ids (see vocabularies.ts for labels). */
export type AgeGroupId =
  | 'early_years' | 'primary' | 'ks3' | 'ks4' | 'post16' | 'adults';

export type SubjectId =
  | 'biology' | 'chemistry' | 'physics' | 'engineering'
  | 'maths' | 'computing' | 'space' | 'environment' | 'general_stem';

export interface AuditEntry {
  at: string;            // ISO timestamp
  by: string;            // actor name/email
  from?: RecordStatus;
  to: RecordStatus;
  note?: string;
}

/** Fields specific to events (present only when type === 'event'). */
export interface EventDetails {
  start: string;         // ISO datetime of the event itself
  end: string;           // ISO datetime
  venue?: string;
  isOnline?: boolean;
  bookingUrl?: string;   // we link OUT to the University/Eventbrite booking
  capacityNote?: string; // e.g. "Drop-in, no booking needed"
}

/** Fields for media/file/link types. */
export interface ResourceDetails {
  externalUrl?: string;  // external_link, video (embed/watch), citizen science
  fileUrl?: string;      // downloadable, teaching_guide, schools_resource
  fileLabel?: string;    // e.g. "PDF, 2.4 MB"
  durationNote?: string; // e.g. "12 min watch", "45 min activity"
}

/** Fields for research explainers (single-page plain-language write-ups). */
export interface ResearchDetails {
  plainSummary: string;  // the "in plain English" lead
  researchers?: string;  // author/lead names
  department?: string;
  paperUrl?: string;     // DOI / journal link
}

/** Lightweight engagement counters — wired to real feedback in a later phase,
 *  included now so the schema is ready and the UI can show them. */
export interface Engagement {
  views: number;
  downloads: number;
  thumbsUp: number;
  ratingSum: number;     // for a star average: ratingSum / ratingCount
  ratingCount: number;
}

export interface Submitter {
  name: string;
  email: string;         // expected @manchester.ac.uk in the real workflow
  department?: string;
}

export interface HubRecord {
  id: string;
  type: RecordType;
  title: string;
  /** Short, plain-language summary used on cards and previews. */
  summary: string;
  /** Optional long-form body (markdown-lite). Used by explainers, activities,
   *  and any type that needs a richer read. */
  body?: string;

  /** Taxonomy (controlled vocabularies). */
  audiences: SubBrand[];
  ageGroups: AgeGroupId[];
  subjects: SubjectId[];

  /** Useful-for-teachers flag drives the teacher filter (we signpost, not host). */
  usefulForTeachers: boolean;
  /** Featured pieces can be highlighted as heroes on landing pages. */
  featured: boolean;

  /** Imagery. */
  promoImage?: string;   // path under /brand or an external URL
  promoImageAlt?: string;
  caption?: string;

  /** Publication lifecycle dates. */
  status: RecordStatus;
  goLiveDate: string;    // ISO; may be "now" / past for immediate
  expiryDate: string;    // ISO; defaults to +1 year (events: just after end)

  /** Type-specific detail blocks. */
  event?: EventDetails;
  resource?: ResourceDetails;
  research?: ResearchDetails;

  /** Provenance + moderation. */
  submitter: Submitter;
  createdAt: string;
  updatedAt: string;
  audit: AuditEntry[];

  engagement: Engagement;
}

/** Filters accepted by the data layer's query method. */
export interface RecordQuery {
  subBrand?: SubBrand;            // limit to one sub-brand (sub-brand pages)
  audiences?: SubBrand[];
  ageGroups?: AgeGroupId[];
  subjects?: SubjectId[];
  types?: RecordType[];
  usefulForTeachers?: boolean;
  featuredOnly?: boolean;
  text?: string;                 // free-text over title/summary
  /** Event date-range search (calendar). */
  eventsBetween?: { from: string; to: string };
  /** Include only records that are publicly live right now. Default true for
   *  public views; admin passes false to see everything. */
  publicOnly?: boolean;
}
