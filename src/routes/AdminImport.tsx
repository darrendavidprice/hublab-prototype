import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../data/api';
import type { HubRecord, RecordStatus } from '../data/types';
import { SUB_BRANDS, RECORD_TYPES } from '../data/vocabularies';
import { ADMIN_ACTOR } from '../lib/admin';
import { downloadText } from '../lib/ics';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import {
  IMPORT_FIELDS, type ImportField, type ColumnMap,
  parseDelimited, looksLikeXlsx, autoMap, buildRow,
  buildTemplateCsv, buildLegendCsv, norm, MAX_ROWS, MAX_BYTES,
} from '../lib/import';

type Step = 'input' | 'map' | 'review' | 'done';

const REQUIRED_ALWAYS = IMPORT_FIELDS.filter(f => f.required === 'always');

/** Canonical label for an enum value so the <select> stays controlled even if
 *  the file used an id or alternative casing. */
function enumDisplay(value: string, field: ImportField): string {
  if (!field.vocab) return value;
  const hit = field.vocab.find(v => norm(v.id) === norm(value) || norm(v.label) === norm(value));
  return hit ? hit.label : '';
}

function FieldInput({ field, value, onChange, invalid, describedBy }: {
  field: ImportField; value: string; invalid: boolean; describedBy?: string;
  onChange: (v: string) => void;
}) {
  const common = {
    value: field.kind === 'enum' ? enumDisplay(value, field) : value,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => onChange(e.target.value),
    'aria-invalid': invalid || undefined,
    'aria-describedby': describedBy,
  };
  if (field.kind === 'longtext') return <textarea rows={2} {...common} />;
  if (field.kind === 'bool') {
    return <select {...common}><option value="">—</option><option value="Yes">Yes</option><option value="No">No</option></select>;
  }
  if (field.kind === 'enum' && field.vocab) {
    return (
      <select {...common}>
        <option value="">—</option>
        {field.vocab.map(v => <option key={v.id} value={v.label}>{v.label}</option>)}
      </select>
    );
  }
  return <input type="text" placeholder={field.example || undefined} {...common} />;
}

