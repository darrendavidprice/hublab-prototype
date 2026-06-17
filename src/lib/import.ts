import type {
  HubRecord, RecordType, SubBrand, AgeGroupId, SubjectId,
  EventDetails, ResourceDetails, ResearchDetails,
} from '../data/types';
import {
  RECORD_TYPES, RECORD_TYPE_ORDER, SUB_BRANDS, SUB_BRAND_ORDER,
  AGE_GROUPS, SUBJECTS,
} from '../data/vocabularies';
import { blankRecord, newRecordId } from './admin';

/* ============================================================
   Bulk import engine (E2).

   Pure, framework-free helpers that power the admin Import screen:
   parse a delimited file → map columns → validate each row against the
   SAME rules as RecordForm + the controlled vocabularies → assemble a
   clean HubRecord. Also builds the downloadable CSV template + field
   legend that the M365 Forms intake (E3) is designed to match.

   Safety: never trust the file. We cap rows/size at the screen, validate
   every value, and reject unknown vocabulary (with a suggestion). In
   production this same validation runs server-side (Supabase) so RLS and
   the moderator role still apply — see docs/IMPORT_TEMPLATE.md.

   No third-party parser: .csv/.tsv are parsed natively here. Excel
   workbooks (.xlsx) are detected and the user is asked to export CSV
   (one step in Excel); the live build parses .xlsx server-side.
   ============================================================ */

/** Hard limits for the prototype (also documented for the server build). */
export const MAX_ROWS = 500;
export const MAX_BYTES = 2 * 1024 * 1024; // 2 MB

type Vocab = { id: string; label: string }[];

const TYPE_VOCAB: Vocab = RECORD_TYPE_ORDER.map(id => ({ id, label: RECORD_TYPES[id].label }));
const AUD_VOCAB: Vocab = SUB_BRAND_ORDER.map(id => ({ id, label: SUB_BRANDS[id].label }));
const AGE_VOCAB: Vocab = AGE_GROUPS.map(a => ({ id: a.id, label: a.label }));
const SUBJ_VOCAB: Vocab = SUBJECTS.map(s => ({ id: s.id, label: s.label }));

export type FieldKind =
  | 'text' | 'longtext' | 'url' | 'email'
  | 'enum' | 'enumList' | 'bool' | 'datetime' | 'date';

/** When a field is required. */
export type RequiredWhen = 'always' | 'event' | 'research' | 'ifImage' | false;

export interface ImportField {
  key: string;            // dotted path into HubRecord (e.g. 'event.start')
  header: string;         // canonical column header / M365 question title
  kind: FieldKind;
  required: RequiredWhen;
  vocab?: Vocab;
  example: string;
  help: string;
}

/** The column contract. Order = the template's column order.
 *  Keep in sync with docs/IMPORT_TEMPLATE.md and the M365 form questions. */
