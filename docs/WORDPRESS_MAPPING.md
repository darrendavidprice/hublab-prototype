# WORDPRESS_MAPPING.md — prototype → WordPress (and Supabase) handoff

This document maps every concept in the prototype to how it would be built in WordPress,
and notes the Supabase equivalent. It is maintained as the build grows so the digital team
can rebuild on-platform with no guesswork. The prototype's `src/data/types.ts` is the
authoritative data contract.

## Platform shape
The core is a textbook WordPress fit: a custom post type + controlled taxonomies + an
editorial workflow + role-based access. It likely needs a **standalone WordPress** (full
plugin/theme latitude), not the locked central multisite. The same React front end can
remain and call WordPress's REST API (headless), or the front end can be rebuilt as a theme.

## Data source swap point
Everything routes through `DataSource` (`src/data/api.ts`). A pilot/production build
implements the same interface against one of:
- **Headless WordPress** — WP REST API (`/wp-json/wp/v2/record`), ACF-to-REST for fields.
- **Supabase** — Postgres tables + auto REST/Realtime; auth + storage included.

---

## Record model → WordPress

| Prototype (`HubRecord`) | WordPress implementation | Supabase |
|---|---|---|
| Record (all types) | Custom Post Type `record` | `records` table |
| `type` | ACF select (single) OR a `record_type` taxonomy | enum column |
| `title`, `summary` | Post title; `summary` = ACF text / excerpt | columns |
| `body` | Post content (block editor) | text column |
| `audiences[]` (sub-brand) | `audience` taxonomy (multi-select), terms: funlab/futurelab/lifelab | join table |
| `ageGroups[]` | `age_group` taxonomy | join table |
| `subjects[]` | `subject` taxonomy | join table |
| `usefulForTeachers` | ACF true/false → drives teacher filter | boolean |
| `featured` | ACF true/false (or `featured` term) | boolean |
| `promoImage`/alt/`caption` | Featured image + ACF caption | storage + columns |
| `goLiveDate` | Native scheduled publish | timestamp |
| `expiryDate` | PublishPress Future (auto-unpublish on date) + custom pre-expiry reminder (cron) | timestamp + scheduled fn |
| `event{}` (start/end/venue/booking) | The Events Calendar fields, or ACF group shown when type=event | columns |
| `resource{}` (file/external/duration) | ACF group (conditional on type) | columns |
| `research{}` (plainSummary/researchers/DOI) | ACF group (conditional on type=research_explainer) | columns |
| `engagement{}` | Custom counters (meta) or a votes plugin; later real | counters table |
| `submitter{}` | Post author / ACF author fields | FK to users |
| `audit[]` | Post revisions + an audit log plugin (e.g. Simple History) | audit table |

## Controlled vocabularies → taxonomies
`vocabularies.ts` lists are admin-managed taxonomy terms. Submitters pick from fixed terms
(no free-text), preventing fragmentation. Labels are the user-facing plain-language strings.

## Workflow (`RecordStatus`) → editorial workflow
| Prototype state | WordPress |
|---|---|
| draft / submitted / needs_clarification / approved / live / unpublished / expired / rejected | **PublishPress** custom statuses + editorial comments + email notifications. Native `pending` ≈ submitted; `publish` ≈ live; scheduled = approved+future goLive. |
Transitions + audit map to PublishPress notifications and Simple History entries. The
prototype's `/admin` implements this end to end: a moderation queue (approve / send back with
a note / reject), management actions (unpublish, republish, bring-forward to live, feature,
delete), and an **expiry tab** that surfaces expiring-soon items (the pre-expiry reminder set)
and expired items for renew-or-delete. Every status change goes through the data layer's
`transition(id, to, by, note)`, which appends an `AuditEntry` — the per-record "History" view
is that audit. In WP: status changes = PublishPress transitions + notification emails; the
expiry reminder = a cron a few days before `expiryDate`; auto-unpublish = PublishPress Future;
the audit = Simple History / post revisions.

## Public views → WordPress
- **Umbrella directory + faceted filter** → **FacetWP** over the `record` CPT (audience,
  age, subject, type, teacher facets). Accessible markup required. The prototype keeps filter
  state in the URL as comma-lists — `/find?aud=funlab,futurelab&age=primary&type=event&teachers=1&q=volcano`
  (see `src/lib/facets.ts`). FacetWP exposes the same idea via its own query-string facets, so
  these shareable filtered links port across with a thin rewrite of param names.
- **Events calendar (date range)** → **The Events Calendar** plugin views. The prototype's
  calendar fetches each visible month through the data layer's `eventsBetween` query
  (`MonthCalendar` → `api.query({ types:['event'], eventsBetween })`); in WP this is the
  plugin's month/list view bounded by the same start/end window.
