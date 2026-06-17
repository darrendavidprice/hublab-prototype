# Migration: prototype → Vercel + Supabase

This expands `PROJECT_STATE.md` §10 into concrete steps. The guiding idea: the app only ever
talks to the `DataSource` interface in `src/data/api.ts`, so going live is **swapping the
adapter**, not rewriting the UI. Snippets below are illustrative starting points, not final code.

**Stack:** React app on **Vercel**; **Supabase** for Postgres + Auth + Storage + scheduled
functions. Keep the existing `LocalStorageAdapter` as an offline/demo mode behind an env flag.

---

## 0. Prerequisites
- A Supabase project (free tier is fine to start).
- A Vercel account linked to the GitHub repo.
- Decision needed in parallel (the real gate): data-protection sign-off for minors' data and
  UK/EU data residency. Choose the Supabase region accordingly (EU).

## 1. Create the schema
Model `HubRecord` as a `records` table. Multi-selects can be Postgres `text[]` (simplest) or
join tables (cleaner for faceting at scale); arrays are fine for this volume. Type-specific
blocks go in JSONB.

```sql
create type record_status as enum
  ('draft','submitted','needs_clarification','rejected','approved','live','unpublished','expired');

create table records (
  id            text primary key,
  type          text not null,
  title         text not null,
  summary       text not null,
  body          text,
  audiences     text[] not null default '{}',
  age_groups    text[] not null default '{}',
  subjects      text[] not null default '{}',
  useful_for_teachers boolean not null default false,
  featured      boolean not null default false,
  promo_image   text,
  promo_image_alt text,
  caption       text,
  status        record_status not null default 'submitted',
  go_live_date  timestamptz not null,
  expiry_date   timestamptz not null,
  event         jsonb,           -- { start, end, venue, isOnline, bookingUrl, capacityNote }
  resource      jsonb,           -- { externalUrl, fileUrl, fileLabel, durationNote }
  research      jsonb,           -- { plainSummary, researchers, department, paperUrl }
  submitter     jsonb not null,  -- { name, email, department }
  engagement    jsonb not null default '{"views":0,"downloads":0,"thumbsUp":0,"ratingSum":0,"ratingCount":0}',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table audit_entries (
  id         bigint generated always as identity primary key,
  record_id  text not null references records(id) on delete cascade,
  at         timestamptz not null default now(),
  by         text not null,
  from_status record_status,
  to_status   record_status not null,
  note       text
);
create index on audit_entries (record_id, at);
```

Controlled vocabularies (`vocabularies.ts`) become small reference tables (or stay in the app
as the source of truth and are mirrored here for validation — your call).

## 2. Row Level Security (RLS)
Public reads see only what's live *now*; writes are staff-only.

```sql
alter table records enable row level security;

-- Anyone may read records that are publicly live right now
create policy public_read on records for select
  using (status = 'live' and go_live_date <= now() and now() < expiry_date);

-- Authenticated moderators may read/write everything
create policy staff_all on records for all
  using (auth.jwt() ->> 'role' = 'moderator')
  with check (auth.jwt() ->> 'role' = 'moderator');
```

Engagement counters (views/thumbs/ratings) from the public need a narrow write path — expose a
`SECURITY DEFINER` RPC that increments only the counter fields, rather than a broad update
policy.

## 3. Seed import
Transform `src/data/seed.ts` to rows and insert once (a tiny Node script, or paste generated
SQL). Keep `seed.ts` as the canonical demo dataset for the local adapter.

## 4. Write the Supabase adapter
> **Done — already in the repo.** `src/data/supabaseAdapter.ts` implements the full
> `DataSource` against Supabase, selected by the `VITE_DATA_SOURCE` flag in `src/data/api.ts`.
> `transition_record` and `increment_engagement` live in `supabase/schema.sql`. The local
> adapter remains the default, and the Supabase branch is dead-code-eliminated from the build
> unless the flag is set. The remaining work is the *backend* setup below (schema, SSO, RLS,
> cron), not app code. The original skeleton is kept below for reference.
Add `src/data/supabaseAdapter.ts` implementing the same `DataSource` interface, then select the
adapter by env flag — **no UI changes**.

