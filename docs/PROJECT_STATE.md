# PROJECT_STATE.md — single source of truth for continuity

**Read this first when resuming in a new session.** It records the decisions, the
architecture, what is built, and what comes next. Updated at the end of every phase.

_Last updated: end of Phase 5 — build complete. Post-Phase-5: Submission UX (§9); Visual direction V1–V6; F1 privacy page (draft, footer legal row); B2 clickable tags + C1/C2/C3 (calendar filters, pill toggles, expandable calendar). Latest session: A1 (real event photos — Home "Get to know us" band + FunLab "Real moments" strip), A2 (About page, in nav + footer), D1 (Add to Google/Outlook calendar links beside the .ics), B1 (logo home-link affordance, header + footer). Also fixed a mailing-list pre-check bug (wrong sub-brand pre-ticked). axe clean (0 violations) across all 11 routes. A/B/C/D series complete; **E2 (bulk import) done + E3 spec/template done** (`docs/IMPORT_TEMPLATE.md`, M365-Forms-compatible column contract). Also this session: hero tagline → "See where curiosity takes you."; the What's-on empty state now links into a pre-filtered `/find` + inline mailing-list signup instead of dead-ending. Single-form document-attachment simulation added; build versioning introduced (footer shows v0.7.0, see CHANGELOG). Remaining E-series: E1 (SSO/RLS, gated on tenant creds + region) and E4 (submitter removal), then G1/G2. Ordered remaining work + statuses live in `ITERATION_BACKLOG.md`; next-session prompt in `RESUME_PROMPT.md`; GitHub deploy steps in `DEPLOY_TO_GITHUB.md`._

---

## 1. What this is
A backend-agnostic front-end prototype for the HubLab website (University of Manchester,
Faculty of Science & Engineering engagement portfolio). One central repository of tagged
"records" (events + resources), surfaced through a HubLab umbrella site and three
sub-brand views (FunLab, FutureLab, LifeLab), plus an internal moderation/admin workflow.

Build target: **GitHub Pages**, WordPress-aware throughout. Intended to graduate from
prototype → pilot → production by swapping the data layer (see WORDPRESS_MAPPING.md).

## 2. Locked decisions (the why, so they aren't re-litigated)
- **Stack:** Vite + React + TypeScript. HashRouter (works on Pages subpaths and from disk).
- **Backend-agnostic by design:** all data access goes through `DataSource` in
  `src/data/api.ts`. LocalStorage adapter now; Supabase or headless WordPress later.
