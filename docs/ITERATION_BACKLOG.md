# ITERATION_BACKLOG.md — planned work, in order

A steppable backlog. Each item has **Plan / Files / Notes / Status**. We do the visual
direction (V*) first (agreed), then the rest. Everything stays behind the locked token system,
the `DataSource` seam, and the WCAG 2.2 AA floor. Status legend: ☐ todo · ◐ in progress · ☑ done.

**Fixed during review (not a backlog item):** the mailing-list signup pre-ticked the wrong
sub-brand. React reused the single `MailingListSignup` instance across sub-brand navigations, so
`useState(initialPrefs)` only seeded once (whichever lab was visited first stuck). Re-seed now
runs in an effect keyed on the incoming pre-selection, so each lab page pre-ticks its own lab.
_File:_ `components/MailingListSignup.tsx`.

**Added this session (not backlog items):**
- **Calendar empty state, dead-end fix.** When no events match on *What's on*, the empty
  state now offers a way forward: a **"See other stuff for these filters"** button carrying the
  active filters into `/find` (the calendar sets no type facet, so it surfaces activities/videos/
  guides too, not just events), Clear filters, and the **mailing-list signup** inline (audience
  pre-selected from the filter, "Events & what's on" pre-ticked). _Files:_ `routes/Calendar.tsx`,
  `components.css` (`.empty__actions`/`.empty__signup`). axe clean.
- **Hero tagline.** H1 changed from "All our stuff, in one place." → **"See where curiosity
  takes you."** (eyebrow kept). _File:_ `routes/Home.tsx`.