export const IMPORT_FIELDS: ImportField[] = [
  { key: 'type', header: 'Type', kind: 'enum', required: 'always', vocab: TYPE_VOCAB,
    example: 'Event', help: 'One value from the Type list.' },
  { key: 'title', header: 'Title', kind: 'text', required: 'always',
    example: 'Hands-on chemistry morning', help: 'Short, plain-language name.' },
  { key: 'summary', header: 'Summary', kind: 'longtext', required: 'always',
    example: 'Drop-in experiments for families — no booking needed.', help: 'One or two sentences for cards.' },
  { key: 'body', header: 'Description', kind: 'longtext', required: false,
    example: '', help: 'Optional longer text for the detail page.' },
  { key: 'audiences', header: 'Audiences', kind: 'enumList', required: 'always', vocab: AUD_VOCAB,
    example: 'FunLab', help: 'One or more, separated by ; or , (FunLab / FutureLab / LifeLab).' },
  { key: 'ageGroups', header: 'Age groups', kind: 'enumList', required: false, vocab: AGE_VOCAB,
    example: 'Under 5s; Primary (5–11)', help: 'One or more age bands, separated by ; or ,.' },
  { key: 'subjects', header: 'Subjects', kind: 'enumList', required: false, vocab: SUBJ_VOCAB,
    example: 'Chemistry', help: 'One or more subjects, separated by ; or ,.' },
  { key: 'usefulForTeachers', header: 'Useful for teachers', kind: 'bool', required: false,
    example: 'No', help: 'Yes or No.' },
  { key: 'featured', header: 'Featured', kind: 'bool', required: false,
    example: 'No', help: 'Yes or No. Highlights the item on landing pages.' },
  { key: 'goLiveDate', header: 'Go-live date', kind: 'date', required: false,
    example: '01/09/2026', help: 'dd/mm/yyyy. Blank = today.' },
  { key: 'expiryDate', header: 'Expiry date', kind: 'date', required: false,
    example: '01/09/2027', help: 'dd/mm/yyyy. Blank = one year from go-live (events: just after the end).' },
  { key: 'promoImage', header: 'Image URL', kind: 'url', required: false,
    example: '', help: 'Optional link to an image already hosted online.' },
  { key: 'promoImageAlt', header: 'Image description', kind: 'text', required: 'ifImage',
    example: '', help: 'Required if an image URL is given — describes it for screen readers.' },
  { key: 'caption', header: 'Image caption', kind: 'text', required: false,
    example: '', help: 'Optional caption shown under the image.' },
  { key: 'event.start', header: 'Event start', kind: 'datetime', required: 'event',
    example: '14/09/2026 10:00', help: 'dd/mm/yyyy hh:mm. Required for events.' },
  { key: 'event.end', header: 'Event end', kind: 'datetime', required: 'event',
    example: '14/09/2026 13:00', help: 'dd/mm/yyyy hh:mm. Required for events.' },
  { key: 'event.venue', header: 'Venue', kind: 'text', required: false,
    example: 'University Place', help: 'Where it happens (leave blank if online).' },
  { key: 'event.isOnline', header: 'Online event', kind: 'bool', required: false,
    example: 'No', help: 'Yes or No.' },
  { key: 'event.bookingUrl', header: 'Booking link', kind: 'url', required: false,
    example: '', help: 'External booking page (we link out, never host booking).' },
  { key: 'event.capacityNote', header: 'Booking note', kind: 'text', required: false,
    example: 'Drop-in, no booking needed', help: 'Free-text note about booking/capacity.' },
  { key: 'resource.externalUrl', header: 'Link URL', kind: 'url', required: false,
    example: '', help: 'For links/videos — the page to send people to.' },
  { key: 'resource.fileUrl', header: 'File URL', kind: 'url', required: false,
    example: '', help: 'For downloads — link to the hosted file.' },
  { key: 'resource.fileLabel', header: 'File label', kind: 'text', required: false,
    example: 'PDF, 2.4 MB', help: 'What the file is.' },
  { key: 'resource.durationNote', header: 'Duration', kind: 'text', required: false,
    example: '12 min watch', help: 'e.g. "45 min activity".' },
  { key: 'research.plainSummary', header: 'Plain-English summary', kind: 'longtext', required: 'research',
    example: '', help: 'Required for "What our scientists are working on" explainers.' },
  { key: 'research.researchers', header: 'Researchers', kind: 'text', required: false,
    example: '', help: 'Lead author / names.' },
  { key: 'research.department', header: 'Department', kind: 'text', required: false,
    example: '', help: 'Department or group.' },
  { key: 'research.paperUrl', header: 'Paper / DOI link', kind: 'url', required: false,
    example: '', help: 'Link to the paper or DOI.' },
  { key: 'submitter.name', header: 'Your name', kind: 'text', required: 'always',
    example: 'Alex Tan', help: 'Who is submitting this.' },
  { key: 'submitter.email', header: 'Your email', kind: 'email', required: 'always',
    example: 'alex.tan@manchester.ac.uk', help: 'A @manchester.ac.uk address in the live workflow.' },
  { key: 'submitter.department', header: 'Your department', kind: 'text', required: false,
    example: 'School of Chemistry', help: 'Optional.' },
];

export const TEMPLATE_HEADERS = IMPORT_FIELDS.map(f => f.header);

/* ---------- Parsing ---------- */

/** Normalise a string for tolerant matching: lower-case, strip accents,
 *  drop anything that isn't a letter or digit. So "Ages 11–14", "ages11-14"
 *  and "KS3"→"ks3" all compare cleanly against the vocab id/label. */
export const norm = (s: string) =>
  s.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '');

/** Robust CSV/TSV parser (handles quotes, escaped "", and newlines in quotes).
 *  Delimiter auto-detected from the header line. Returns rows of cells, with
 *  fully-blank rows dropped. */
