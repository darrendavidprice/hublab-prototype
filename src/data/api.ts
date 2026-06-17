import type { HubRecord, RecordQuery, RecordStatus, SubBrand } from './types';
import { SEED_RECORDS } from './seed';
import { createSupabaseAdapter } from './supabaseAdapter';

/* ============================================================
   Data layer.

   The whole app talks to `api` (a DataSource). Today that's the
   LocalStorageAdapter below — seed content + browser persistence,
   so the prototype runs with zero backend. For a real pilot/prod
   you implement the SAME DataSource interface against Supabase or
   the WordPress REST API and swap the one line at the bottom.
   Nothing in the UI changes.
   ============================================================ */

export interface DataSource {
  list(): Promise<HubRecord[]>;
  get(id: string): Promise<HubRecord | undefined>;
  query(q: RecordQuery): Promise<HubRecord[]>;
  create(rec: HubRecord): Promise<HubRecord>;
  update(id: string, patch: Partial<HubRecord>): Promise<HubRecord>;
  transition(id: string, to: RecordStatus, by: string, note?: string): Promise<HubRecord>;
  remove(id: string): Promise<void>;
  reset(): Promise<void>;          // restore seed content (handy for demos)
}

/* ---------- Lifecycle helpers (shared by any adapter) ---------- */

/** Is the record publicly visible right now? Drives all public views. */
export function isPublic(r: HubRecord, at: Date = new Date()): boolean {
  if (r.status === 'unpublished' || r.status === 'expired'
    || r.status === 'rejected' || r.status === 'draft'
    || r.status === 'submitted' || r.status === 'needs_clarification') {
    return false;
  }
  const go = new Date(r.goLiveDate).getTime();
  const exp = new Date(r.expiryDate).getTime();
  const t = at.getTime();
  return go <= t && t < exp;
}

/** Days until expiry (negative if already past). */
export function daysToExpiry(r: HubRecord, at: Date = new Date()): number {
  return Math.ceil((new Date(r.expiryDate).getTime() - at.getTime()) / 86400000);
}

/** Records within `withinDays` of expiry — the pre-expiry reminder set. */
export function expiringSoon(records: HubRecord[], withinDays = 14): HubRecord[] {
  return records.filter(r => isPublic(r) && daysToExpiry(r) <= withinDays && daysToExpiry(r) >= 0);
}

/** Average star rating (0–5), or null when nobody has rated yet. Derived from
 *  the engagement counters so any adapter gets the same maths for free. */
export function ratingAverage(r: HubRecord): number | null {
  if (!r.engagement.ratingCount) return null;
  return r.engagement.ratingSum / r.engagement.ratingCount;
}

/** Does a record satisfy a query? Shared by every adapter so filtering
 *  behaviour is identical regardless of backend. */
export function recordMatchesQuery(r: HubRecord, q: RecordQuery): boolean {
  if (q.publicOnly !== false && !isPublic(r)) return false;
  if (q.subBrand && !r.audiences.includes(q.subBrand)) return false;
  if (q.audiences?.length && !q.audiences.some(a => r.audiences.includes(a))) return false;
  if (q.ageGroups?.length && !q.ageGroups.some(a => r.ageGroups.includes(a))) return false;
  if (q.subjects?.length && !q.subjects.some(s => r.subjects.includes(s))) return false;
  if (q.types?.length && !q.types.includes(r.type)) return false;
  if (q.usefulForTeachers && !r.usefulForTeachers) return false;
  if (q.featuredOnly && !r.featured) return false;
  if (q.text) {
    const hay = (r.title + ' ' + r.summary).toLowerCase();
    if (!hay.includes(q.text.toLowerCase())) return false;
  }
  if (q.eventsBetween) {
    if (r.type !== 'event' || !r.event) return false;
    const s = new Date(r.event.start).getTime();
    const from = new Date(q.eventsBetween.from).getTime();
    const to = new Date(q.eventsBetween.to).getTime();
    if (s < from || s > to) return false;
  }
  return true;
}

/* ---------- LocalStorage adapter ---------- */

const STORE_KEY = 'hublab.records.v1';

class LocalStorageAdapter implements DataSource {
  private load(): HubRecord[] {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) return JSON.parse(raw) as HubRecord[];
    } catch { /* fall through to seed */ }
    this.save(SEED_RECORDS);
    return SEED_RECORDS;
  }
  private save(records: HubRecord[]) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(records)); } catch { /* ignore */ }
  }

  async list() { return this.load(); }

  async get(id: string) { return this.load().find(r => r.id === id); }

  async query(q: RecordQuery) {
    return this.load().filter(r => recordMatchesQuery(r, q));
  }

  async create(rec: HubRecord) {
    const all = this.load();
    all.push(rec);
    this.save(all);
    return rec;
  }

  async update(id: string, patch: Partial<HubRecord>) {
    const all = this.load();
    const i = all.findIndex(r => r.id === id);
    if (i < 0) throw new Error(`Record ${id} not found`);
    all[i] = { ...all[i], ...patch, updatedAt: new Date().toISOString() };
    this.save(all);
    return all[i];
  }

  async transition(id: string, to: RecordStatus, by: string, note?: string) {
    const all = this.load();
    const i = all.findIndex(r => r.id === id);
    if (i < 0) throw new Error(`Record ${id} not found`);
    const from = all[i].status;
    all[i] = {
      ...all[i],
      status: to,
      updatedAt: new Date().toISOString(),
      audit: [...all[i].audit, { at: new Date().toISOString(), by, from, to, note }],
    };
    this.save(all);
    return all[i];
  }

  async remove(id: string) {
    this.save(this.load().filter(r => r.id !== id));
  }

  async reset() {
    this.save(SEED_RECORDS);
  }
}

/* ---------- Adapter selection ----------
   Local is the default (the self-contained prototype/demo). Set
   VITE_DATA_SOURCE=supabase (plus the Supabase env vars) to use the real
   backend — see supabaseAdapter.ts and supabase/schema.sql. No UI changes. */
export const api: DataSource =
  import.meta.env.VITE_DATA_SOURCE === 'supabase'
    ? createSupabaseAdapter()
    : new LocalStorageAdapter();

/** Convenience used by sub-brand pages. */
export const subBrandQuery = (subBrand: SubBrand): RecordQuery => ({ subBrand, publicOnly: true });
