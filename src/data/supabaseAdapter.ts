import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { DataSource } from './api';
import { recordMatchesQuery } from './api';
import type { HubRecord, RecordQuery, RecordStatus, AuditEntry } from './types';

/* ============================================================
   Supabase adapter — a real-backend implementation of the same
   DataSource interface the prototype uses. Activate it by setting
   VITE_DATA_SOURCE=supabase plus VITE_SUPABASE_URL / _ANON_KEY.
   The schema, RLS policies and the transition_record() RPC this
   relies on are in `supabase/schema.sql`. No UI changes needed.

   Notes / production TODOs:
   - query() fetches the rows the caller is allowed to see (RLS scopes
     anonymous users to live records) and then applies the SAME
     recordMatchesQuery() used by the local adapter, so behaviour is
     identical. For large datasets, push the predicates into SQL/Postgres
     views instead of filtering client-side.
   - Public engagement writes (view/thumb/rating from anonymous visitors)
     should go through a SECURITY DEFINER RPC (`increment_engagement` in
     the schema) rather than a broad UPDATE policy; update() here assumes a
     signed-in moderator. Wire EngagementBar to that RPC when going live.
   ============================================================ */

const TABLE = 'records';
const NESTED = '*, audit_entries(*)';

/* ---------- Row <-> HubRecord mapping (snake_case <-> camelCase) ---------- */

interface AuditRow { at: string; by: string; from_status: RecordStatus | null; to_status: RecordStatus; note: string | null; }

function mapAudit(rows: AuditRow[] | null | undefined): AuditEntry[] {
  return (rows ?? [])
    .map(a => ({ at: a.at, by: a.by, from: a.from_status ?? undefined, to: a.to_status, note: a.note ?? undefined }))
    .sort((x, y) => x.at.localeCompare(y.at));
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapRow(row: any): HubRecord {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    summary: row.summary,
    body: row.body ?? undefined,
    audiences: row.audiences ?? [],
    ageGroups: row.age_groups ?? [],
    subjects: row.subjects ?? [],
    usefulForTeachers: !!row.useful_for_teachers,
    featured: !!row.featured,
    promoImage: row.promo_image ?? undefined,
    promoImageAlt: row.promo_image_alt ?? undefined,
    caption: row.caption ?? undefined,
    status: row.status,
    goLiveDate: row.go_live_date,
    expiryDate: row.expiry_date,
    event: row.event ?? undefined,
    resource: row.resource ?? undefined,
    research: row.research ?? undefined,
    submitter: row.submitter,
    engagement: row.engagement,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    audit: mapAudit(row.audit_entries),
  };
}

/** Map a (partial) HubRecord to DB columns. Only defined keys are included,
 *  so it works for both full inserts and partial updates. `audit` is handled
 *  separately (its own table) and never written as a column. */
function toRow(r: Partial<HubRecord>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const set = (k: string, v: unknown) => { if (v !== undefined) out[k] = v; };
  set('id', r.id);
  set('type', r.type);
  set('title', r.title);
  set('summary', r.summary);
  set('body', r.body ?? null);
  set('audiences', r.audiences);
  set('age_groups', r.ageGroups);
  set('subjects', r.subjects);
  set('useful_for_teachers', r.usefulForTeachers);
  set('featured', r.featured);
  set('promo_image', r.promoImage ?? null);
  set('promo_image_alt', r.promoImageAlt ?? null);
  set('caption', r.caption ?? null);
  set('status', r.status);
  set('go_live_date', r.goLiveDate);
  set('expiry_date', r.expiryDate);
  set('event', r.event ?? null);
  set('resource', r.resource ?? null);
  set('research', r.research ?? null);
  set('submitter', r.submitter);
  set('engagement', r.engagement);
  set('created_at', r.createdAt);
  set('updated_at', r.updatedAt);
  return out;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/* ---------- Adapter ---------- */

class SupabaseAdapter implements DataSource {
  constructor(private db: SupabaseClient) {}

  private async fetchAll(): Promise<HubRecord[]> {
    const { data, error } = await this.db.from(TABLE).select(NESTED);
    if (error) throw error;
    return (data ?? []).map(mapRow);
  }

  async list() { return this.fetchAll(); }

  async get(id: string) {
    const { data, error } = await this.db.from(TABLE).select(NESTED).eq('id', id).maybeSingle();
    if (error) throw error;
    return data ? mapRow(data) : undefined;
  }

  async query(q: RecordQuery) {
    // RLS already limits what anonymous callers receive; we then apply the
    // identical matcher used by the local adapter for behaviour parity.
    const all = await this.fetchAll();
    return all.filter(r => recordMatchesQuery(r, q));
  }

  async create(rec: HubRecord) {
    const { error: insErr } = await this.db.from(TABLE).insert(toRow(rec));
    if (insErr) throw insErr;
    if (rec.audit.length) {
      const rows = rec.audit.map(a => ({
        record_id: rec.id, at: a.at, by: a.by,
        from_status: a.from ?? null, to_status: a.to, note: a.note ?? null,
      }));
      const { error: audErr } = await this.db.from('audit_entries').insert(rows);
      if (audErr) throw audErr;
    }
    return (await this.get(rec.id))!;
  }

  async update(id: string, patch: Partial<HubRecord>) {
    const row = toRow({ ...patch, id: undefined, updatedAt: new Date().toISOString() });
    const { error } = await this.db.from(TABLE).update(row).eq('id', id);
    if (error) throw error;
    return (await this.get(id))!;
  }

  async transition(id: string, to: RecordStatus, by: string, note?: string) {
    // Atomic status change + audit insert, server-side (see schema.sql).
    const { error } = await this.db.rpc('transition_record', {
      p_id: id, p_to: to, p_by: by, p_note: note ?? null,
    });
    if (error) throw error;
    return (await this.get(id))!;
  }

  async remove(id: string) {
    const { error } = await this.db.from(TABLE).delete().eq('id', id);
    if (error) throw error;
  }

  async reset() {
    // Re-seeding is a local-demo affordance only; it's a deliberate no-op
    // against a real database so the admin "Reset demo data" button can't
    // wipe production. Seed via supabase/schema.sql + an import instead.
    console.warn('reset() is a no-op on the Supabase backend.');
  }
}

/** Create the Supabase-backed DataSource. Throws early with a clear message if
 *  the env vars are missing, so misconfiguration fails loudly at startup. */
export function createSupabaseAdapter(): DataSource {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      'VITE_DATA_SOURCE=supabase but VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not set. ' +
      'Add them to your environment (see .env.example).',
    );
  }
  return new SupabaseAdapter(createClient(url, key));
}