- **Single-form document attachment (simulated).** "Link & file" fieldset now takes an
  uploaded PDF/Word/etc. (inline data URL, ~1.5 MB demo cap) alongside the URL field, shown
  back as a named download on the record page. Mirrors the existing image-upload simulation;
  prod swaps both for Supabase Storage. _Files:_ `lib/attachment.ts`, `components/RecordForm.tsx`,
  `routes/RecordDetail.tsx`, `data/types.ts` (`ResourceDetails.fileName`). _Bulk import_ stays
  URL-based (a CSV can't carry binaries) — net-new files come via the single form or an M365
  file-upload question → SharePoint link. Open decision: **video hosting platform** (see
  PROJECT_STATE "Media delivery").
- **Build versioning.** `package.json` version → injected `__APP_VERSION__`/`__BUILD_DATE__`,
  shown in footer; `docs/CHANGELOG.md` added; this build is **v0.7.0**. _Files:_ `vite.config.ts`,
  `env.d.ts`, `tsconfig.node.json`, `components/Layout.tsx`.

---

## V · Visual direction (agreed; do first)
See the proposal image for the target. All reversible, token-driven.

- **V1 — Brand surfaces.** ☑ Done — halftone texture + dual glows on mailing-list panel, footer (with gradient hairline + home-link wordmark) and hero scrim. Add `--brand-texture` (halftone dots) + radial glow utilities; apply to umbrella hero, mailing-list panel, footer. _Files:_ `tokens.css`, `global.css`/`components.css`, `VideoHero`, `Layout`. _Notes:_ texture is decorative (`aria-hidden`), respects `prefers-reduced-motion`.
- **V2 — Real lab logos.** ☑ Done — masters were flat-bg RGB (the long-standing blocker); cut clean transparent + white + ink logos (premultiplied, no fringe) into `public/brand/labs/`. Colour logos now in the sub-brand heroes, `<h1>` preserved via `alt`. Use `FC` (light bg) / `WHT` (dark bg) stacked logos in `SubBrandHero` and the home trio, replacing text wordmarks. _Files:_ copy assets to `public/brand/labs/`, `SubBrandHero.tsx`, `Home.tsx`. _Notes:_ keep an accessible text equivalent (`alt`); re-check contrast.
- **V3 — Lab tiles.** ☑ Done — home trio rebuilt as branded colour-filled tiles (real ink logos, per-lab radius, AA-safe dark CTA, contained illustration sticker pinned clear of text). Photography → A1. Rework home trio + lab "explore by type" into branded tiles; bring in 2–3 illustrations as `aria-hidden` motifs **positioned clear of text** (the proposal mock overlapped — real build uses a reserved motif zone / `padding-right` so copy never sits under art). Add real event photos (see A1). _Files:_ `Home.tsx`, `SubBrand.tsx`, `components.css`.
- **V4 — Per-lab character tokens.** ◐ `--lab-radius` added per `[data-lab]` (FunLab 30 → LifeLab 16) and driving the tiles. `--lab-density`/motif slot optional polish, deferred. Extend `[data-lab]` with `--lab-radius`, `--lab-density`, optional `--lab-motif`; FunLab chunkier/loudest, FutureLab energetic (scribble), LifeLab calmer/editorial. _Files:_ `tokens.css`.
- **V5 — Type trial.** ☑ Done — `--font-heading: 'Zilla Slab'` on h1–h4 (echoes master wordmark); Fredoka kept for UI chrome + lab taglines. REVERT: set `--font-heading: var(--font-display)` in tokens.css. A/B a rounded slab (Zilla Slab / Rokkitt, both OFL) for HubLab-level headings to echo the master mark. Confirm final face with brand team (open item).
- **V6 — Re-audit.** ☑ Done — axe across 9 routes (home, find, calendar, 3 sub-brands, admin, admin/new, record detail) = **0 violations**. axe + screenshots after each step; contrast on coloured fills is the watch-item.

---

## A · Content & imagery

- **A1 — Audience photography placement.** ☑ Done — reusable overlap-safe `.mediaband` (image+text) and `.gallerystrip` CSS built; FunLab illustrated gallery ("Things you might get up to") shipped; real event photos now placed: Home **"Get to know us"** people-band (`.mediaband`, robot-dog photo + paraphrased "you don't need a white coat" copy → links to /about) and a FunLab **"Real moments / From our events"** photo strip (`.gallerystrip--photos`, 4:3 crop, all four takeover photos with descriptive alt + captions). Photos stored in `public/brand/photos/` (`event-robot-dog`, `event-simulator`, `event-astrophysics`, `event-dinosaurs`). axe clean on Home + FunLab. **Photo rights: cleared** — these are official FSE photos already published on the live site, so no separate consent/usage approval is needed.
  _Plan:_ photos add the human warmth illustrations can't. **Hard rule: photos never sit behind live text.** Allowed patterns: (a) image+text split bands, (b) full-width image band with caption beside/below, (c) gallery strip, (d) card media (image top, text below — current `RecordCard`). Any hero photo needs a solid scrim/colour panel that text sits on.
  _Placements:_
  - **Home — new "Get to know us" band** (mirrors the live site): image+text split — a real event photo + paraphrased "you don't need a white coat…" copy + link to About.
  - **FunLab page:** a "real moments" gallery strip of the 4 uploaded takeover photos (they're FunLab event shots); hero stays typographic, photos in a band below.
  - **About page (A2):** event photos in image+text splits.
  - **Sub-brand heroes (optional):** one photo as a side image with a solid text panel — no overlap.
  _Uploaded assets (map by theme):_ takeover-1 robot dog → FutureLab/robotics; takeover-2 sim seat → hands-on; takeover-3 astrophysics/SKAO stall → LifeLab/space; takeover-4 dino-banner stall → FunLab. Plus about-us images (Event-Image01/02, Frame-68 banner) — paraphrase copy, don't lift verbatim.
  _Notes:_ **Rights/consent — cleared.** These are official FSE event photos already published on the live site, so no separate photo consent/usage approval is needed. Stored under `public/brand/photos/` with descriptive `alt`.

- **A2 — About page.** ☑ Done — new `/about` route ("Opening doors to science and engineering, for everyone"); ScienceX-heritage line + spark-of-fascination framing, all paraphrased in HubLab's plain sentence-case tone (not lifted verbatim); two overlap-safe `.mediaband` image+text splits (one `--reverse`) using event photos; "three labs" summary + CTAs; contact section. Added to primary nav (after the labs) and footer ("About HubLab" link by the contact line). axe clean. _Files:_ `routes/About.tsx`, `App.tsx`, `Layout.tsx`.

---

## B · Navigation & linking

- **B1 — Logo link.** ☑ Done — both header and footer logos were already `<Link to="/">` with `aria-label="HubLab home"`; routing was never broken (the "does nothing" was being on home already). Added the missing interactive affordance: a shared `.brandlink` class (`cursor: pointer` + subtle hover lift, reduced-motion safe; keyboard focus uses the global `:focus-visible` ring) on both logos, plus a `title="HubLab home"` tooltip. Verified clicking the header logo from `/find` navigates to home. _Files:_ `Layout.tsx`, `components.css`.

- **B2 — Clickable tags everywhere.** ☑ Done — card + record chips (type/lab/teacher) and age/subject fact-row tags now link to the pre-filtered directory via `findLink()`; hover+focus glow, reduced-motion-aware; filter UIs unchanged. Make tag chips link to the directory pre-filtered to that tag — **except** inside the Find/Calendar filter UIs themselves. _Param map (reuse `facetsToParams`):_ lab → `/find?aud=<id>`, type → `/find?type=<id>`, "For teachers" → `/find?teachers=1`, age → `/find?age=<id>`, subject → `/find?subject=<id>`. _Files:_ `RecordCard.tsx` (chips → `<Link>`), `RecordDetail.tsx` (its tag rows). _Notes:_ chips become links but sit beside the title link (no nested `<a>`); keep the card body click target intact; give chips a visible focus ring. Add a subtle **mouse-over glow** on the now-clickable chips (box-shadow/scale on hover) so they read as interactive; keep it `prefers-reduced-motion`-aware and ensure the focus ring (not just the glow) conveys state for keyboard/AT.

---

## C · Find & Calendar UX

- **C1 — Calendar filterable on the same tags as Find.** ☑ Done — `Facets` (with `showTypes={false}`) + URL state on the calendar; facet query feeds both `loadRange` and the Next-up list; live count + clear. Reuse `FacetState` + `Facets` + URL state on the calendar. Pass the facet query into both `loadRange` (month grid) and the "Next up" list. Drop or constrain the **Type** facet (calendar is events-only). _Files:_ `routes/Calendar.tsx`, `MonthCalendar.tsx`, `lib/facets.ts` (a calendar-scoped query helper). _Notes:_ keep the month `<table>` semantics + live region for result counts.
  - **C1b — Expandable month grid.** ☑ Done — the month calendar collapses behind an "Open calendar" toggle (`aria-expanded`/`aria-controls`), so the "Next up" list is the prominent default on the What's on page. Filters (C1) still drive both.

- **C2 — Friendlier filter menu (accessible pill toggles).** ☑ Done — `.facet-opt` restyled as pill toggles (fill + ✓/+ glyph so state isn't colour-only); real checkbox kept (visually hidden) so `fieldset`/`legend`/keyboard/AT semantics are intact; visible focus. Used by Find + Calendar.
  _Plan:_ keep the **real checkboxes + `fieldset`/`legend`** (best a11y), but restyle each `label` as a pressable **pill** with an obvious on/off state (filled = on, outline = off) and a tick/✕ affordance. Visually-hidden native checkbox stays the control, so keyboard + screen-reader behaviour is unchanged; group semantics preserved. Add per-group selected counts and a sticky "Clear filters". (Alternative considered: `<button aria-pressed>` toggles — also valid, but restyled checkboxes preserve group/`legend` semantics with less risk.) _Files:_ `Facets.tsx`, `components.css`. _Notes:_ on/off must be conveyed by more than colour (shape/icon/weight); contrast on filled pills ≥ AA; visible focus.

- **C3 — Expandable calendar on “What's on”.** ☑ Done — Next-up list leads; month grid behind an `aria-expanded` “Open calendar” disclosure; open/closed remembered in sessionStorage. Put the month grid behind an **“Open calendar”** disclosure so the **“Next up”** list is what people see first (more useful at a glance, especially on mobile). Accessible disclosure: a `<button aria-expanded>` toggling the grid region; remember open/closed within the session. _Files:_ `routes/Calendar.tsx`, `MonthCalendar.tsx`.

---

## D · Calendar export

- **D1 — Add to Google Calendar.** ☑ Done — new `src/lib/calendarLinks.ts` with `googleCalendarUrl()` (`action=TEMPLATE`, compact UTC `dates=startZ/endZ`, summary + record URL in details, venue/online location) and `outlookCalendarUrl()` (O365 `deeplink/compose`, ISO-8601 start/end). RecordDetail's event block now shows an accessible `<fieldset>`/`<legend>` "Add to your calendar" group: **Download (.ics)** (universal fallback, unchanged) + **Google Calendar ↗** + **Outlook ↗**, externals marked as opening in a new tab. All-day handling not needed (seed events are timed); URLs URL-encoded; verified well-formed in headless Chromium. _Notes for prod:_ UTC stamps match the existing `.ics`; add a `TZID` if BST/local-time display matters at launch. _Files:_ `lib/calendarLinks.ts`, `routes/RecordDetail.tsx`, `components.css` (`.cal-add`).

---

## E · Admin, auth & data workflows

- **E1 — Admin authentication (decision: prototype open on Pages; SSO at Supabase stage).** ☐
  _Today / GitHub Pages (current host):_ **`/admin` ships on the public Pages build and stays open** — this is purely a design + functionality prototype, so reviewers can reach the admin to try the workflow. No auth at this stage (the data is demo content in localStorage). Don't treat Pages as secure; it's a shareable prototype.
  _Vercel + Supabase (planned prod) — where real auth lands:_ **Supabase Auth via Microsoft Entra (Azure AD) SSO**, restricted to the `@manchester.ac.uk` tenant — no bespoke passwords. A **`moderator` role** (a `profiles.role` column / custom JWT claim) gates admin actions. Security is enforced at the data layer by **Supabase Row-Level Security**, not just the UI: public reads only `live` rows; inserts (submissions) require an authenticated author; updates/transitions/deletes require `moderator`. Also enable **Vercel deployment protection** on preview/staging. This is designed alongside the E4 deletion workflow and the M365/import intake (E2/E3) at the Supabase migration stage. _Ties to:_ `MIGRATION_VERCEL_SUPABASE.md §10`, `supabase/schema.sql` (RLS). _Files:_ auth guard around admin routes (Vercel only), `supabaseAdapter.ts` (session), schema RLS policies.

- **E2 — Bulk upload with review step.** ☑ **Done.** New `/admin/import` screen (4 steps:
  add data → match columns → review → done) + `src/lib/import.ts` (dependency-free CSV/TSV
  parser, header auto-mapping, per-row validation mirroring `RecordForm` + controlled-vocab
  checks with nearest-match suggestions, tolerant `dd/mm/yyyy[ hh:mm]` + ISO dates, multi-select
  on `;`/`,`, Yes/No booleans). Review step is the gate: per-row **Ready/Needs fixing**, inline
  edit of invalid (or any) fields, live ready/needs counts, import-as **queue|drafts**, optional
  **de-dupe by title** (within batch + against existing). Commit loops `api.create`, stamping
  each row `submitted`/`draft` + an audit *"Bulk imported by …"*. Caps: **500 rows / 2 MB** per
  batch (prod parses server-side under RLS). Downloadable **CSV template** (two worked examples)
  + **field legend**, both generated from the contract. axe clean (0) on all 4 steps + the queue;
  verified end-to-end (imports land in the queue). _Files:_ `routes/AdminImport.tsx`, `lib/import.ts`,
  `App.tsx` (route), `Admin.tsx` (toolbar link), `components.css` (`.import*`), reuses `lib/ics.downloadText`.
  _Decision:_ no SheetJS — its npm build carries the prototype-pollution/ReDoS advisories and the
  patched build isn't on npm, so CSV is parsed natively and `.xlsx` is handled with a "Save As CSV"
  prompt now / server-side parse in prod (keeps `npm audit` clean for the G2 story).
  <details><summary>Original design (delivered)</summary>
  _Design:_ a new admin **Import** screen.
  1. Upload `.csv`/`.xlsx` (parse client-side with SheetJS) or paste rows.
  2. **Map columns → `HubRecord`** fields; controlled-vocab columns validated against `vocabularies.ts` (reject unknown values; show suggestions).
  3. **Review table** (the gate): per-row valid/invalid, inline-editable, with the same validation as `RecordForm`. Counts of "ready / needs fixing".
  4. **Commit** → batch-create all valid rows as `submitted` (default) or `draft`, each stamped with an audit entry "Bulk imported by <actor>". Optional de-dupe by title.
  _Template:_ ship a downloadable CSV/XLSX template with the exact columns + a legend sheet listing valid vocab values (audiences, ages, subjects, types).
  _Files:_ `routes/AdminImport.tsx`, `lib/import.ts` (parse + map + validate), reuse form validation, `DataSource.create` in a loop (or a `createMany`). _Notes:_ never trust the file — validate + size/row caps; in prod the import runs server-side (Supabase) so RLS/role applies.
  </details>

- **E3 — How UoM staff submit records (+ M365 Forms).** ◐ **Spec + template done; live Form pending tenant access.**
  The column contract (form question ⇄ field ⇄ vocab) and the M365 setup recipe are documented in
  **`docs/IMPORT_TEMPLATE.md`**, and the importer ships matching **CSV template + field legend**
  downloads. M365 multi-select Choice questions join answers with `;` — exactly what E2 parses —
  so a Form built to the spec exports straight into Import → review → commit. Outstanding (needs
  tenant access): create the actual M365 Form in the @manchester tenant; the SSO self-serve path
  is part of E1.
  - **MVP (before SSO):** a **Microsoft 365 Form** whose questions mirror `HubRecord` 1:1, using **choice fields for the controlled vocabularies** (so values stay clean). M365 Forms auto-export responses to an **Excel workbook** (in SharePoint/OneDrive). FSE team periodically exports the `.xlsx` → **E2 Import → review → commit**. Yes — M365 Forms can absolutely produce an upload-convertible output; the key is constraining vocab fields to choices and matching column headers to the import template.
  - **Later (SSO live):** signed-in `@manchester` staff self-serve via the existing `RecordForm` (`/admin/new`), landing straight in the queue.
  - **Always:** admin can hand-key via `/admin/new`.
  _Deliverable:_ document the **column contract** (form question ⇄ field ⇄ vocab values) in `WORDPRESS_MAPPING.md`/a new `docs/IMPORT_TEMPLATE.md`.

- **E4 — Submitter-initiated deletion (non-admin).** ☐
  _Problem:_ submitters have no account today, so no self-serve delete.
  _Plan (staged):_
  - **MVP:** a "Request removal" affordance on the record + in the submission confirmation/email; submitter quotes the record + their email; admin **verifies the requester matches `submitter.email`**, then unpublishes/deletes. Add an admin "Removal requests" view.
  - **SSO era:** a signed-in author sees *their* submissions and can **request deletion**, which sets a `withdrawal_requested` flag/audit note — **not an instant hard delete**. Admin confirms → **soft-delete** (new `withdrawn` status: hidden from public, audit retained) → **hard purge on a retention schedule**.
  _Rationale:_ prevents accidental/abusive deletion, preserves audit integrity, and separates "content removal" from a **personal-data erasure** request (the latter routes through the UoM DPO process — see F1). _Files:_ new status in `types.ts` + `STATUS_META`, admin view, request affordance.

- **E5 — Video embeds (unlisted YouTube, with Vimeo support).** ☐
  _Decision (owner):_ video is **never self-hosted** — records hold a URL and the page embeds the
  platform player (works on GitHub Pages today; it's just an iframe). **Unlisted YouTube** is the
  primary route; **keep Vimeo possible** in the same component.
  _Plan:_ a small `lib/video.ts` that parses a watch URL → provider + id (`youtube.com/watch?v=`,
  `youtu.be/`, plus Vimeo `vimeo.com/<id>`), and a responsive 16:9 embed on the `video` record type
  (and anywhere `resource.externalUrl` is a video). Use the privacy-friendly **`youtube-nocookie.com`**
  domain; lazy-load the iframe; require a `title` for the iframe and surface a transcript/captions
  note (WCAG 2.2 AA — video needs captions + a transcript). Fall back to the current "Watch the
  video" out-link if the URL isn't a recognised provider. _Files:_ `lib/video.ts`,
  `routes/RecordDetail.tsx` (video case), maybe a `VideoEmbed` component; `RecordForm` hint text.

---

## F · Compliance

- **F1 — Privacy / data-protection statement.** ◐ **Draft built (pilot go/no-go gate).** `/privacy` route + page live (plain-English draft: what we collect, children & young people, retention tied to expiry, UK/EU residency, third parties, rights + DPO/ICO), clearly marked *Draft for review*; footer legal row links it + the UoM data-protection / privacy-information pages. axe clean. **Outstanding:** University DP sign-off; confirm lawful bases, retention periods, hosting region; mirror the UoM disclaimer/copyright/FOI/accessibility links at deployment. **(Pilot go/no-go gate.)**
  _Current state:_ the live HubLab site has **no bespoke privacy page** — only footer links to UoM central pages (Disclaimer / **Data Protection** / Copyright / **Web accessibility** / FOI) and its own `/web-accessibility/` page.
  _Plan:_
  - **Now (cheap):** add the same **footer legal row** linking to the canonical UoM pages — Data Protection (`manchester.ac.uk/about/privacy-information/data-protection/`), Disclaimer, Copyright, FOI — plus our own Web accessibility and a new HubLab privacy page.
  - **HubLab privacy notice (`/privacy`)** — needed because we process: mailing-list email + tag prefs, submitter name/email/dept, engagement analytics, and content about/for **minors**. It must cover: what we collect & why, lawful basis, **retention** (tie to `expiryDate` + a schedule), **minors' data + parental-consent handling**, **UK/EU data residency** (Supabase region — the pilot gate), third parties (ESP, Supabase, Vercel, Google Calendar links), data-subject rights + how to exercise (UoM **DPO: dataprotection@manchester.ac.uk**), and a link to the UoM central notice.
  _Notes:_ draft for **DP sign-off**; don't claim compliance until reviewed. _Files:_ `routes/Privacy.tsx`, `Layout.tsx` footer.

---

## G · Audits

- **G1 — Accessibility audit (full pass).** ☐ Beyond per-page axe: run axe on **every** route (home, find, calendar, sub-brands, detail, admin, both forms, about, privacy); keyboard-only walkthrough + focus order; reduced-motion; SR landmarks; and specifically the **new** coloured tiles (contrast), pill filters (on/off not colour-only), and clickable tags (focus + nested-interactive check). Output a short report. _Run when we reach it; re-run after each V/B/C step._

- **G2 — Security audit.** ☐
  _Current findings:_ `npm audit` = **2 high, but dev-only** (esbuild dev-server advisory via Vite) — **not in the shipped static build**; fix is a breaking Vite major, so pin/defer and document rather than force. Record `body` renders as **escaped React text** (no `dangerouslySetInnerHTML`) — no current XSS hole; **if markdown-lite rendering is added later, sanitise**.
  _Prod checklist (Vercel + Supabase):_ RLS on every table (public read `live` only; writes moderator-only); **no service-role key in the client**; env secrets server-side only; Entra SSO tenant-restricted + role claims; **protect Vercel previews**; security headers/CSP on Vercel (HSTS, X-Content-Type-Options, frame-ancestors) since Pages can't set them; validate/cap all uploads (images already capped; bulk-import rows); replace inline image **data URLs** with Supabase Storage in prod; PII minimisation + UK/EU residency + backups + retention. _Run `npm audit` + the checklist when we reach it._

---

## Suggested order
V1–V3 ☑ → A1 ☑ / A2 ☑ → B1 ☐ / B2 ☑ → C1 ☑ / C2 ☑ → D1 ☑ → F1 ◐ (privacy — unblocks pilot) → E1 (auth) → E2/E3 (import + M365) → E4 (deletion) → G1/G2 (audits, then ongoing). V4–V6 fold in alongside.

**Next up:** A/B/C/D complete; **E2 done**, **E3 spec/template done**. Remaining in the E-series:
**E1** (Entra SSO + RLS — needs tenant creds + region) and **E4** (submitter-initiated removal —
buildable now against the seam), then **G1/G2** audits. F1 stays ◐ pending University DP sign-off.
Optional polish in PROJECT_STATE §9 can slot in anywhere; FutureLab/LifeLab still have no "real
moments" photo strip (only FunLab).