```ts
// src/data/supabaseAdapter.ts (skeleton)
import { createClient } from '@supabase/supabase-js';
import type { DataSource } from './api';
import type { HubRecord, RecordQuery, RecordStatus } from './types';

const db = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

export const supabaseAdapter: DataSource = {
  async list() { /* select * from records */ return mapRows(await db.from('records').select('*')); },
  async get(id) { /* select by id + join audit */ ... },
  async query(q: RecordQuery) { /* translate facets to .contains()/.in()/.gte() filters */ ... },
  async create(rec: HubRecord) { /* insert record + initial audit row */ ... },
  async update(id, patch) { /* update + set updated_at */ ... },
  async transition(id, to: RecordStatus, by, note) {
    // one RPC/transaction: update status + insert audit_entries row
    return mapRow(await db.rpc('transition_record', { p_id: id, p_to: to, p_by: by, p_note: note }));
  },
  async remove(id) { await db.from('records').delete().eq('id', id); },
  async reset() { /* no-op or admin-only re-seed */ },
};
```

```ts
// src/data/api.ts — choose adapter
export const api: DataSource =
  import.meta.env.VITE_DATA_SOURCE === 'supabase' ? supabaseAdapter : new LocalStorageAdapter();
```

Notes:
- `query` maps the existing `RecordQuery` to filters: `audiences` → `.overlaps('audiences', […])`,
  `eventsBetween` → `.gte/.lte` on `event->>start`, `publicOnly` → the live-window predicate.
- `transition` must write the audit row server-side so history can't be bypassed.

## 5. Auth (staff sign-in)
- Enable **Microsoft Entra / Azure AD** as a Supabase Auth provider, restricted to the
  @manchester tenant — this is the "self-service @manchester accounts, no bespoke passwords"
  requirement.
- Add a `moderator` role/claim (via a custom access-token hook or a `staff` table check) and
  gate the `/admin` routes on it client-side, with RLS enforcing it server-side.
- Public visitors stay anonymous (read-only + the engagement RPC).

## 6. Lifecycle automation (expiry + reminders)
Move `expiringSoon` / auto-expire from runtime to a **Supabase scheduled Edge Function** (cron):
- N days before `expiry_date`: email the submitter/admin (the pre-expiry reminder).
- At `expiry_date`: flip `live → expired`.
The public `isPublic()` date-window check stays as a read-side backstop so nothing leaks even if
a cron run is missed.

## 7. Host on Vercel
- Import the repo. Framework preset: Vite. Build `npm run build`, output `dist`.
- Env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_DATA_SOURCE=supabase`. The
  **service-role** key is used only inside Edge Functions, never shipped to the client.
- Routing: the app uses `HashRouter`, which needs no rewrites. To move to clean URLs, switch to
  `BrowserRouter` and add a SPA fallback (`vercel.json`: rewrite `/(.*)` → `/index.html`).
- For per-record share previews / SEO (Open Graph, JSON-LD), consider porting to **Next.js**
  later to get SSR/prerender; not required for the pilot.

## 8. Suggested sequence
1. Supabase project + schema + seed import (EU region).
2. `supabaseAdapter` + env flag; verify against a Vercel **preview** deployment with the flag on.
3. Entra SSO + `moderator` role + RLS.
4. Expiry cron Edge Function + reminder emails.
5. **Data-protection sign-off** (minors' data, residency) — the real go/no-go.
6. Cut over production to `VITE_DATA_SOURCE=supabase`. Keep the local adapter for demos.

## Rollback
Because the flag selects the adapter, flipping `VITE_DATA_SOURCE` back to `local` returns the app
to the self-contained demo with zero code changes — useful for offline showcases or if the
backend is unavailable.