export function parseDelimited(text: string): string[][] {
  const t = text.replace(/^\uFEFF/, '');
  const nl = t.indexOf('\n');
  const firstLine = nl === -1 ? t : t.slice(0, nl);
  const delim = firstLine.split('\t').length > firstLine.split(',').length ? '\t' : ',';

  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (inQuotes) {
      if (c === '"') {
        if (t[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
      continue;
    }
    if (c === '"') inQuotes = true;
    else if (c === delim) { row.push(field); field = ''; }
    else if (c === '\r') { /* ignore */ }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter(r => r.some(c => c.trim() !== ''));
}

/** Looks like an Excel workbook? (.xlsx is a zip — starts with "PK".) */
export function looksLikeXlsx(name: string, head?: string): boolean {
  if (/\.xlsx?$/i.test(name)) return true;
  return !!head && head.startsWith('PK');
}

/* ---------- Column mapping ---------- */

export type ColumnMap = Record<string, number>; // field.key -> column index

/** Auto-map detected headers to fields by matching the canonical header or the
 *  field key (normalised). Unmatched columns are simply ignored. */
export function autoMap(headers: string[]): ColumnMap {
  const map: ColumnMap = {};
  const normHeaders = headers.map(norm);
  for (const f of IMPORT_FIELDS) {
    const targets = [norm(f.header), norm(f.key), norm(f.key.split('.').pop()!)];
    const idx = normHeaders.findIndex(h => h && targets.includes(h));
    if (idx >= 0) map[f.key] = idx;
  }
  return map;
}

/* ---------- Value coercion + vocab matching ---------- */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TRUE_SET = new Set(['yes', 'y', 'true', '1', 'x', '✓', 'on']);
const FALSE_SET = new Set(['no', 'n', 'false', '0', '', 'off']);

export function parseBool(v: string): boolean | null {
  const n = v.trim().toLowerCase();
  if (TRUE_SET.has(n)) return true;
  if (FALSE_SET.has(n)) return false;
  return null;
}

/** Tolerant date parse. Prefers dd/mm/yyyy (UK) then ISO/native. Returns ISO. */
export function parseDateish(v: string): string | null {
  const s = v.trim();
  if (!s) return null;
  const m = s.match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{2,4})(?:[ T](\d{1,2}):(\d{2}))?$/);
  if (m) {
    const [, d, mo, y, hh, mm] = m;
    const year = y.length === 2 ? 2000 + +y : +y;
    const dt = new Date(year, +mo - 1, +d, hh ? +hh : 0, mm ? +mm : 0);
    if (!isNaN(dt.getTime())) return dt.toISOString();
  }
  const dt = new Date(s);
  return isNaN(dt.getTime()) ? null : dt.toISOString();
}

/** Match one token to a vocab id. Returns the id, or a suggestion if close. */
function matchTerm(token: string, vocab: Vocab): { id?: string; suggestion?: string } {
  const n = norm(token);
  const exact = vocab.find(v => norm(v.id) === n || norm(v.label) === n);
  if (exact) return { id: exact.id };
  const near = vocab.find(v => norm(v.label).includes(n) || n.includes(norm(v.id)));
  return { suggestion: near?.label };
}

const splitList = (v: string) => v.split(/[;,]/).map(s => s.trim()).filter(Boolean);

/* ---------- Row → record ---------- */

export interface BuiltRow {
  record: HubRecord;
  errors: Record<string, string>; // keyed by field.key
}

const set = <T extends object>(o: T, path: string, val: unknown) => {
  const parts = path.split('.');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let cur: any = o;
  for (let i = 0; i < parts.length - 1; i++) cur = (cur[parts[i]] ??= {});
  cur[parts[parts.length - 1]] = val;
};

/** Build (and validate) a HubRecord from a row's editable string values,
 *  keyed by field.key. Mirrors RecordForm's validation plus vocab checks. */
export function buildRow(values: Record<string, string>): BuiltRow {
  const errors: Record<string, string> = {};
  const rec = blankRecord();
  rec.id = newRecordId();
  rec.body = undefined;

  const val = (k: string) => (values[k] ?? '').trim();

  // type
  const typeRaw = val('type');
  if (!typeRaw) errors['type'] = 'Pick a type.';
  else {
    const m = matchTerm(typeRaw, TYPE_VOCAB);
    if (m.id) rec.type = m.id as RecordType;
    else errors['type'] = m.suggestion ? `Unknown type. Did you mean “${m.suggestion}”?` : 'Unknown type.';
  }

  rec.title = val('title');
  if (!rec.title) errors['title'] = 'Give it a title.';
  rec.summary = val('summary');
  if (!rec.summary) errors['summary'] = 'Add a short summary.';
  if (val('body')) rec.body = val('body');

  // audiences (required, ≥1)
  const audTokens = splitList(val('audiences'));
  const auds: SubBrand[] = [];
  for (const tk of audTokens) {
    const m = matchTerm(tk, AUD_VOCAB);
    if (m.id) auds.push(m.id as SubBrand);
    else { errors['audiences'] = m.suggestion ? `“${tk}” isn’t a known audience. Did you mean “${m.suggestion}”?` : `“${tk}” isn’t a known audience.`; }
  }
  rec.audiences = [...new Set(auds)];
  if (!errors['audiences'] && rec.audiences.length === 0) errors['audiences'] = 'Pick at least one audience.';

  // ageGroups / subjects (optional lists)
  const ages: AgeGroupId[] = [];
  for (const tk of splitList(val('ageGroups'))) {
    const m = matchTerm(tk, AGE_VOCAB);
    if (m.id) ages.push(m.id as AgeGroupId);
    else errors['ageGroups'] = m.suggestion ? `“${tk}” isn’t a known age band. Did you mean “${m.suggestion}”?` : `“${tk}” isn’t a known age band.`;
  }
  rec.ageGroups = [...new Set(ages)];

  const subs: SubjectId[] = [];
  for (const tk of splitList(val('subjects'))) {
    const m = matchTerm(tk, SUBJ_VOCAB);
    if (m.id) subs.push(m.id as SubjectId);
    else errors['subjects'] = m.suggestion ? `“${tk}” isn’t a known subject. Did you mean “${m.suggestion}”?` : `“${tk}” isn’t a known subject.`;
  }
  rec.subjects = [...new Set(subs)];

  // booleans
  for (const k of ['usefulForTeachers', 'featured', 'event.isOnline'] as const) {
    const raw = val(k);
    if (raw) {
      const b = parseBool(raw);
      if (b === null) errors[k] = 'Use Yes or No.';
      else set(rec, k, b);
    }
  }

  // dates
  const go = val('goLiveDate');
  if (go) { const iso = parseDateish(go); if (iso) rec.goLiveDate = iso; else errors['goLiveDate'] = 'Use dd/mm/yyyy.'; }
  const exp = val('expiryDate');
  if (exp) { const iso = parseDateish(exp); if (iso) rec.expiryDate = iso; else errors['expiryDate'] = 'Use dd/mm/yyyy.'; }

  // image
  if (val('promoImage')) rec.promoImage = val('promoImage');
  if (val('promoImageAlt')) rec.promoImageAlt = val('promoImageAlt');
  if (val('caption')) rec.caption = val('caption');
  if (rec.promoImage && !rec.promoImageAlt) errors['promoImageAlt'] = 'Describe the image for screen-reader users.';

  // type-conditional blocks
  const ev: Partial<EventDetails> = {};
  const evStart = val('event.start'); const evEnd = val('event.end');
  if (rec.type === 'event') {
    if (!evStart) errors['event.start'] = 'Add a start time.';
    else { const iso = parseDateish(evStart); if (iso) ev.start = iso; else errors['event.start'] = 'Use dd/mm/yyyy hh:mm.'; }
    if (!evEnd) errors['event.end'] = 'Add an end time.';
    else { const iso = parseDateish(evEnd); if (iso) ev.end = iso; else errors['event.end'] = 'Use dd/mm/yyyy hh:mm.'; }
    if (ev.start && ev.end && new Date(ev.end) < new Date(ev.start)) errors['event.end'] = 'The event ends before it starts.';
  } else {
    if (evStart) { const iso = parseDateish(evStart); if (iso) ev.start = iso; }
    if (evEnd) { const iso = parseDateish(evEnd); if (iso) ev.end = iso; }
  }
  if (val('event.venue')) ev.venue = val('event.venue');
  if (typeof (rec as { event?: EventDetails }).event?.isOnline === 'boolean') ev.isOnline = (rec as { event?: EventDetails }).event!.isOnline;
  if (val('event.bookingUrl')) ev.bookingUrl = val('event.bookingUrl');
  if (val('event.capacityNote')) ev.capacityNote = val('event.capacityNote');
  rec.event = (ev.start || ev.end || ev.venue || ev.bookingUrl || ev.capacityNote || ev.isOnline) ? (ev as EventDetails) : undefined;

  const res: Partial<ResourceDetails> = {};
  if (val('resource.externalUrl')) res.externalUrl = val('resource.externalUrl');
  if (val('resource.fileUrl')) res.fileUrl = val('resource.fileUrl');
  if (val('resource.fileLabel')) res.fileLabel = val('resource.fileLabel');
  if (val('resource.durationNote')) res.durationNote = val('resource.durationNote');
  rec.resource = Object.keys(res).length ? res : undefined;

  const rsh: Partial<ResearchDetails> = {};
  if (val('research.plainSummary')) rsh.plainSummary = val('research.plainSummary');
  if (val('research.researchers')) rsh.researchers = val('research.researchers');
  if (val('research.department')) rsh.department = val('research.department');
  if (val('research.paperUrl')) rsh.paperUrl = val('research.paperUrl');
  if (rec.type === 'research_explainer' && !rsh.plainSummary) errors['research.plainSummary'] = 'Add a plain-English summary.';
  rec.research = rsh.plainSummary ? (rsh as ResearchDetails) : (Object.keys(rsh).length ? (rsh as ResearchDetails) : undefined);

  // expiry vs go-live
  if (!errors['expiryDate'] && new Date(rec.expiryDate) <= new Date(rec.goLiveDate)) {
    errors['expiryDate'] = 'Expiry needs to be after the go-live date.';
  }

  // submitter
  rec.submitter.name = val('submitter.name');
  if (!rec.submitter.name) errors['submitter.name'] = 'Add a name.';
  rec.submitter.email = val('submitter.email');
  if (!EMAIL_RE.test(rec.submitter.email)) errors['submitter.email'] = 'Add a valid email address.';
  if (val('submitter.department')) rec.submitter.department = val('submitter.department');

  return { record: rec, errors };
}

/* ---------- Templates ---------- */

const csvCell = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
const csvRow = (cells: string[]) => cells.map(csvCell).join(',');

/** A ready-to-fill CSV: header row + two worked examples (an event + an activity). */
export function buildTemplateCsv(): string {
  const byKey = (vals: Record<string, string>) => IMPORT_FIELDS.map(f => vals[f.key] ?? '');
  const eventRow = byKey({
    type: 'Event', title: 'Hands-on chemistry morning',
    summary: 'Drop-in experiments for families — no booking needed.',
    audiences: 'FunLab', ageGroups: 'Under 5s; Primary (5–11)', subjects: 'Chemistry',
    usefulForTeachers: 'No', featured: 'No',
    goLiveDate: '01/08/2026', expiryDate: '15/09/2026',
    'event.start': '14/09/2026 10:00', 'event.end': '14/09/2026 13:00',
    'event.venue': 'University Place', 'event.isOnline': 'No',
    'event.capacityNote': 'Drop-in, no booking needed',
    'submitter.name': 'Alex Tan', 'submitter.email': 'alex.tan@manchester.ac.uk',
    'submitter.department': 'School of Chemistry',
  });
  const activityRow = byKey({
    type: 'Activity to try at home', title: 'Build a balloon-powered car',
    summary: 'A quick STEM activity using things from the recycling box.',
    audiences: 'FunLab; FutureLab', ageGroups: 'Primary (5–11); Ages 11–14',
    subjects: 'Engineering; Physics', usefulForTeachers: 'Yes', featured: 'No',
    'resource.durationNote': '30 min activity',
    'submitter.name': 'Sam Lee', 'submitter.email': 'sam.lee@manchester.ac.uk',
  });
  return [csvRow(TEMPLATE_HEADERS), csvRow(eventRow), csvRow(activityRow)].join('\r\n');
}

/** A legend CSV documenting every column — doubles as the M365 question guide. */
export function buildLegendCsv(): string {
  const reqLabel = (r: RequiredWhen) =>
    r === 'always' ? 'Required'
      : r === 'event' ? 'Required for events'
        : r === 'research' ? 'Required for explainers'
          : r === 'ifImage' ? 'Required if an image is given'
            : 'Optional';
  const rows = IMPORT_FIELDS.map(f => csvRow([
    f.header,
    f.key,
    reqLabel(f.required),
    f.vocab ? f.vocab.map(v => v.label).join(' | ') : f.kind,
    f.help,
    f.example,
  ]));
  return [csvRow(['Column header', 'Field', 'Required', 'Valid values / kind', 'Notes', 'Example']), ...rows].join('\r\n');
}
