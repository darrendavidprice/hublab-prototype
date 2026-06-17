-- ============================================================
-- HubLab — Supabase schema, RLS policies and the transition RPC.
-- Run this in the Supabase SQL editor (or via the CLI) on a fresh
-- project. Mirrors the `HubRecord` contract in src/data/types.ts and
-- the behaviour of src/data/supabaseAdapter.ts.
-- Choose an EU region for the project (UK/EU data residency).
-- ============================================================

-- ---------- Enums ----------
create type record_status as enum
  ('draft','submitted','needs_clarification','rejected','approved','live','unpublished','expired');

-- ---------- Tables ----------
create table records (
  id                  text primary key,
  type                text not null,
  title               text not null,
  summary             text not null,
  body                text,
  audiences           text[] not null default '{}',
  age_groups          text[] not null default '{}',
  subjects            text[] not null default '{}',
  useful_for_teachers boolean not null default false,
  featured            boolean not null default false,
  promo_image         text,
  promo_image_alt     text,
  caption             text,
  status              record_status not null default 'submitted',
  go_live_date        timestamptz not null,
  expiry_date         timestamptz not null,
  event               jsonb,   -- { start, end, venue, isOnline, bookingUrl, capacityNote }
  resource            jsonb,   -- { externalUrl, fileUrl, fileLabel, durationNote }
  research            jsonb,   -- { plainSummary, researchers, department, paperUrl }
  submitter           jsonb not null,  -- { name, email, department }
  engagement          jsonb not null default
                        '{"views":0,"downloads":0,"thumbsUp":0,"ratingSum":0,"ratingCount":0}'::jsonb,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create table audit_entries (
  id          bigint generated always as identity primary key,
  record_id   text not null references records(id) on delete cascade,
  at          timestamptz not null default now(),
  by          text not null,
  from_status record_status,
  to_status   record_status not null,
  note        text
);
create index audit_entries_record_idx on audit_entries (record_id, at);

-- Helpful filtering indexes (array membership + the live window).
create index records_audiences_idx on records using gin (audiences);
create index records_status_dates_idx on records (status, go_live_date, expiry_date);

-- ---------- Row Level Security ----------
alter table records enable row level security;
alter table audit_entries enable row level security;

-- Public (anon) may read only records that are live RIGHT NOW. This mirrors
-- isPublic() in the app and is the server-side backstop for the date window.
create policy records_public_read on records for select
  to anon, authenticated
  using (status = 'live' and go_live_date <= now() and now() < expiry_date);

-- Moderators may do everything. Expects a 'moderator' role claim in the JWT
-- (set via a custom access-token hook or a staff lookup — see §5 of
-- docs/MIGRATION_VERCEL_SUPABASE.md).
create policy records_staff_all on records for all
  to authenticated
  using ((auth.jwt() ->> 'user_role') = 'moderator')
  with check ((auth.jwt() ->> 'user_role') = 'moderator');

-- Audit is readable/writable by moderators only; it is never exposed to anon.
create policy audit_staff_all on audit_entries for all
  to authenticated
  using ((auth.jwt() ->> 'user_role') = 'moderator')
  with check ((auth.jwt() ->> 'user_role') = 'moderator');

-- ---------- transition_record(): atomic status change + audit ----------
-- Used by SupabaseAdapter.transition(). SECURITY INVOKER so RLS still applies
-- (only moderators can call it for a write).
create or replace function transition_record(
  p_id text, p_to record_status, p_by text, p_note text default null
) returns records
language plpgsql
as $$
declare
  v_from record_status;
  v_row  records;
begin
  select status into v_from from records where id = p_id for update;
  if not found then
    raise exception 'Record % not found', p_id;
  end if;

  update records
     set status = p_to, updated_at = now()
   where id = p_id
   returning * into v_row;

  insert into audit_entries (record_id, by, from_status, to_status, note)
  values (p_id, p_by, v_from, p_to, p_note);

  return v_row;
end;
$$;

-- ---------- increment_engagement(): safe public counter writes ----------
-- Lets anonymous visitors bump view/thumb/rating counters WITHOUT a broad
-- UPDATE policy. SECURITY DEFINER so it can write despite RLS, but it only
-- ever touches the engagement counters. Point EngagementBar/view-counting
-- at this RPC when wiring the live backend.
create or replace function increment_engagement(
  p_id text, p_views int default 0, p_downloads int default 0,
  p_thumbs int default 0, p_rating_sum int default 0, p_rating_count int default 0
) returns void
language sql
security definer
set search_path = public
as $$
  update records set engagement = jsonb_build_object(
    'views',       coalesce((engagement->>'views')::int,0)       + p_views,
    'downloads',   coalesce((engagement->>'downloads')::int,0)   + p_downloads,
    'thumbsUp',    coalesce((engagement->>'thumbsUp')::int,0)    + p_thumbs,
    'ratingSum',   coalesce((engagement->>'ratingSum')::int,0)   + p_rating_sum,
    'ratingCount', coalesce((engagement->>'ratingCount')::int,0) + p_rating_count
  )
  where id = p_id and status = 'live';
$$;
grant execute on function increment_engagement to anon, authenticated;
