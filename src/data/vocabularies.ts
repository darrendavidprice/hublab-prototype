import type {
  SubBrand, RecordType, AgeGroupId, SubjectId,
} from './types';

/* ============================================================
   Controlled vocabularies.
   Submitters pick from these fixed lists; only admins extend them.
   This keeps filtering reliable (no "KS3" vs "Key Stage 3"
   fragmentation). In WordPress these become custom taxonomies;
   in Supabase, lookup tables. Labels here are user-facing and use
   plain, audience-first language per the brief.
   ============================================================ */

export interface SubBrandMeta {
  id: SubBrand;
  label: string;
  audience: string;       // plain-language audience line
  tagline: string;
  lab: SubBrand;          // data-lab value for theming
}

export const SUB_BRANDS: Record<SubBrand, SubBrandMeta> = {
  funlab: {
    id: 'funlab',
    label: 'FunLab',
    audience: 'Young children & families',
    tagline: 'Where science and fun collide',
    lab: 'funlab',
  },
  futurelab: {
    id: 'futurelab',
    label: 'FutureLab',
    audience: 'Ages 11 and up',
    tagline: 'Try the future on for size',
    lab: 'futurelab',
  },
  lifelab: {
    id: 'lifelab',
    label: 'LifeLab',
    audience: 'Curious adults, 18+',
    tagline: 'Stay curious for life',
    lab: 'lifelab',
  },
};

export const SUB_BRAND_ORDER: SubBrand[] = ['funlab', 'futurelab', 'lifelab'];

/** Record types with plain-language labels and a short noun for cards. */
export interface RecordTypeMeta {
  id: RecordType;
  label: string;      // plain label, e.g. "Activity to try at home"
  noun: string;       // short noun for chips, e.g. "Activity"
}

export const RECORD_TYPES: Record<RecordType, RecordTypeMeta> = {
  event:            { id: 'event',            label: 'Event',                       noun: 'Event' },
  video:            { id: 'video',            label: 'Video',                       noun: 'Video' },
  downloadable:     { id: 'downloadable',     label: 'Activity to try at home',     noun: 'Activity' },
  book:             { id: 'book',             label: 'Book',                        noun: 'Book' },
  work_experience:  { id: 'work_experience',  label: 'Work experience',             noun: 'Work experience' },
  tutoring:         { id: 'tutoring',         label: 'Tutoring & mentoring',        noun: 'Tutoring' },
  schools_resource: { id: 'schools_resource', label: 'Schools resource',            noun: 'For schools' },
  teaching_guide:   { id: 'teaching_guide',   label: 'Teaching guide',              noun: 'Teaching guide' },
  external_link:    { id: 'external_link',    label: 'Link worth a look',           noun: 'Link' },
  activity:         { id: 'activity',         label: 'Hands-on activity',           noun: 'Activity' },
  research_explainer: { id: 'research_explainer', label: 'What our scientists are working on', noun: 'Explainer' },
};

export const RECORD_TYPE_ORDER: RecordType[] = [
  'event', 'activity', 'downloadable', 'video', 'research_explainer',
  'work_experience', 'tutoring', 'book', 'teaching_guide', 'schools_resource', 'external_link',
];

export interface TermMeta<T extends string> { id: T; label: string; }

export const AGE_GROUPS: TermMeta<AgeGroupId>[] = [
  { id: 'early_years', label: 'Under 5s' },
  { id: 'primary',     label: 'Primary (5–11)' },
  { id: 'ks3',         label: 'Ages 11–14' },
  { id: 'ks4',         label: 'Ages 14–16' },
  { id: 'post16',      label: 'Ages 16–18' },
  { id: 'adults',      label: 'Adults (18+)' },
];

export const SUBJECTS: TermMeta<SubjectId>[] = [
  { id: 'biology',      label: 'Biology & life' },
  { id: 'chemistry',    label: 'Chemistry' },
  { id: 'physics',      label: 'Physics' },
  { id: 'engineering',  label: 'Engineering' },
  { id: 'maths',        label: 'Maths' },
  { id: 'computing',    label: 'Computing & AI' },
  { id: 'space',        label: 'Space' },
  { id: 'environment',  label: 'Environment' },
  { id: 'general_stem', label: 'All-round STEM' },
];

/** Helper lookups */
export const ageLabel = (id: AgeGroupId) => AGE_GROUPS.find(a => a.id === id)?.label ?? id;
export const subjectLabel = (id: SubjectId) => SUBJECTS.find(s => s.id === id)?.label ?? id;
export const typeMeta = (id: RecordType) => RECORD_TYPES[id];
