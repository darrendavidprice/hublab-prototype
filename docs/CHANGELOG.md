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

## v0.9.0 — Admin content preview; submission stock imagery; physics video
- **Admin — preview submitted content.** New `components/RecordPreview.tsx` adds a
  "Preview" disclosure to both the moderation **queue cards** and the management
  **tables** (every non-queue tab). Shows the uploaded **thumbnail** (and flags
  missing image / missing alt text), the summary + a body excerpt, and one-click
  **access to the actual content**: a file **download** link, **Watch on
  YouTube/Vimeo** + an inline player for videos, **Open link** for external links,
  **Read paper** for research, **Booking page** for events, plus **Open record
  page**. Lets a moderator review exactly what was submitted without leaving admin.
- **Submission form — stock imagery picker.** `RecordForm` gains a "…or pick a
  HubLab illustration" dropdown (`lib/stockImages.ts`, 12 curated brand motifs) for
  submitters with no image of their own. Choosing one sets the promo image path and
  **auto-fills its alt text** (still editable), and previews it inline. Sits
  alongside the existing upload + path options; picking a stock clears any upload.
- **Content — new physics video.** Seed `vid-standardmodel`: "What can the Standard
  Model tell us about new physics?" — a recorded LHC/particle-physics live talk
  (LifeLab + FutureLab, Physics), embedding the supplied YouTube URL via E5.
- axe 0 violations across the video record, admin queue + table previews, and the
  submission form (desktop + mobile).


- **E5 — video embeds.** New `src/lib/video.ts` parses a pasted watch URL →
  provider + id for **YouTube** (`watch?v=`, `youtu.be/`, `/embed/`, `/shorts/`,
  `m.` and the no-cookie domain, extra params tolerated) and **Vimeo**
  (`vimeo.com/<id>`, `/channels/.../id`, unlisted `id/hash`, `player.vimeo.com`).
  New `VideoEmbed` component renders a responsive **16:9**, **lazy-loaded** iframe
  with a descriptive **title** and a **captions/transcript note** (WCAG 2.2 AA);
  YouTube uses **youtube-nocookie.com**, Vimeo uses `dnt=1`. Used on the `video`
  record type and on any record whose `resource.externalUrl` is a recognised
  video; unrecognised URLs fall back to the existing **"Watch the video"**
  out-link. `RecordForm` gains a hint on the video link field. Seed
  `vid-materials` now points at a real University of Manchester video so the embed
  is demonstrable. axe 0 violations on the video + form routes (desktop + mobile).
- **Schools-resource content fix.** A `schools_resource` record no longer replaces
  its content with a "we point you to the Schools & Colleges team rather than
  hosting it here" notice. Submitted content always appears: the body, an optional
  file download, and/or an out-link render like any other resource. (This reverses
  an earlier "signpost, don't host" design for this one type, per owner direction.)
  Audited the rest of the app — no other place suppresses a record behind a notice;
  the remaining `.notice` uses are supplementary (expiry heads-up, event capacity,
  privacy draft banner, cross-category note). Seed `sch-stemclub` gained a real body.
- axe 0 violations maintained across touched routes.


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
