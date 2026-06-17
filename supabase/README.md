# Supabase backend

This folder holds the database setup for the optional Supabase backend. The app
runs fine without it (default = local prototype); see
`docs/MIGRATION_VERCEL_SUPABASE.md` for the full walkthrough.

## Apply the schema
1. Create a Supabase project (EU region for UK/EU residency).
2. Open **SQL editor**, paste `schema.sql`, run it. This creates the `records`
   and `audit_entries` tables, RLS policies, and the `transition_record` /
   `increment_engagement` functions.

## Point the app at it
Copy `.env.example` → `.env.local` in the project root and set:
```
VITE_DATA_SOURCE=supabase
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```
`npm run dev` (or a Vercel deploy with these env vars) now uses
`src/data/supabaseAdapter.ts`. No UI changes.

## Seed content
The demo data lives in `src/data/seed.ts`. Generate INSERTs from it (a small
Node script, or hand-convert) and run them once. Keep `seed.ts` as the canonical
dataset for the local adapter.

## Still to wire (see migration doc §5–6)
- Microsoft Entra/Azure AD SSO + a `user_role=moderator` JWT claim so the RLS
  policies grant staff access.
- Point public engagement writes (views/thumbs/ratings) at `increment_engagement`.
- A scheduled Edge Function for pre-expiry reminders + auto-expire.
