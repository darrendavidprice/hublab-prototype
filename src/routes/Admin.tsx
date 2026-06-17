import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, isPublic, daysToExpiry } from '../data/api';
import type { HubRecord, RecordStatus } from '../data/types';
import { RECORD_TYPES, SUB_BRANDS } from '../data/vocabularies';
import { StatusBadge, AuditTrail } from '../components/StatusBadge';
import { ADMIN_ACTOR, QUEUE_STATUSES } from '../lib/admin';
import { formatDateShort } from '../lib/format';
import { useDocumentTitle } from '../lib/useDocumentTitle';

type Tab = 'queue' | 'published' | 'expiry' | 'all';

export function Admin() {
  const nav = useNavigate();
  useDocumentTitle('Content admin');
  const [all, setAll] = useState<HubRecord[]>([]);
  const [tab, setTab] = useState<Tab>('queue');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [openAudit, setOpenAudit] = useState<string | null>(null);

  const refresh = useCallback(() => { api.list().then(setAll); }, []);
  useEffect(() => { refresh(); }, [refresh]);

  // Buckets
  const queue = useMemo(() => all.filter(r => QUEUE_STATUSES.includes(r.status))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt)), [all]);
  const published = useMemo(() => all.filter(r => r.status === 'live' || r.status === 'approved'), [all]);
  const expiringSoonList = useMemo(() => all.filter(r => isPublic(r) && daysToExpiry(r) >= 0 && daysToExpiry(r) <= 14), [all]);
  const expiredList = useMemo(() => all.filter(r => r.status === 'expired'), [all]);
  const expiryTab = useMemo(() => [...expiringSoonList, ...expiredList], [expiringSoonList, expiredList]);

  const liveCount = all.filter(r => r.status === 'live').length;

  // ---- Actions (all attributed to the admin actor; transition writes audit) ----
  const publicTarget = (r: HubRecord): RecordStatus => {
    const now = Date.now();
    return new Date(r.goLiveDate).getTime() <= now && now < new Date(r.expiryDate).getTime()
      ? 'live' : 'approved';
  };
  const after = (p: Promise<unknown>) => p.then(refresh);

  const approve = (r: HubRecord) => after(api.transition(r.id, publicTarget(r), ADMIN_ACTOR, notes[r.id] || undefined));
  const sendBack = (r: HubRecord) => {
    if (!notes[r.id]?.trim()) { alert('Add a note so the submitter knows what to change.'); return; }
    after(api.transition(r.id, 'needs_clarification', ADMIN_ACTOR, notes[r.id]));
  };
  const reject = (r: HubRecord) => after(api.transition(r.id, 'rejected', ADMIN_ACTOR, notes[r.id] || undefined));
  const unpublish = (r: HubRecord) => after(api.transition(r.id, 'unpublished', ADMIN_ACTOR, notes[r.id] || undefined));
  const republish = (r: HubRecord) => after(api.transition(r.id, publicTarget(r), ADMIN_ACTOR, 'Republished'));
  const makeLiveNow = (r: HubRecord) =>
    after(api.update(r.id, { goLiveDate: new Date().toISOString() }).then(() => api.transition(r.id, 'live', ADMIN_ACTOR, 'Brought forward to live')));
  const renew = (r: HubRecord) => {
    const exp = new Date(); exp.setFullYear(exp.getFullYear() + 1);
    after((async () => {
      await api.update(r.id, { expiryDate: exp.toISOString() });
      if (r.status === 'expired') await api.transition(r.id, 'live', ADMIN_ACTOR, 'Renewed for another year');
    })());
  };
  const submitForReview = (r: HubRecord) => after(api.transition(r.id, 'submitted', ADMIN_ACTOR, 'Submitted for review'));
  const featureToggle = (r: HubRecord) => after(api.update(r.id, { featured: !r.featured }));
  const del = (r: HubRecord) => { if (confirm(`Delete “${r.title}” for good? This can’t be undone.`)) after(api.remove(r.id)); };
  const resetDemo = () => { if (confirm('Restore the original demo content? Your changes will be lost.')) after(api.reset()); };

  const setNote = (id: string, v: string) => setNotes(n => ({ ...n, [id]: v }));

  const tabs: { id: Tab; label: string; n: number }[] = [
    { id: 'queue', label: 'Queue', n: queue.length },
    { id: 'published', label: 'Live & scheduled', n: published.length },
    { id: 'expiry', label: 'Expiry', n: expiryTab.length },
    { id: 'all', label: 'All content', n: all.length },
  ];

  return (
    <section className="admin">
      <div className="container admin__head">
        <p className="pill">Phase 4 · Internal</p>
        <div className="admin__toolbar">
          <h1 className="admin__title">Content admin</h1>
          <div className="cluster">
            <Link to="/admin/new" className="btn btn--primary" style={{ background: 'var(--c-hublab)', color: '#fff' }}>+ New submission</Link>
            <Link to="/admin/import" className="abtn">Import from spreadsheet</Link>
            <button type="button" className="abtn" onClick={resetDemo}>Reset demo data</button>
          </div>
        </div>
        <p style={{ color: '#5b5170', maxWidth: 'var(--maxw-text)' }}>
          The workflow behind the public site: review submissions, manage what’s live, and keep
          on top of expiry. Every status change is recorded in the item’s history.
        </p>
      </div>

      <div className="container">
        <div className="stats">
          <div className="stat"><div className="stat__n">{queue.length}</div><div className="stat__l">In queue</div></div>
          <div className="stat"><div className="stat__n">{liveCount}</div><div className="stat__l">Live now</div></div>
          <div className={`stat${expiringSoonList.length ? ' stat--alert' : ''}`}><div className="stat__n">{expiringSoonList.length}</div><div className="stat__l">Expiring soon</div></div>
          <div className={`stat${expiredList.length ? ' stat--alert' : ''}`}><div className="stat__n">{expiredList.length}</div><div className="stat__l">Expired</div></div>
        </div>

        <div className="tabs" role="tablist" aria-label="Admin sections" style={{ marginBottom: 'var(--s-5)' }}>
          {tabs.map(t => (
            <button key={t.id} role="tab" aria-selected={tab === t.id} className="tab" onClick={() => setTab(t.id)}>
              {t.label} ({t.n})
            </button>
          ))}
        </div>

        {/* QUEUE — moderation */}
        {tab === 'queue' && (
          <div style={{ display: 'grid', gap: 'var(--s-4)', paddingBottom: 'var(--s-8)' }}>
            {queue.length === 0 && <div className="empty"><h3>Queue’s clear</h3><p>No submissions waiting for review.</p></div>}
            {queue.map(r => (
              <div key={r.id} className="modcard">
                <div className="modcard__top">
                  <div>
                    <span className="atable__title">{r.title}</span>
                    <StatusBadge status={r.status} />
                  </div>
                  <span className="chip chip--type">{RECORD_TYPES[r.type].noun}</span>
                </div>
                <p className="modcard__sub">
                  {r.audiences.map(a => SUB_BRANDS[a].label).join(', ')} · from {r.submitter.name} ({r.submitter.email})
                  {r.submitter.department ? ` · ${r.submitter.department}` : ''}
                </p>
                <p style={{ margin: 0 }}>{r.summary}</p>
                {r.audit.length > 0 && (
                  <details>
                    <summary style={{ cursor: 'pointer', fontWeight: 600, fontSize: 'var(--fs-200)' }}>History</summary>
                    <div style={{ marginTop: 'var(--s-2)' }}><AuditTrail record={r} /></div>
                  </details>
                )}
                <label htmlFor={`note-${r.id}`} className="atable__meta">Note to submitter (required to send back)</label>
                <textarea id={`note-${r.id}`} className="modnote" rows={2} value={notes[r.id] ?? ''} onChange={e => setNote(r.id, e.target.value)} />
                <div className="modcard__actions">
                  <button className="abtn abtn--go" onClick={() => approve(r)}>Approve</button>
                  <button className="abtn" onClick={() => sendBack(r)}>Send back</button>
                  <button className="abtn abtn--danger" onClick={() => reject(r)}>Reject</button>
                  <button className="abtn" onClick={() => nav(`/admin/edit/${r.id}`)}>Edit</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* OTHER TABS — management tables */}
        {tab !== 'queue' && (
          <div style={{ paddingBottom: 'var(--s-8)' }}>
            <ManageTable
              rows={tab === 'published' ? published : tab === 'expiry' ? expiryTab : all}
              empty={tab === 'expiry' ? 'Nothing expiring and nothing expired. ' : 'Nothing here.'}
              openAudit={openAudit} setOpenAudit={setOpenAudit}
              actions={{
                approve, sendBack: undefined, unpublish, republish, makeLiveNow, renew, featureToggle, del, submitForReview,
              }}
              onEdit={(r) => nav(`/admin/edit/${r.id}`)}
            />
          </div>
        )}
      </div>
    </section>
  );
}

/* ---- Management table used by the non-queue tabs ---- */
function ManageTable({
  rows, empty, actions, onEdit, openAudit, setOpenAudit,
}: {
  rows: HubRecord[];
  empty: string;
  onEdit: (r: HubRecord) => void;
  openAudit: string | null;
  setOpenAudit: (id: string | null) => void;
  actions: {
    approve: (r: HubRecord) => void;
    sendBack?: (r: HubRecord) => void;
    unpublish: (r: HubRecord) => void;
    republish: (r: HubRecord) => void;
    makeLiveNow: (r: HubRecord) => void;
    renew: (r: HubRecord) => void;
    featureToggle: (r: HubRecord) => void;
    del: (r: HubRecord) => void;
    submitForReview: (r: HubRecord) => void;
  };
}) {
  if (rows.length === 0) return <div className="empty"><h3>All clear</h3><p>{empty}</p></div>;
  return (
    <table className="atable">
      <thead>
        <tr><th>Title</th><th>Status</th><th>Dates</th><th>Actions</th></tr>
      </thead>
      <tbody>
        {rows.map(r => {
          const dte = daysToExpiry(r);
          return (
            <tr key={r.id}>
              <td>
                <Link to={`/record/${r.id}`} className="atable__title">{r.title}</Link>
                <div className="atable__meta">{RECORD_TYPES[r.type].noun} · {r.audiences.map(a => SUB_BRANDS[a].label).join(', ')}{r.featured ? ' · ★ featured' : ''}</div>
              </td>
              <td><StatusBadge status={r.status} /></td>
              <td className="atable__meta">
                Live {formatDateShort(r.goLiveDate)}<br />
                Ends {formatDateShort(r.expiryDate)}{dte >= 0 && dte <= 14 ? ` (in ${dte}d)` : ''}
              </td>
              <td>
                <div className="atable__actions">
                  {r.status === 'draft' && <button className="abtn abtn--go" onClick={() => actions.submitForReview(r)}>Submit for review</button>}
                  {r.status === 'live' && <button className="abtn abtn--warn" onClick={() => actions.unpublish(r)}>Unpublish</button>}
                  {r.status === 'approved' && <button className="abtn abtn--go" onClick={() => actions.makeLiveNow(r)}>Make live</button>}
                  {r.status === 'unpublished' && <button className="abtn abtn--go" onClick={() => actions.republish(r)}>Republish</button>}
                  {(r.status === 'expired' || (isPublic(r) && dte >= 0 && dte <= 14)) && <button className="abtn abtn--go" onClick={() => actions.renew(r)}>Renew</button>}
                  {(r.status === 'submitted' || r.status === 'needs_clarification') && <button className="abtn abtn--go" onClick={() => actions.approve(r)}>Approve</button>}
                  <button className="abtn" onClick={() => actions.featureToggle(r)}>{r.featured ? 'Unfeature' : 'Feature'}</button>
                  <button className="abtn" onClick={() => onEdit(r)}>Edit</button>
                  <button className="abtn" onClick={() => setOpenAudit(openAudit === r.id ? null : r.id)} aria-expanded={openAudit === r.id}>History</button>
                  <button className="abtn abtn--danger" onClick={() => actions.del(r)}>Delete</button>
                </div>
                {openAudit === r.id && <div style={{ marginTop: 'var(--s-3)' }}><AuditTrail record={r} /></div>}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
