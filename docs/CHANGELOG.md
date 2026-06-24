# Changelog

Build versioning for the HubLab prototype. Semantic versioning, pre-1.0:

- **0.x** = pre-pilot prototype (no stability promise).
- **minor** (0.**x**.0) = a batch of new features / a working session's deliverable.
- **patch** (0.7.**x**) = fixes or small tweaks with no new surface.
- **1.0.0** = first DP-signed pilot release (the F1 gate).

The running version is shown in the site footer and injected from `package.json`
at build time (`vite.config.ts` → `__APP_VERSION__`). Hand-off zips are named
`hublab-prototype-v<version>.zip`. Tag releases in git as `v<version>` to match.

---

## v0.7.1 — Backlog: video embeds; storage notes
- Added **E5 — Video embeds (unlisted YouTube, with Vimeo support)** to the backlog: video
  stays external (embed, never self-hosted); `lib/video.ts` + responsive 16:9 embed planned,
  `youtube-nocookie` + transcript/captions for accessibility. Not yet built.
- Documented **Supabase Storage** for images + documents in the migration plan (PDFs/Word host
  fine there; video stays on YouTube/Vimeo).
- Docs only — no functional code change.

## v0.7.0 — Bulk import, media handling, versioning
- **E2 — bulk import** at `/admin/import`: paste/upload CSV/TSV → auto column-match →
  per-row review (Ready/Needs-fixing, inline edit, vocab suggestions, de-dupe) → commit
  to queue or drafts. Dependency-free parser; downloadable template + field legend.
- **E3 — intake spec**: `docs/IMPORT_TEMPLATE.md` documents the M365-Forms-compatible
  column contract (the importer is the matching ingest).
- **Single form — attachment simulation**: a chosen PDF/Word/etc. is read into an inline
  data URL (demo-only, small files) and offered back as a download; the live build swaps
  this for a Supabase Storage upload with no UI change. Download keeps the original filename.
- **Calendar empty state**: now offers a pre-filtered link into `/find` + an inline
  mailing-list signup instead of dead-ending.
- **Copy**: hero tagline → "See where curiosity takes you."
- **Versioning**: build version + date shown in the footer; this changelog added.
- axe 0 violations maintained across touched routes.

## v0.6.0 — A/B/C/D series + visual direction (pre-versioning baseline)
Snapshot of the build as received this session (was `package.json` 0.1.0): phases 0–5,
Submission UX upgrade, visual direction V1–V6, A1/A2/B1/B2/C1–C3/D1, F1 privacy draft.
Recorded here retrospectively as the starting point for versioned builds.
