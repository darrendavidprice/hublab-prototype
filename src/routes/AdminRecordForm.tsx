import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../data/api';
import type { HubRecord } from '../data/types';
import { RecordForm } from '../components/RecordForm';
import { SubmissionConfirmation } from '../components/SubmissionConfirmation';
import { blankRecord, ADMIN_ACTOR, type SaveIntent } from '../lib/admin';
import { useDocumentTitle } from '../lib/useDocumentTitle';

/** Hosts the submission/edit form. `/admin/new` creates; `/admin/edit/:id`
 *  loads an existing record to edit. On save it routes through the data layer
 *  (create or update, plus any draft→queue transition) and then either shows a
 *  confirmation summary (new submissions and drafts) or returns to the admin
 *  dashboard (plain content edits). */
export function AdminRecordForm() {
  const { id } = useParams();
  const nav = useNavigate();
  const mode: 'create' | 'edit' = id ? 'edit' : 'create';
  useDocumentTitle(mode === 'create' ? 'New submission' : 'Edit content');

  const [initial, setInitial] = useState<HubRecord | null>(id ? null : blankRecord());
  const [missing, setMissing] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [result, setResult] = useState<{ record: HubRecord; intent: 'submit' | 'draft' } | null>(null);

  useEffect(() => {
    if (!id) return;
    api.get(id).then(r => { if (r) setInitial(r); else setMissing(true); });
  }, [id]);

  const save = async (rec: HubRecord, intent: SaveIntent) => {
    const wasDraft = initial?.status === 'draft';
    if (mode === 'create') {
      await api.create(rec);
    } else {
      await api.update(rec.id, rec);
      // Promote a draft into the moderation queue with a proper audit entry.
      if (intent === 'submit' && wasDraft) {
        await api.transition(rec.id, 'submitted', rec.submitter.name || ADMIN_ACTOR, 'Submitted for review');
      }
    }
    const showConfirm = mode === 'create' || wasDraft;
    if (showConfirm) {
      setResult({ record: { ...rec, status: intent === 'draft' ? 'draft' : 'submitted' }, intent: intent === 'draft' ? 'draft' : 'submit' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      nav('/admin');
    }
  };

  const startAnother = () => {
    setResult(null);
    setInitial(blankRecord());
    setMissing(false);
    setFormKey(k => k + 1);
    if (id) nav('/admin/new');
  };

  const heading = result
    ? (result.intent === 'draft' ? 'Draft saved' : 'Submission received')
    : mode === 'create' ? 'Submit something new' : initial?.title ?? 'Edit';

  return (
    <section className="admin">
      <div className="container admin__head">
        <p className="pill">{mode === 'create' ? 'New submission' : 'Edit content'}</p>
        <h1 className="admin__title">{heading}</h1>
        {!result && (
          <p style={{ color: '#5b5170', maxWidth: 'var(--maxw-text)' }}>
            {mode === 'create'
              ? 'In the real site this is the @manchester self-service form. Fields mirror the data model so it’s a drop-in later. You can save a draft and finish later, or submit straight to the moderation queue.'
              : 'Editing changes the content only — it doesn’t change the item’s status or history.'}
          </p>
        )}
      </div>
      <div className="container" style={{ paddingBottom: 'var(--s-8)' }}>
        {result ? (
          <SubmissionConfirmation record={result.record} intent={result.intent} onAnother={startAnother} onDone={() => nav('/admin')} />
        ) : missing ? (
          <div className="empty"><h3>Not found</h3><p>That item doesn’t exist.</p></div>
        ) : !initial ? (
          <p>Loading…</p>
        ) : (
          <RecordForm key={formKey} initial={initial} mode={mode} onSave={save} onCancel={() => nav('/admin')} />
        )}
      </div>
    </section>
  );
}
