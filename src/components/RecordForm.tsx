import { useRef, useState } from 'react';
import type {
  HubRecord, RecordType, SubBrand, AgeGroupId, SubjectId,
} from '../data/types';
import {
  RECORD_TYPE_ORDER, RECORD_TYPES, SUB_BRAND_ORDER, SUB_BRANDS,
  AGE_GROUPS, SUBJECTS,
} from '../data/vocabularies';
import {
  newRecordId, isoToDateInput, isoToDatetimeLocal, inputToIso, ADMIN_ACTOR,
  type SaveIntent,
} from '../lib/admin';
import { fileToPreviewDataUrl, isDataUrl } from '../lib/image';

/** Fields that can carry a validation message. */
type FieldKey =
  | 'title' | 'summary' | 'audiences' | 'eventStart' | 'eventEnd'
  | 'plainSummary' | 'promoImageAlt' | 'goLiveDate' | 'expiryDate'
  | 'submitterName' | 'submitterEmail';

type ErrorMap = Partial<Record<FieldKey, string>>;

/** Order used by the error summary and "first invalid field" focus. */
const FIELD_ORDER: FieldKey[] = [
  'title', 'summary', 'audiences', 'eventStart', 'eventEnd', 'plainSummary',
  'promoImageAlt', 'goLiveDate', 'expiryDate', 'submitterName', 'submitterEmail',
];

/** The element each error focuses when its summary entry is activated. */
const ANCHOR: Record<FieldKey, string> = {
  title: 'rf-title', summary: 'rf-summary', audiences: 'rf-audiences-group',
  eventStart: 'rf-start', eventEnd: 'rf-end', plainSummary: 'rf-plain',
  promoImageAlt: 'rf-alt', goLiveDate: 'rf-go', expiryDate: 'rf-exp',
  submitterName: 'rf-sname', submitterEmail: 'rf-semail',
};

/** Full ("ready to submit") validation. Drafts only need a title (below). */
function validate(f: HubRecord): ErrorMap {
  const e: ErrorMap = {};
  if (!f.title.trim()) e.title = 'Give it a title.';
  if (!f.summary.trim()) e.summary = 'Add a short summary.';
  if (f.audiences.length === 0) e.audiences = 'Pick at least one audience (who it’s for).';
  if (!f.goLiveDate) e.goLiveDate = 'Set a go-live date.';
  if (!f.expiryDate) e.expiryDate = 'Set an expiry date.';
  else if (f.goLiveDate && new Date(f.expiryDate) <= new Date(f.goLiveDate)) {
    e.expiryDate = 'Expiry needs to be after the go-live date.';
  }
  if (f.type === 'event') {
    if (!f.event?.start) e.eventStart = 'Add a start time.';
    if (!f.event?.end) e.eventEnd = 'Add an end time.';
    else if (f.event?.start && new Date(f.event.end) < new Date(f.event.start)) {
      e.eventEnd = 'The event ends before it starts.';
    }
  }
  if (f.type === 'research_explainer' && !f.research?.plainSummary?.trim()) {
    e.plainSummary = 'Research explainers need a plain-English summary.';
  }
  if (f.promoImage && !f.promoImageAlt?.trim()) {
    e.promoImageAlt = 'Describe the image for people using a screen reader.';
  }
  if (!f.submitter.name.trim()) e.submitterName = 'Add your name.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.submitter.email)) e.submitterEmail = 'Add a valid email address.';
  return e;
}

/** Shared create/edit form for a HubRecord. Produces a fully-assembled record
 *  and hands it to `onSave` with the intent (submit / draft / save); the parent
 *  route decides create vs update and shows the confirmation. New submissions
 *  are stamped 'submitted' (or 'draft') with an opening audit entry, exactly as
 *  a real submission would be. Validation is inline + summarised; drafts can be
 *  saved incomplete so work isn't lost. */