- **"Add to calendar"** → the prototype generates a valid iCalendar file client-side
  (`src/lib/ics.ts`) and, alongside it, one-click **Google Calendar** and **Outlook/O365**
  deep links (`src/lib/calendarLinks.ts`, D1). The Events Calendar plugin provides native
  iCal **and** Google Calendar export per event out of the box, which replaces both the
  hand-rolled `.ics` builder and the deep-link helper. (If staying headless, keep the helper —
  it's pure URL construction, no backend.)
- **Engagement (thumbs / rating / view + download counts)** → the prototype writes through
  `api.update` (the `DataSource`). In WP this is a counters/votes plugin or custom REST
  endpoints incrementing post meta; views/downloads increment server-side on view/file-serve.
- **Sub-brand pages** (`/funlab` `/futurelab` `/lifelab`) → archive templates filtered by
  `audience` term, each themed by lab colour; same records, filtered. Implemented as one
  React component themed by a `lab` prop (hero → featured → coming-up → explore-by-type →
  full grid → lab-tagged signup). **Cross-category is the whole point**: the page runs a
  single overlap query on the `audience` term, so a record tagged with several labs appears
  on each matching page (in WP, an `audience` taxonomy archive already behaves this way). The
  "explore by type" tiles are deep links into the directory pre-filtered to the lab + a type
  (`/find?aud=<lab>&type=<type>`), which map to FacetWP archive URLs.
- **Static pages** (`/about`, `/privacy`) → ordinary WordPress **Pages** (not the `record`
  CPT): an About page (paraphrased mission/heritage copy + event imagery in image+text blocks)
  and the privacy notice. In WP these are block-editor Pages linked from the primary nav and
  footer; the prototype's `routes/About.tsx` and `routes/Privacy.tsx` are the content source.
- **Per-type detail layouts** → `single-record.php` dispatching to template parts per type,
  or block patterns per type. The prototype's `RecordDetail` dispatcher (event / video /
  downloadable / teaching_guide / research_explainer / activity / schools_resource / book /
  work_experience / tutoring / external_link) is the template-part map.

## Accounts, submissions, mailing list (later phases)
- **@manchester self-service accounts** → SSO via Microsoft Entra/Azure AD plugin
  (restricts to tenant/domain; no bespoke passwords). MVP interim: M365 form → admin re-keys.
  Design the M365 form fields to mirror `HubRecord` so it's a drop-in later. The prototype's
  submission form (`/admin/new`, `RecordForm`) already mirrors the model field-for-field
  (type-conditional event / resource / research blocks included), so it doubles as the field
  spec for that M365 form. The form's submission UX has on-platform equivalents:
  - **Save as draft** → status `draft` (`HubRecord.status`). In WP this is the native `draft`
    post status (private to the author until submitted for review → `pending`); in Supabase the
    `draft` value of the `record_status` enum, kept out of public reads by the existing RLS
    `live`-only policy. Drafts surface in the prototype's admin **All content** tab with a
    "Submit for review" action (→ `transition(id,'submitted',…)`).
  - **Inline per-field validation + an error summary that links to each field** → in WP,
    Gravity Forms / ACF field validation (or REST 422 responses surfaced inline); the
    accessible pattern (per-field `aria-invalid` + `aria-describedby`, a `role="alert"` summary
    of focusable error links) carries across unchanged. Required-alt-text-when-an-image-is-set
    is enforced here and should be replicated server-side.
  - **Client-side image preview** (`src/lib/image.ts`) downscales the chosen file to a small
    inline data URL purely for preview/demo (the LocalStorage store has a tight quota). On
    platform this is replaced by a real upload: WordPress **media library** (featured image) or
    **Supabase Storage**, persisting only the returned URL into `promoImage` — no other UI change.
  - **Confirmation screen** (`SubmissionConfirmation`) recaps the submitted record and explains
    the next step (queue vs draft) → a form confirmation/"thank you" screen in WP; the recap is
    derived entirely from the saved `HubRecord`, so it ports directly.
- **Mailing list w/ tag preferences** → integrate University ESP (e.g. Dotdigital/Mailchimp)
  via its WP plugin; tag prefs = ESP groups/segments. The prototype signup
  (`MailingListSignup`) collects an email plus tag preferences — the three sub-brands
  (funlab/futurelab/lifelab) and an "Events & what's on" tag — which become the ESP
  groups/segments. Not built in-house.
- **Booking** → link out to University events system / Eventbrite (`event.bookingUrl`).

## Accessibility
WCAG 2.2 AA. Reduced-motion control (prototype `MotionContext`) → in WP, a theme-level
toggle + `prefers-reduced-motion` CSS. The video hero is decorative and silent: in the
prototype it's `aria-hidden`, never autoplays under reduced motion, has a visible play/pause
control, and the live `<h1>` carries the real heading (not baked into the video). Replicate
this in WP rather than relying on the wordmark/strapline burned into the footage. If hero
video ever carries audio/speech, add captions. Faceted filters use `fieldset`/`legend`
groups; the calendar is a semantic `<table>` with a caption and column headers; result
counts and the visible month use polite live regions. Run axe/Pa11y in CI.