- **Hosting recommendation if leaving WP/Pages:** static host (Vercel/Cloudflare Pages) +
  Supabase (DB+auth+storage). Reversible; does not block the build. Governance/data-protection
  sign-off (esp. minors' data, UK/EU residency) is the real gating item, not the tech.
- **Audiences:** FunLab = young children & families; FutureLab = **11+**; LifeLab = 18+.
  A record's audience is a **multi-select (1–3)** that maps to the sub-brand tag → drives
  cross-category surfacing (a record can appear on several sub-brand pages).
- **Dates:** four distinct — goLive, expiry (default +1yr; events: just after event end),
  event start, event end.
- **Expiry behaviour:** reminder to owner/admin before expiry → auto-unpublish at expiry →
  lands in an "expired" tab to renew or delete.
- **Each content type gets its own detail layout** (Phase 2+), not one generic template.
- **research_explainer** type added: single-page plain-language write-ups of research
  outputs (LifeLab/FutureLab). One seeded.
- **Accessibility:** WCAG 2.2 AA target; explicit "turn off animations" control + honours
  OS reduced-motion; skip link; visible focus; semantic landmarks.
- **Tone:** plain, audience-first language ("stuff to do", "activities to try at home",
  "what our scientists are working on"). No insider jargon.
- **Booking:** link OUT (University events / Eventbrite), not built in-house.
- **Teacher use:** a `usefulForTeachers` flag + filter that signposts; schools content
  links out to the official UoM Schools & Colleges team, not hosted here.

## 3. Feature triage (from the user's requested-features list)
- **Now (prototype):** accessibility + motion toggle; plain language; teacher flag/filter;
  careers/"what scientists do" + research explainer; events/news feed; media-appearances;
  citizen-science/blog/podcast linking; cross-category; auto-expiry; booking link-out;
  feedback UI shown locally (thumbs/ratings/view+download counts — schema fields exist).
- **Pilot (real data layer):** persistent real records & submissions; ratings/counts that
  accumulate; mailing list via University ESP; simple polls.
- **Future/production:** comments + moderation; ask-a-scientist workflow; game scores;
  full SSO self-service submission; integrated booking; AI chatbot (scoped to site search,
  safeguarding review, child audience — kept last).

## 4. Architecture map
- `src/data/types.ts` — `HubRecord` schema, `RecordType`, `RecordStatus`, query type. **Stable contract.**
- `src/data/vocabularies.ts` — controlled tag lists + sub-brand metadata + labels.
- `src/data/seed.ts` — ~16 dummy records: every type, cross-category items, varied
  lifecycle (live/scheduled/expiring/expired/in-queue), one research explainer.
- `src/data/api.ts` — `DataSource` interface + `LocalStorageAdapter` + lifecycle helpers
  (`isPublic`, `daysToExpiry`, `expiringSoon`, `ratingAverage`) + the shared
  `recordMatchesQuery`. Selects the adapter from `VITE_DATA_SOURCE`. **This is the swap point.**
- `src/data/supabaseAdapter.ts` — full `DataSource` against Supabase (Postgres + Auth +
  Storage), activated by `VITE_DATA_SOURCE=supabase`. Dead-code-eliminated from the default
  build. Schema/RLS/RPCs in `supabase/schema.sql`; setup in `docs/MIGRATION_VERCEL_SUPABASE.md`.
- `src/env.d.ts`, `.env.example` — typed env vars for the backend selection.
- `supabase/schema.sql`, `supabase/README.md` — DB schema, RLS, `transition_record` +
  `increment_engagement` functions, and how to apply them.
- `src/a11y/MotionContext.tsx` — motion preference (system/full/reduce) → `<html data-motion>`.
- `src/styles/tokens.css` — brand palette, per-lab theming via `[data-lab]`, type scale,
  signature wordmark gradient.
- `src/styles/components.css` — Phase 2 reusable classes (cards, chips, facets, calendar,
  hero, forms, detail layout). All driven by tokens + `[data-lab]`.
- `src/lib/format.ts` — en-GB date/number formatting (dates, event "when", compact counts).
- `src/lib/facets.ts` — `FacetState` ↔ URL search params ↔ `RecordQuery` (directory filters).
- `src/lib/ics.ts` — client-side `.ics` builder + blob download for "add to calendar".
- `src/lib/calendarLinks.ts` — Google Calendar (`render?action=TEMPLATE`) + Outlook/O365 (`deeplink/compose`) "add to calendar" deep links (D1). UTC stamps, URL-encoded, record URL in the description. The `.ics` builder stays the universal fallback.
- `src/lib/admin.ts` — admin helpers: status metadata/labels, the moderation actor, a blank
  record factory for new submissions, and ISO ↔ date-input converters.
- `src/lib/useDocumentTitle.ts` — sets a per-route `document.title` (Phase 5 polish).
- `src/lib/image.ts` — client-side image preview helper: downscales a chosen file to a small
  inline data URL for preview + the LocalStorage store. Swapped for a real upload (WP media /
  Supabase Storage) on platform; the form keeps only the resulting URL.
- `src/lib/import.ts` — bulk-import engine (E2): dependency-free CSV/TSV parser, header
- `src/lib/attachment.ts` — client-side **document** attachment helper (PDF/Word/etc.):
  reads a chosen file into an inline data URL (demo-only, ~1.5 MB cap because LocalStorage),
  with an auto label and the original filename for the download. Same swap story as images —
  the live build uploads to Supabase Storage and keeps only the URL, no UI change.

### Media delivery (decisions)
Three carriers, each handled differently — a static host (GitHub Pages) can't accept runtime
uploads, so "uploads" in the deployed prototype are browser-only by design:
- **Images** (promo/preview) — single form simulates upload via downscaled data URL
  (`lib/image.ts`); prod = Supabase Storage. Bulk import references an **image URL**.
- **Documents** (PDF preferred; Word/PPT only when the point is editing) — single form
  simulates via `lib/attachment.ts`; prod = Supabase Storage bucket + signed/public URL.
  Bulk import references a **file URL** (or an M365 file-upload answer → SharePoint link).
- **Video** — **never self-hosted.** Records store a URL and the page links/embeds a
  streaming platform (unlisted/public YouTube or Vimeo for public reach; Microsoft Stream
  if SSO-gated). This is the only open decision — platform choice is institutional. Embedding
  works on GitHub Pages today (it's just an iframe/link), so it's not blocked by hosting.
  _Accessibility:_ video needs captions + a transcript; PDFs must be tagged (WCAG 2.2 AA).

### Build versioning
`package.json` `version` is the single source of truth, injected at build via
`vite.config.ts` (`__APP_VERSION__`/`__BUILD_DATE__`) and shown in the footer. Scheme +
history in `docs/CHANGELOG.md`: 0.x pre-pilot, minor = feature batch, patch = fix,
**1.0.0 = DP-signed pilot**. Hand-off zips named `hublab-prototype-v<version>.zip`; tag git
releases `v<version>`. Current: **v0.7.0**.
- `src/components/Layout.tsx` — shell; responsive primary nav with an accessible mobile
  toggle (`aria-expanded`/`aria-controls`), skip link, scroll-reset on route change.
- `src/components/StatusBadge.tsx` — status badge + `AuditTrail` (renders a record's history).
- `src/components/RecordForm.tsx` — shared create/edit form: controlled-vocab inputs,
  type-conditional blocks (event / resource / research), assembles a clean `HubRecord`. Now
  with **per-field inline validation** (`aria-invalid`/`aria-describedby` + a `role="alert"`
  summary of focusable error links), **save-as-draft** (status `draft`) alongside submit, and a
  **client-side image preview** (via `lib/image.ts`; alt text required once an image is set).
  New submissions are stamped `submitted` / drafts `draft`, each with an opening audit entry.
- `src/components/SubmissionConfirmation.tsx` — post-save screen: recaps the saved record and
  explains the next step (moderation queue vs private draft); offers submit-another / keep-editing.
- `src/components/Layout.tsx`, `MotionToggle.tsx` — shell + a11y control (nav incl. What's on;
  scroll-resets on route change).
- `src/components/RecordCard.tsx` — canonical card (directory/featured/related/Phase 3).
- `src/components/Facets.tsx` — controlled facet panel (fieldset/legend groups).
- `src/components/VideoHero.tsx` — decorative looping brand video + poster, motion-aware.
- `src/components/MonthCalendar.tsx` — accessible month-grid table; loads each month via
  the data layer's `eventsBetween` query.
- `src/components/EngagementBar.tsx` — controlled thumbs/rating/counts; writes via `api.update`.
- `src/components/MailingListSignup.tsx` — front-of-house signup UI (tag prefs → ESP groups);
  optional `initialPrefs` pre-selects a lab on sub-brand pages.
- `src/components/SubBrandHero.tsx` — typographic, colour-led hero for a lab page (theme glow
  over the dark canvas; lab name/eyebrow in the lab's own light colour for contrast).
- `src/routes/Home.tsx` — umbrella landing: video hero + featured + audience trio + what's-on
  teaser + mailing list.
- `src/routes/Find.tsx` — faceted directory; filter state synced to the URL (shareable).
- `src/routes/Calendar.tsx` — "What's on": month calendar + upcoming list.
- `src/routes/RecordDetail.tsx` — `/record/:id`; per-type body layouts, factbox, engagement,
  related strip, view-count increment, friendly unavailable state. Event layout includes an
  accessible "Add to your calendar" `<fieldset>` group: `.ics` download + Google + Outlook links (D1).
- `src/routes/About.tsx` — `/about`; paraphrased about-us page (mission, ScienceX heritage,
  spark-of-fascination framing, three-labs summary, contact). Overlap-safe `.mediaband` image+text
  splits using event photos. Linked from primary nav + footer.
- `src/routes/SubBrand.tsx` — `/funlab` `/futurelab` `/lifelab`; one component themed by a
  `lab` prop. Hero + featured + coming-up + explore-by-type entry points (deep-link into the
  filtered directory) + full lab grid + lab-tagged mailing list. Cross-category by design:
  one overlap query (`subBrand`) surfaces records shared with other labs, flagged with a note.
- `src/routes/Admin.tsx` — `/admin`; moderation queue (approve / send back / reject with a
  note), management tables (unpublish / republish / make-live / feature / delete / **submit a
  draft for review**), an expiry tab (expiring-soon reminders + expired → renew), stat tiles,
  and per-record audit history. Reads the whole set via `api.list()` and buckets by status
  (drafts surface in the All-content tab; keeps the public query lean).
- `src/routes/AdminRecordForm.tsx` — `/admin/new` and `/admin/edit/:id`; hosts `RecordForm`,
  routes saves through `api.create` / `api.update` (+ a draft→`submitted` `transition` when a
  draft is submitted from edit), then shows `SubmissionConfirmation` for new submissions/drafts.
- `src/routes/AdminImport.tsx` — `/admin/import`; bulk upload (E2). Four steps — add data
  (CSV/TSV paste or upload + template/legend downloads) → match columns → review (per-row
  Ready/Needs-fixing, inline-editable, ready/needs counts, queue|drafts, de-dupe) → done.
  Commits via `api.create` with a "Bulk imported by …" audit entry. See `lib/import.ts`.
- `src/App.tsx` — routes; all five phases now have real pages (no placeholders left).

## 5. Brand tokens (locked)
Canvas `#381E4D`; HubLab `#5D2785`; FunLab `#FEDD76`; FutureLab `#B785BA`;
LifeLab `#7FC8BD`; green `#48AE99`; coral `#F2A0A0`; sky `#8FB7E0`.
Display: Fredoka; Body: Mulish (free stand-ins for the licensed brand font — swappable).

## 6. Build status
- [x] Phase 0 — Foundations (scaffold, tokens, a11y baseline, routing, data-layer abstraction, docs)
- [x] Phase 1 — Data model + controlled vocab + seed content
- [x] Phase 2 — HubLab umbrella: landing (video hero + featured), faceted directory, events calendar, record detail, mailing-list signup UI
- [x] Phase 3 — Sub-brand pages (FunLab/FutureLab/LifeLab) — own colourway/copy, filtered, cross-category
- [x] Phase 4 — Admin: submission form, moderation queue, edit/unpublish/delete, expiry tab + reminders, audit trail
- [x] Phase 5 — Polish, accessibility audit, GitHub Pages deploy config, final packaging

**Phase 5 notes:** axe-core WCAG 2.1/2.2 A/AA automated audit is **clean (0 violations)** across
home, find, calendar, both detail layouts, sub-brand pages, admin, and the submission form.
Added accessible `--theme-text` (per-lab dark text) plus `--c-green-strong` / `--c-warn-strong`
tokens for white-text elements; per-route document titles; a responsive nav with a mobile
toggle. Deploy: `.github/workflows/deploy.yml` (GitHub Pages via Actions), `public/.nojekyll`,
`README.md`. `vite.config` uses `base: './'` so it runs on any subpath and HashRouter needs no
server rewrites. Automated audit ≠ full audit — still do manual keyboard/screen-reader passes
and wire axe/Pa11y into CI before a real launch.

## 7. Known follow-ups / open questions
- Confirm licensed brand font (currently Fredoka/Mulish).
- Confirm which email platform (ESP) the University uses for the mailing list, and the
  group/segment names the signup tag preferences should map to.
- **Lab logo assets are inconsistent** and unreliable on coloured/dark surfaces: the
  colour wordmarks (`funlab.png`, `futurelab.png`) sit on an opaque white background, the
  `*-white.png` variants are white-on-white (unusable), and `lifelab.png` is a wordmark in
  a black badge. Phase 2 therefore renders lab names as styled display-font wordmarks on a
  theme-tinted panel (accessible + consistent). Phase 3 sub-brand pages should request clean
  transparent logo masters from the brand team, or continue with the text wordmark approach.
- Decide pilot data backend (Supabase vs Git-CMS vs headless WP) when governance steer lands.
- Hero videos have brand wordmark + strapline baked in; the umbrella hero uses a
  left-weighted scrim so the live H1 stays legible over the art. If clean (text-free) hero
  footage arrives, the scrim can be lightened.
- Sub-brand heroes (Phase 3) are typographic/colour-led by design — only FunLab has a
  dedicated hero video, and the illustrated motifs are square tiles with a baked-in yellow
  gradient (great as card media, wrong as loose cut-outs on a lilac/teal hero). If per-lab
  hero footage or transparent motif art arrives, `SubBrandHero` can take an optional media
  slot without changing the page structure.

## 8. How to resume in a new session
1. Start a new chat (ideally in the same Project so assets are available).
2. Upload the latest project zip (or ensure it's in Project knowledge).
3. Paste the resume prompt provided with this package.
The new session reads this file and continues from the first unchecked phase above.

## 9. Suggested enhancements (post-Phase-5, not yet built)
Ordered roughly by value-for-effort. None are blockers.
- **Search upgrade:** current text match is title+summary only. Extend to body/tags; add
  sort (soonest event / most popular / newest) and a result-type toggle.
- **Sub-brand mini-filter:** let the "Everything in <lab>" grid filter by type in place,
  instead of only deep-linking to the directory.
- **Calendar polish:** list/agenda view toggle; multi-day event spanning; "add all to
  calendar"; iCal subscription URL (in WP this is native to The Events Calendar).
- **Submission UX:** ~~save-as-draft (status `draft`), client-side image upload preview,
  per-field inline validation, and a confirmation screen with the submitted summary.~~
  **DONE (post-Phase-5).** `RecordForm` now has inline per-field validation (`aria-invalid` +
  `aria-describedby`, plus a `role="alert"` error summary linking to each field), save-as-draft
  with a `draft` status that surfaces in the admin All-content tab (with a "Submit for review"
  action), a downscaled client-side image preview (`src/lib/image.ts`), and a post-save
  confirmation summary (`SubmissionConfirmation`). axe clean (0 violations) on the form (incl.
  error state) and both confirmation screens. Remaining for platform: swap the inline image
  preview for a real upload (WP media / Supabase Storage) and enforce validation server-side.
- **Admin:** filter/search within tabs; bulk actions; a global recent-activity feed built
  from all records' audit entries; email-preview of the pre-expiry reminder.
- **Engagement honesty:** badge counts as "demo" in the prototype, or gate writes behind a
  flag, so view counts don't accumulate misleadingly during stakeholder demos.
- **SEO/share:** per-record Open Graph/Twitter meta (needs SSR or prerender — see Vercel
  note below) and JSON-LD `Event`/`Course` structured data.
- **i18n-readiness:** the copy is centralised enough to localise later; not needed now.
- **Testing:** add Vitest unit tests for `lib/facets`, `lib/ics`, lifecycle helpers, and a
  Playwright e2e for the submit→approve→live flow; wire axe/Pa11y + build into CI.

## 10. Pilot migration plan — Vercel + Supabase
> Step-by-step version with SQL schema, RLS policies, and an adapter skeleton:
> **`docs/MIGRATION_VERCEL_SUPABASE.md`**. Summary below.

The whole point of the `DataSource` seam (`src/data/api.ts`) is that this is a swap, not a
rewrite. Target: host the same React app on **Vercel** (or Cloudflare/Netlify) with
**Supabase** (Postgres + Auth + Storage) behind it.

**A. Database (Supabase).** Model `HubRecord` as a `records` table; multi-selects
(`audiences`, `age_groups`, `subjects`) as join tables or `text[]` columns; the
`event`/`resource`/`research` blocks as nullable columns or a JSONB column; `audit` as an
`audit` table (FK to record). Recreate `vocabularies.ts` as reference tables. Enable Row Level
Security: public read only where `status='live'` and now ∈ [go_live, expiry); writes restricted
to authenticated staff.

**B. Auth.** Supabase Auth with Microsoft Entra/Azure AD SSO restricted to the @manchester
tenant → satisfies the "self-service @manchester accounts" requirement without bespoke
passwords. Map an `is_moderator` claim/role to the admin actions.

**C. Adapter.** Add `SupabaseAdapter implements DataSource` next to `LocalStorageAdapter`,
using `@supabase/supabase-js`. Implement `list/get/query/create/update/transition/remove`.
`transition` should append the audit row and set status in one RPC/transaction. Select the
adapter via an env flag (`VITE_DATA_SOURCE=supabase|local`). **No UI changes required.**

**D. Lifecycle automation.** Move `expiringSoon`/auto-expire to a Supabase scheduled Edge
Function (cron): email owners N days before `expiry`, flip `live→expired` at `expiry`. The
public `isPublic()` rule already enforces the date window read-side as a backstop.

**D2. Storage (images + documents).** **Yes — Supabase hosts our files.** Create a Supabase
**Storage** bucket (e.g. `media`) for promo images and downloadable docs (PDF/Word/etc.). The
single form's simulated data-URL uploads (`lib/image.ts`, `lib/attachment.ts`) graduate to a real
bucket upload that returns a **public URL** (open content) or a **signed URL** (restricted),
stored on the record exactly as today — no UI change. Set a **size cap** + allowed MIME types on
the bucket and an RLS policy so only authenticated staff can write. **Video stays external**
(unlisted YouTube/Vimeo, E5) — don't put video in Storage (egress cost, no adaptive streaming).
Recommend serving PDFs (tagged/accessible) for read-only docs; keep Word/PPT for editable assets.

**E. Hosting (Vercel).** Import the repo; build `npm run build`, output `dist`. For richer
share/SEO, consider migrating to Next.js later to get SSR/prerender for per-record Open Graph
+ JSON-LD; if staying SPA, switch `HashRouter`→`BrowserRouter` and add the SPA rewrite
(`/* -> /index.html`). Put Supabase keys in Vercel env vars (anon key client-side; service
role only in Edge Functions).

**F. Sequence.** (1) stand up Supabase schema + seed import; (2) ~~write `SupabaseAdapter`~~
**done — `src/data/supabaseAdapter.ts` + `supabase/schema.sql` are in the repo**; flip the flag
in a preview deploy; (3) add SSO + RLS; (4) add the expiry cron; (5) governance/
data-protection sign-off (minors' data, UK/EU residency) — the real gating item; (6) cut over.
Keep `LocalStorageAdapter` as the offline/demo mode.