export function RecordForm({
  initial, mode, onSave, onCancel,
}: {
  initial: HubRecord;
  mode: 'create' | 'edit';
  onSave: (rec: HubRecord, intent: SaveIntent) => void;
  onCancel: () => void;
}) {
  const [f, setF] = useState<HubRecord>(initial);
  const [touched, setTouched] = useState<Partial<Record<FieldKey, boolean>>>({});
  // Which kind of save has been attempted (drives the summary + inline reveal).
  const [attempted, setAttempted] = useState<null | 'full' | 'draft'>(null);
  const [imgError, setImgError] = useState<string | null>(null);
  const [imgBusy, setImgBusy] = useState(false);
  const [previewBroken, setPreviewBroken] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const editingDraft = mode === 'edit' && initial.status === 'draft';

  const set = (patch: Partial<HubRecord>) => setF(prev => ({ ...prev, ...patch }));
  const setEvent = (patch: Partial<NonNullable<HubRecord['event']>>) =>
    setF(prev => ({ ...prev, event: { start: '', end: '', ...prev.event, ...patch } }));
  const setResource = (patch: Partial<NonNullable<HubRecord['resource']>>) =>
    setF(prev => ({ ...prev, resource: { ...prev.resource, ...patch } }));
  const setResearch = (patch: Partial<NonNullable<HubRecord['research']>>) =>
    setF(prev => ({ ...prev, research: { plainSummary: '', ...prev.research, ...patch } }));
  const setSubmitter = (patch: Partial<HubRecord['submitter']>) =>
    setF(prev => ({ ...prev, submitter: { ...prev.submitter, ...patch } }));

  const touch = (k: FieldKey) => setTouched(t => (t[k] ? t : { ...t, [k]: true }));

  const toggle = <T extends string>(key: 'audiences' | 'ageGroups' | 'subjects', id: T) => {
    if (key === 'audiences') touch('audiences');
    const arr = f[key] as string[];
    set({ [key]: arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id] } as Partial<HubRecord>);
  };

  // Live validation. `summary` is the active set shown in the alert box and used
  // to reveal inline errors after a save attempt; it updates as fields are fixed.
  const errors = validate(f);
  const draftBlock: ErrorMap = f.title.trim() ? {} : { title: errors.title };
  const summary: ErrorMap = attempted === 'draft' ? draftBlock : attempted === 'full' ? errors : {};
  const show = (k: FieldKey) => (touched[k] && !!errors[k]) || !!summary[k];
  const aria = (k: FieldKey, id: string) =>
    show(k) ? { 'aria-invalid': true as const, 'aria-describedby': `${id}-err` } : {};
  const renderErr = (k: FieldKey, id: string) =>
    show(k) ? <span className="field-error" id={`${id}-err`}>{errors[k]}</span> : null;

  const focusField = (k: FieldKey) => {
    const el = document.getElementById(ANCHOR[k]);
    if (el) { el.focus(); el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  };

  // Clean empty optional strings to undefined so stored records stay tidy.
  const clean = (s?: string) => { const t = s?.trim(); return t ? t : undefined; };

  function buildTypeBlocks(): Pick<HubRecord, 'event' | 'resource' | 'research'> {
    if (f.type === 'event') {
      return {
        event: {
          start: f.event?.start ?? '', end: f.event?.end ?? '',
          venue: clean(f.event?.venue), isOnline: f.event?.isOnline || undefined,
          bookingUrl: clean(f.event?.bookingUrl), capacityNote: clean(f.event?.capacityNote),
        },
        resource: undefined, research: undefined,
      };
    }
    if (f.type === 'research_explainer') {
      return {
        research: {
          plainSummary: f.research?.plainSummary ?? '',
          researchers: clean(f.research?.researchers), department: clean(f.research?.department),
          paperUrl: clean(f.research?.paperUrl),
        },
        event: undefined, resource: undefined,
      };
    }
    return {
      resource: {
        externalUrl: clean(f.resource?.externalUrl), fileUrl: clean(f.resource?.fileUrl),
        fileLabel: clean(f.resource?.fileLabel), durationNote: clean(f.resource?.durationNote),
      },
      event: undefined, research: undefined,
    };
  }

  function commit(intent: SaveIntent) {
    const isDraft = intent === 'draft';
    setAttempted(isDraft ? 'draft' : 'full');
    const active = isDraft ? draftBlock : errors;
    const keys = FIELD_ORDER.filter(k => active[k]);
    if (keys.length) { focusField(keys[0]); return; }

    const now = new Date().toISOString();
    const blocks = buildTypeBlocks();
    const base = {
      ...f, ...blocks,
      body: clean(f.body),
      promoImage: clean(f.promoImage), promoImageAlt: clean(f.promoImageAlt), caption: clean(f.caption),
    };

    if (mode === 'create') {
      const to = isDraft ? 'draft' as const : 'submitted' as const;
      onSave({
        ...base,
        id: newRecordId(),
        status: to,
        createdAt: now, updatedAt: now,
        audit: [{ at: now, by: f.submitter.name || f.submitter.email || ADMIN_ACTOR, to, note: isDraft ? 'Saved as draft' : 'Submitted for review' }],
        engagement: { views: 0, downloads: 0, thumbsUp: 0, ratingSum: 0, ratingCount: 0 },
      }, intent);
    } else {
      // Edit preserves lifecycle/provenance; the parent applies any draft→queue
      // transition (so the audit trail is written server-side, not here).
      onSave({ ...base, updatedAt: now }, intent);
    }
  }

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImgError(null); setImgBusy(true); setPreviewBroken(false);
    try {
      const dataUrl = await fileToPreviewDataUrl(file);
      set({ promoImage: dataUrl });
      touch('promoImageAlt'); // nudge for alt text now there's an image
    } catch (err) {
      setImgError(err instanceof Error ? err.message : 'Couldn’t read that image.');
    } finally {
      setImgBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  const clearImage = () => { set({ promoImage: undefined }); setImgError(null); setPreviewBroken(false); };

  const usingUpload = isDataUrl(f.promoImage);
  const summaryKeys = FIELD_ORDER.filter(k => summary[k]);

  return (
    <form className="rform" onSubmit={e => { e.preventDefault(); commit(editingDraft || mode === 'create' ? 'submit' : 'save'); }} noValidate>
      {summaryKeys.length > 0 && (
        <div className="notice rform-summary" role="alert" aria-label="There are problems with the form">
          <strong>Please check the following:</strong>
          <ul>
            {summaryKeys.map(k => (
              <li key={k}>
                <button type="button" className="rform-summary__link" onClick={() => focusField(k)}>{summary[k]}</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <fieldset>
        <legend>The basics</legend>
        <div>
          <label htmlFor="rf-type">Type</label>
          <select id="rf-type" value={f.type} onChange={e => set({ type: e.target.value as RecordType })}>
            {RECORD_TYPE_ORDER.map(t => <option key={t} value={t}>{RECORD_TYPES[t].label}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="rf-title">Title</label>
          <input id="rf-title" type="text" value={f.title} onChange={e => set({ title: e.target.value })} onBlur={() => touch('title')} {...aria('title', 'rf-title')} />
          {renderErr('title', 'rf-title')}
        </div>
        <div>
          <label htmlFor="rf-summary">Short summary <span className="atable__meta">(shown on cards)</span></label>
          <textarea id="rf-summary" value={f.summary} onChange={e => set({ summary: e.target.value })} onBlur={() => touch('summary')} rows={2} {...aria('summary', 'rf-summary')} />
          {renderErr('summary', 'rf-summary')}
        </div>
        <div>
          <label htmlFor="rf-body">Full description <span className="atable__meta">(optional)</span></label>
          <textarea id="rf-body" value={f.body ?? ''} onChange={e => set({ body: e.target.value })} rows={4} />
        </div>
      </fieldset>

      <fieldset>
        <legend>Who it’s for &amp; tags</legend>
        <div id="rf-audiences-group" tabIndex={-1}>
          <span className="rform-label" style={{ fontWeight: 600, display: 'block', marginBottom: 'var(--s-2)' }}>Audiences</span>
          <div className="checkrow">
            {SUB_BRAND_ORDER.map(id => (
              <label key={id}><input type="checkbox" checked={f.audiences.includes(id)} onChange={() => toggle<SubBrand>('audiences', id)} {...aria('audiences', 'rf-audiences-group')} /> {SUB_BRANDS[id].label}</label>
            ))}
          </div>
          {renderErr('audiences', 'rf-audiences-group')}
        </div>
        <div>
          <span style={{ fontWeight: 600, display: 'block', marginBottom: 'var(--s-2)' }}>Age groups</span>
          <div className="checkrow">
            {AGE_GROUPS.map(a => (
              <label key={a.id}><input type="checkbox" checked={f.ageGroups.includes(a.id)} onChange={() => toggle<AgeGroupId>('ageGroups', a.id)} /> {a.label}</label>
            ))}
          </div>
        </div>
        <div>
          <span style={{ fontWeight: 600, display: 'block', marginBottom: 'var(--s-2)' }}>Subjects</span>
          <div className="checkrow">
            {SUBJECTS.map(s => (
              <label key={s.id}><input type="checkbox" checked={f.subjects.includes(s.id)} onChange={() => toggle<SubjectId>('subjects', s.id)} /> {s.label}</label>
            ))}
          </div>
        </div>
        <div className="checkrow">
          <label><input type="checkbox" checked={f.usefulForTeachers} onChange={e => set({ usefulForTeachers: e.target.checked })} /> Useful for teachers</label>
          <label><input type="checkbox" checked={f.featured} onChange={e => set({ featured: e.target.checked })} /> Feature on landing pages</label>
        </div>
      </fieldset>

      {/* Type-specific block */}
      {f.type === 'event' && (
        <fieldset>
          <legend>Event details</legend>
          <div className="row2">
            <div>
              <label htmlFor="rf-start">Starts</label>
              <input id="rf-start" type="datetime-local" value={isoToDatetimeLocal(f.event?.start ?? '')} onChange={e => setEvent({ start: inputToIso(e.target.value) })} onBlur={() => touch('eventStart')} {...aria('eventStart', 'rf-start')} />
              {renderErr('eventStart', 'rf-start')}
            </div>
            <div>
              <label htmlFor="rf-end">Ends</label>
              <input id="rf-end" type="datetime-local" value={isoToDatetimeLocal(f.event?.end ?? '')} onChange={e => setEvent({ end: inputToIso(e.target.value) })} onBlur={() => touch('eventEnd')} {...aria('eventEnd', 'rf-end')} />
              {renderErr('eventEnd', 'rf-end')}
            </div>
          </div>
          <div><label htmlFor="rf-venue">Venue</label><input id="rf-venue" type="text" value={f.event?.venue ?? ''} onChange={e => setEvent({ venue: e.target.value })} /></div>
          <div className="checkrow"><label><input type="checkbox" checked={f.event?.isOnline ?? false} onChange={e => setEvent({ isOnline: e.target.checked })} /> Online event</label></div>
          <div><label htmlFor="rf-booking">Booking link (we link out)</label><input id="rf-booking" type="url" value={f.event?.bookingUrl ?? ''} onChange={e => setEvent({ bookingUrl: e.target.value })} /></div>
          <div><label htmlFor="rf-cap">Booking note</label><input id="rf-cap" type="text" placeholder="e.g. Drop-in, no booking needed" value={f.event?.capacityNote ?? ''} onChange={e => setEvent({ capacityNote: e.target.value })} /></div>
        </fieldset>
      )}

      {f.type === 'research_explainer' && (
        <fieldset>
          <legend>Research explainer</legend>
          <div>
            <label htmlFor="rf-plain">In plain English</label>
            <textarea id="rf-plain" rows={2} value={f.research?.plainSummary ?? ''} onChange={e => setResearch({ plainSummary: e.target.value })} onBlur={() => touch('plainSummary')} {...aria('plainSummary', 'rf-plain')} />
            {renderErr('plainSummary', 'rf-plain')}
          </div>
          <div className="row2">
            <div><label htmlFor="rf-researchers">Researchers</label><input id="rf-researchers" type="text" value={f.research?.researchers ?? ''} onChange={e => setResearch({ researchers: e.target.value })} /></div>
            <div><label htmlFor="rf-dept">Department</label><input id="rf-dept" type="text" value={f.research?.department ?? ''} onChange={e => setResearch({ department: e.target.value })} /></div>
          </div>
          <div><label htmlFor="rf-paper">Paper / DOI link</label><input id="rf-paper" type="url" value={f.research?.paperUrl ?? ''} onChange={e => setResearch({ paperUrl: e.target.value })} /></div>
        </fieldset>
      )}

      {f.type !== 'event' && f.type !== 'research_explainer' && (
        <fieldset>
          <legend>Link &amp; file</legend>
          <div><label htmlFor="rf-ext">External link (we link out)</label><input id="rf-ext" type="url" value={f.resource?.externalUrl ?? ''} onChange={e => setResource({ externalUrl: e.target.value })} /></div>
          <div className="row2">
            <div><label htmlFor="rf-file">File link</label><input id="rf-file" type="url" value={f.resource?.fileUrl ?? ''} onChange={e => setResource({ fileUrl: e.target.value })} /></div>
            <div><label htmlFor="rf-filelabel">File label</label><input id="rf-filelabel" type="text" placeholder="e.g. PDF, 2.4 MB" value={f.resource?.fileLabel ?? ''} onChange={e => setResource({ fileLabel: e.target.value })} /></div>
          </div>
          <div><label htmlFor="rf-dur">Duration note</label><input id="rf-dur" type="text" placeholder="e.g. 12 min watch, 45 min activity" value={f.resource?.durationNote ?? ''} onChange={e => setResource({ durationNote: e.target.value })} /></div>
        </fieldset>
      )}

      <fieldset>
        <legend>Imagery &amp; dates</legend>
        <div>
          <label htmlFor="rf-img">Promo image path or URL</label>
          <input id="rf-img" type="text" placeholder="./brand/Volcano_HL.png"
            value={usingUpload ? '' : (f.promoImage ?? '')}
            disabled={usingUpload}
            onChange={e => { setPreviewBroken(false); set({ promoImage: e.target.value }); }} />
          {usingUpload && <span className="atable__meta">Using an uploaded image preview — clear it to type a path instead.</span>}
        </div>
        <div>
          <label htmlFor="rf-file-img">…or choose an image to preview</label>
          <input id="rf-file-img" ref={fileRef} type="file" accept="image/*" onChange={onPickFile} />
          <span className="atable__meta">Previewed in your browser only. In the live site this uploads to the media library; here we keep a small inline copy.</span>
          {imgBusy && <span className="atable__meta">Processing image…</span>}
          {imgError && <span className="field-error">{imgError}</span>}
        </div>
        {f.promoImage && (
          <div className="rform-preview">
            {previewBroken ? (
              <p className="atable__meta" style={{ margin: 0 }}>Can’t preview that path here — check it resolves under <code>/brand</code>. It may still work on the live site.</p>
            ) : (
              <img className="rform-preview__img" src={f.promoImage} alt={f.promoImageAlt || ''} onError={() => setPreviewBroken(true)} />
            )}
            <button type="button" className="abtn" onClick={clearImage}>Remove image</button>
          </div>
        )}
        <div>
          <label htmlFor="rf-alt">Image alt text {f.promoImage && <span className="atable__meta">(required with an image)</span>}</label>
          <input id="rf-alt" type="text" value={f.promoImageAlt ?? ''} onChange={e => set({ promoImageAlt: e.target.value })} onBlur={() => touch('promoImageAlt')} {...aria('promoImageAlt', 'rf-alt')} />
          {renderErr('promoImageAlt', 'rf-alt')}
        </div>
        <div className="row2">
          <div>
            <label htmlFor="rf-go">Go-live date</label>
            <input id="rf-go" type="date" value={isoToDateInput(f.goLiveDate)} onChange={e => set({ goLiveDate: inputToIso(e.target.value) })} onBlur={() => touch('goLiveDate')} {...aria('goLiveDate', 'rf-go')} />
            {renderErr('goLiveDate', 'rf-go')}
          </div>
          <div>
            <label htmlFor="rf-exp">Expiry date</label>
            <input id="rf-exp" type="date" value={isoToDateInput(f.expiryDate)} onChange={e => set({ expiryDate: inputToIso(e.target.value) })} onBlur={() => touch('expiryDate')} {...aria('expiryDate', 'rf-exp')} />
            {renderErr('expiryDate', 'rf-exp')}
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend>Submitter</legend>
        <div className="row2">
          <div>
            <label htmlFor="rf-sname">Name</label>
            <input id="rf-sname" type="text" value={f.submitter.name} onChange={e => setSubmitter({ name: e.target.value })} onBlur={() => touch('submitterName')} {...aria('submitterName', 'rf-sname')} />
            {renderErr('submitterName', 'rf-sname')}
          </div>
          <div>
            <label htmlFor="rf-semail">Email</label>
            <input id="rf-semail" type="email" value={f.submitter.email} onChange={e => setSubmitter({ email: e.target.value })} onBlur={() => touch('submitterEmail')} {...aria('submitterEmail', 'rf-semail')} />
            {renderErr('submitterEmail', 'rf-semail')}
          </div>
        </div>
        <div><label htmlFor="rf-sdept">Department</label><input id="rf-sdept" type="text" value={f.submitter.department ?? ''} onChange={e => setSubmitter({ department: e.target.value })} /></div>
      </fieldset>

      <div className="cluster">
        {(mode === 'create' || editingDraft) ? (
          <>
            <button type="button" className="btn btn--primary btn--lg" style={{ background: 'var(--c-hublab)', color: '#fff' }} onClick={() => commit('submit')}>
              Submit for review
            </button>
            <button type="button" className="btn btn--ghost" style={{ borderColor: 'var(--c-line)', color: 'var(--c-ink)' }} onClick={() => commit('draft')}>
              Save as draft
            </button>
          </>
        ) : (
          <button type="button" className="btn btn--primary btn--lg" style={{ background: 'var(--c-hublab)', color: '#fff' }} onClick={() => commit('save')}>
            Save changes
          </button>
        )}
        <button type="button" className="btn btn--ghost" style={{ borderColor: 'var(--c-line)', color: 'var(--c-ink)' }} onClick={onCancel}>Cancel</button>
        {(mode === 'create' || editingDraft) && <span className="atable__meta">Drafts stay private to you; submitting sends it to the moderation queue.</span>}
      </div>
    </form>
  );
}