export function AdminImport() {
  useDocumentTitle('Import records');

  const [step, setStep] = useState<Step>('input');
  const [raw, setRaw] = useState('');
  const [fileName, setFileName] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);
  const [xlsxNotice, setXlsxNotice] = useState(false);

  const [headers, setHeaders] = useState<string[]>([]);
  const [colMap, setColMap] = useState<ColumnMap>({});
  const [truncated, setTruncated] = useState(false);

  // Review rows: editable string values keyed by field.key.
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [openRow, setOpenRow] = useState<number | null>(null);

  const [importStatus, setImportStatus] = useState<RecordStatus>('submitted');
  const [dedupe, setDedupe] = useState(true);
  const [committing, setCommitting] = useState(false);
  const [result, setResult] = useState<{ created: number; skipped: number } | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);

  /* ---- Step 1: input ---- */
  async function onFile(file: File | undefined) {
    setInputError(null); setXlsxNotice(false);
    if (!file) return;
    if (looksLikeXlsx(file.name)) { setXlsxNotice(true); setFileName(file.name); return; }
    if (file.size > MAX_BYTES) { setInputError('That file is over 2 MB. Split it into smaller batches.'); return; }
    const text = await file.text();
    setFileName(file.name);
    setRaw(text);
  }

  function toMapping() {
    setInputError(null);
    const grid = parseDelimited(raw);
    if (grid.length < 2) { setInputError('I couldn’t find a header row and at least one data row.'); return; }
    const hdrs = grid[0].map(h => h.trim());
    let data = grid.slice(1);
    setTruncated(data.length > MAX_ROWS);
    data = data.slice(0, MAX_ROWS);
    const map = autoMap(hdrs);
    setHeaders(hdrs);
    setColMap(map);
    // Stash data rows on the headers step; build editable rows when entering review.
    setRows(data.map(r => {
      const v: Record<string, string> = {};
      for (const f of IMPORT_FIELDS) { const ci = map[f.key]; if (ci != null) v[f.key] = (r[ci] ?? '').trim(); }
      return v;
    }));
    setStep('map');
  }

  /* ---- Step 2: mapping (rebuild row values when the map changes) ---- */
  const dataGrid = useMemo(() => {
    const grid = parseDelimited(raw);
    return grid.slice(1, 1 + MAX_ROWS);
  }, [raw]);

  function setMapping(key: string, colIndex: number) {
    const next: ColumnMap = { ...colMap };
    if (colIndex < 0) delete next[key]; else next[key] = colIndex;
    setColMap(next);
    setRows(dataGrid.map(r => {
      const v: Record<string, string> = {};
      for (const f of IMPORT_FIELDS) { const ci = next[f.key]; if (ci != null) v[f.key] = (r[ci] ?? '').trim(); }
      return v;
    }));
  }

  const unmappedRequired = REQUIRED_ALWAYS.filter(f => colMap[f.key] == null);

  /* ---- Step 3: review ---- */
  const built = useMemo(() => rows.map(buildRow), [rows]);
  const readyFlags = built.map(b => Object.keys(b.errors).length === 0);
  const readyCount = readyFlags.filter(Boolean).length;
  const needsCount = rows.length - readyCount;

  function editCell(rowIdx: number, key: string, value: string) {
    setRows(rs => rs.map((r, i) => (i === rowIdx ? { ...r, [key]: value } : r)));
  }

  async function commit() {
    setCommitting(true);
    const existing = await api.list();
    const seen = new Set(existing.map(r => norm(r.title)));
    let created = 0, skipped = 0;
    for (let i = 0; i < built.length; i++) {
      if (!readyFlags[i]) continue;
      const rec: HubRecord = built[i].record;
      if (dedupe && seen.has(norm(rec.title))) { skipped++; continue; }
      const now = new Date().toISOString();
      rec.status = importStatus;
      rec.createdAt = now; rec.updatedAt = now;
      rec.audit = [{ at: now, by: ADMIN_ACTOR, to: importStatus, note: `Bulk imported by ${ADMIN_ACTOR}` }];
      await api.create(rec);
      seen.add(norm(rec.title));
      created++;
    }
    setResult({ created, skipped });
    setCommitting(false);
    setStep('done');
  }

  /* ---- Render ---- */
  return (
    <section className="admin import">
      <div className="container admin__head">
        <p className="pill">Phase 4 · Internal</p>
        <div className="admin__toolbar">
          <h1 className="admin__title">Import records</h1>
          <Link to="/admin" className="abtn">← Back to admin</Link>
        </div>
        <p style={{ color: '#5b5170', maxWidth: 'var(--maxw-text)' }}>
          Add several records at once from a spreadsheet — the same intake the Microsoft 365 Form
          feeds. Nothing goes live straight away: everything lands in the moderation queue for review.
        </p>
        <ol className="import-steps" aria-label="Import steps">
          {(['input', 'map', 'review', 'done'] as Step[]).map((s, i) => (
            <li key={s} aria-current={step === s ? 'step' : undefined}
                className={`import-steps__item${step === s ? ' is-current' : ''}`}>
              <span className="import-steps__n">{i + 1}</span>
              {{ input: 'Add data', map: 'Match columns', review: 'Review', done: 'Done' }[s]}
            </li>
          ))}
        </ol>
      </div>

      <div className="container" style={{ paddingBottom: 'var(--s-8)' }}>
        {/* STEP 1 — INPUT */}
        {step === 'input' && (
          <div className="import-panel">
            <div className="import-tpl">
              <h2>1. Start from the template</h2>
              <p>Download the template, fill a row per record, and save as CSV. The legend lists every
                column and the exact values the controlled fields accept.</p>
              <div className="cluster">
                <button type="button" className="btn btn--primary" style={{ background: 'var(--c-hublab)', color: '#fff' }}
                        onClick={() => downloadText('hublab-import-template.csv', buildTemplateCsv(), 'text/csv')}>
                  Download CSV template
                </button>
                <button type="button" className="abtn"
                        onClick={() => downloadText('hublab-import-legend.csv', buildLegendCsv(), 'text/csv')}>
                  Download field legend
                </button>
              </div>
            </div>

            <div className="import-upload">
              <h2>2. Add your data</h2>
              <div className="field">
                <label htmlFor="imp-file">Upload a CSV or tab-separated file</label>
                <input ref={fileRef} id="imp-file" type="file" accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values"
                       onChange={e => onFile(e.target.files?.[0])} />
                {fileName && !xlsxNotice && <p className="atable__meta">Loaded: {fileName}</p>}
              </div>
              {xlsxNotice && (
                <p className="import-note" role="status">
                  That looks like an Excel workbook. In Excel choose <strong>File → Save As → CSV</strong> and
                  upload that. (The live site will accept .xlsx directly — it’s parsed on the server there.)
                </p>
              )}
              <p className="atable__meta" style={{ textAlign: 'center', margin: 'var(--s-3) 0' }}>— or paste rows —</p>
              <div className="field">
                <label htmlFor="imp-paste">Paste from a spreadsheet</label>
                <textarea id="imp-paste" className="modnote" rows={5}
                          placeholder="Paste rows including the header line…"
                          value={raw} onChange={e => { setRaw(e.target.value); setFileName(''); setXlsxNotice(false); }} />
              </div>
              {inputError && <p className="field-error" role="alert">{inputError}</p>}
              <div className="cluster" style={{ marginTop: 'var(--s-4)' }}>
                <button type="button" className="btn btn--primary" disabled={!raw.trim()}
                        style={{ background: 'var(--c-hublab)', color: '#fff', opacity: raw.trim() ? 1 : 0.5 }}
                        onClick={toMapping}>
                  Continue to matching
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2 — MAP */}
        {step === 'map' && (
          <div className="import-panel">
            <h2>Match your columns to HubLab fields</h2>
            <p>We matched these automatically from your headers. Adjust any that are wrong; leave a field
              on <em>— ignore —</em> if your file doesn’t have it.</p>
            {unmappedRequired.length > 0 && (
              <p className="import-note import-note--warn" role="status">
                Still needed: {unmappedRequired.map(f => f.header).join(', ')}. Match these before continuing.
              </p>
            )}
            <div className="import-maplist">
              {IMPORT_FIELDS.map(f => (
                <div key={f.key} className="import-maprow">
                  <label htmlFor={`map-${f.key}`}>
                    {f.header}{f.required === 'always' && <span aria-hidden="true" className="req">*</span>}
                    <span className="atable__meta"> {f.help}</span>
                  </label>
                  <select id={`map-${f.key}`} value={colMap[f.key] ?? -1}
                          onChange={e => setMapping(f.key, Number(e.target.value))}>
                    <option value={-1}>— ignore —</option>
                    {headers.map((h, i) => <option key={i} value={i}>{h || `Column ${i + 1}`}</option>)}
                  </select>
                </div>
              ))}
            </div>
            <div className="cluster" style={{ marginTop: 'var(--s-5)' }}>
              <button type="button" className="abtn" onClick={() => setStep('input')}>← Back</button>
              <button type="button" className="btn btn--primary" disabled={unmappedRequired.length > 0}
                      style={{ background: 'var(--c-hublab)', color: '#fff', opacity: unmappedRequired.length ? 0.5 : 1 }}
                      onClick={() => { setStep('review'); setOpenRow(null); }}>
                Review {rows.length} {rows.length === 1 ? 'row' : 'rows'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 — REVIEW */}
        {step === 'review' && (
          <div className="import-panel">
            {truncated && (
              <p className="import-note import-note--warn">Only the first {MAX_ROWS} rows are shown — import in batches.</p>
            )}
            <div className="import-reviewbar">
              <p className="results__count" aria-live="polite">
                <strong>{readyCount}</strong> ready · <strong>{needsCount}</strong> need fixing · {rows.length} total
              </p>
              <div className="import-commit">
                <fieldset className="import-statusgroup">
                  <legend className="atable__meta">Import as</legend>
                  <label className="checkrow"><input type="radio" name="impstatus" checked={importStatus === 'submitted'}
                    onChange={() => setImportStatus('submitted')} /> Send to queue</label>
                  <label className="checkrow"><input type="radio" name="impstatus" checked={importStatus === 'draft'}
                    onChange={() => setImportStatus('draft')} /> Keep as drafts</label>
                </fieldset>
                <label className="checkrow"><input type="checkbox" checked={dedupe}
                  onChange={() => setDedupe(d => !d)} /> Skip titles that already exist</label>
              </div>
            </div>

            <ul className="import-rows">
              {built.map((b, i) => {
                const errs = Object.keys(b.errors);
                const ok = errs.length === 0;
                const isOpen = openRow === i;
                return (
                  <li key={i} className={`import-row${ok ? '' : ' import-row--bad'}`}>
                    <div className="import-row__head">
                      <span className={`statuschip ${ok ? 'is-ready' : 'is-bad'}`}>{ok ? 'Ready' : 'Needs fixing'}</span>
                      <span className="atable__title">{b.record.title || <em>(no title)</em>}</span>
                      <span className="atable__meta">
                        {RECORD_TYPES[b.record.type]?.noun}
                        {b.record.audiences.length ? ` · ${b.record.audiences.map(a => SUB_BRANDS[a].label).join(', ')}` : ''}
                      </span>
                      <button type="button" className="abtn" aria-expanded={isOpen}
                              onClick={() => setOpenRow(isOpen ? null : i)}>
                        {isOpen ? 'Close' : ok ? 'Edit' : 'Fix'}
                      </button>
                    </div>

                    {/* Errored fields are always shown so they can be fixed in place. */}
                    {!ok && !isOpen && (
                      <div className="import-fixes">
                        {errs.map(key => {
                          const f = IMPORT_FIELDS.find(x => x.key === key);
                          if (!f) return <p key={key} className="field-error">{b.errors[key]}</p>;
                          const eid = `e-${i}-${key.replace(/\W/g, '')}`;
                          return (
                            <div key={key} className="field">
                              <label htmlFor={eid}>{f.header}</label>
                              <FieldInput field={f} value={rows[i][key] ?? ''} invalid describedBy={`${eid}-err`}
                                          onChange={v => editCell(i, key, v)} />
                              <span className="field-error" id={`${eid}-err`}>{b.errors[key]}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Full editor for any field on this row. */}
                    {isOpen && (
                      <div className="import-editall">
                        {IMPORT_FIELDS.filter(f => colMap[f.key] != null || b.errors[f.key]).map(f => {
                          const eid = `f-${i}-${f.key.replace(/\W/g, '')}`;
                          const err = b.errors[f.key];
                          return (
                            <div key={f.key} className="field">
                              <label htmlFor={eid}>{f.header}</label>
                              <FieldInput field={f} value={rows[i][f.key] ?? ''} invalid={!!err}
                                          describedBy={err ? `${eid}-err` : undefined}
                                          onChange={v => editCell(i, f.key, v)} />
                              {err && <span className="field-error" id={`${eid}-err`}>{err}</span>}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>

            <div className="cluster" style={{ marginTop: 'var(--s-5)' }}>
              <button type="button" className="abtn" onClick={() => setStep('map')}>← Back</button>
              <button type="button" className="btn btn--primary" disabled={readyCount === 0 || committing}
                      style={{ background: 'var(--c-hublab)', color: '#fff', opacity: readyCount && !committing ? 1 : 0.5 }}
                      onClick={commit}>
                {committing ? 'Importing…' : `Import ${readyCount} ready ${readyCount === 1 ? 'record' : 'records'}`}
              </button>
            </div>
          </div>
        )}

        {/* STEP 4 — DONE */}
        {step === 'done' && result && (
          <div className="import-panel">
            <div className="empty">
              <h3>Imported {result.created} {result.created === 1 ? 'record' : 'records'}</h3>
              <p>
                {importStatus === 'submitted' ? 'They’re in the moderation queue for review.' : 'They’re saved as drafts.'}
                {result.skipped > 0 && ` ${result.skipped} ${result.skipped === 1 ? 'row was' : 'rows were'} skipped as duplicates.`}
              </p>
              <div className="empty__actions">
                <Link className="btn btn--primary" to="/admin">Go to {importStatus === 'submitted' ? 'the queue' : 'admin'}</Link>
                <button type="button" className="linkbtn" onClick={() => {
                  setStep('input'); setRaw(''); setFileName(''); setRows([]); setHeaders([]);
                  setColMap({}); setResult(null); setXlsxNotice(false);
                }}>Import more</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
