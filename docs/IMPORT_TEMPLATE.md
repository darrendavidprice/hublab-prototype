# IMPORT_TEMPLATE.md — bulk import & Microsoft 365 Forms input spec

This is the **column contract** for the admin bulk importer (`/admin/import`, the E2
screen) and the matching intake via **Microsoft 365 Forms** (E3). A spreadsheet that
follows this spec drops straight into the importer; an M365 Form whose questions mirror
these columns produces an export that does the same.

Source of truth in code: `src/lib/import.ts` (`IMPORT_FIELDS`). The in-app
**"Download field legend"** button always reflects the current contract, and
**"Download CSV template"** gives a ready-to-fill file with two worked examples — prefer
those over copying tables by hand.

Nothing imported ever goes live automatically. Rows land as **In queue** (default) or
**Drafts**, and every imported record gets an audit entry *"Bulk imported by …"*.

---

## 1. File format

- **CSV or tab-separated**, UTF-8. One **header row**, then **one row per record**.
- Headers must match the **Column header** names below (matching ignores case, spaces,
  punctuation and accents, so `Age groups`, `age_groups` and `AGE GROUPS` all match).
- Columns the file doesn't have are fine; columns the importer doesn't recognise are
  **ignored** (so the extra metadata M365 adds — response ID, start/completion time — is
  harmless).
- **Excel (.xlsx):** in Excel choose **File → Save As → CSV** and upload that. The live
  (Supabase) build parses `.xlsx` directly because parsing happens server-side there.

## 2. The columns

`*` = always required. Conditionally required fields say when.

| Column header | Field | Required | Accepts |
|---|---|---|---|
| Type `*` | type | always | one value from **Types** below |
| Title `*` | title | always | short text |
| Summary `*` | summary | always | one or two sentences |
| Description | body | — | longer text |
| Audiences `*` | audiences | always | one or more **Audiences** (separate with `;`) |
| Age groups | ageGroups | — | one or more **Age groups** (separate with `;`) |
| Subjects | subjects | — | one or more **Subjects** (separate with `;`) |
| Useful for teachers | usefulForTeachers | — | Yes / No |
| Featured | featured | — | Yes / No |
| Go-live date | goLiveDate | — | `dd/mm/yyyy` (blank = today) |
| Expiry date | expiryDate | — | `dd/mm/yyyy` (blank = +1 year; events: just after the end) |
| Image URL | promoImage | — | link to an already-hosted image |
| Image description | promoImageAlt | if image given | text (alt for screen readers) |
| Image caption | caption | — | text |
| Event start | event.start | for events | `dd/mm/yyyy hh:mm` |
| Event end | event.end | for events | `dd/mm/yyyy hh:mm` |
| Venue | event.venue | — | text |
| Online event | event.isOnline | — | Yes / No |
| Booking link | event.bookingUrl | — | URL (we link out, never host booking) |
| Booking note | event.capacityNote | — | text |
| Link URL | resource.externalUrl | — | URL (links / videos) |
| File URL | resource.fileUrl | — | URL (downloads) |
| File label | resource.fileLabel | — | text, e.g. `PDF, 2.4 MB` |
| Duration | resource.durationNote | — | text, e.g. `45 min activity` |
| Plain-English summary | research.plainSummary | for explainers | text |
| Researchers | research.researchers | — | text |
| Department | research.department | — | text |
| Paper / DOI link | research.paperUrl | — | URL |
| Your name `*` | submitter.name | always | text |
| Your email `*` | submitter.email | always | a `@manchester.ac.uk` address in the live workflow |
| Your department | submitter.department | — | text |

## 3. Controlled values (use these exactly)

These are the only accepted values for the controlled fields. The importer rejects
anything else and suggests the nearest match, so constraining the M365 questions to these
options keeps the data clean.

- **Types:** Event · Video · Activity to try at home · Book · Work experience ·
  Tutoring & mentoring · Schools resource · Teaching guide · Link worth a look ·
  Hands-on activity · What our scientists are working on
- **Audiences:** FunLab · FutureLab · LifeLab
- **Age groups:** Under 5s · Primary (5–11) · Ages 11–14 · Ages 14–16 · Ages 16–18 · Adults (18+)
- **Subjects:** Biology & life · Chemistry · Physics · Engineering · Maths ·
  Computing & AI · Space · Environment · All-round STEM

**Multi-selects** (Audiences, Age groups, Subjects): list several separated by `;` (or `,`),
e.g. `FunLab; FutureLab`.

**Dates:** UK order — `dd/mm/yyyy`, and `dd/mm/yyyy hh:mm` for event times (24-hour).
**Yes/No:** `Yes`, `Y`, `True`, `1` all read as yes; blank / `No` / `N` / `0` read as no.

## 4. The review gate

After matching columns, every row is validated with the **same rules as the submission
form** plus the vocabulary checks. Each row shows **Ready** or **Needs fixing**; invalid
fields are editable in place (with the suggestion shown). Only **Ready** rows import; the
rest stay for you to fix or drop. Optional **"Skip titles that already exist"** de-dupes
against current content and within the batch.

## 5. Limits

- Up to **500 rows** and **2 MB** per batch (import larger sets in batches).
- The prototype parses the file in the browser; the production build runs this same
  validation **server-side** (Supabase) so Row-Level Security and the moderator role apply,
  and image URLs become Supabase Storage uploads.

---

## 6. Setting up the Microsoft 365 Form (E3 intake)

Goal: a Form whose **question titles equal the Column headers** above and whose
controlled questions are **Choice** questions limited to the values in §3. M365 Forms
auto-collects responses into an Excel workbook (in SharePoint/OneDrive); the FSE team
periodically exports it and runs it through the importer.

1. **Create the questions**, titled exactly as the Column headers (e.g. *Type*, *Title*,
   *Summary*, *Audiences*, *Event start*…). Mark Type, Title, Summary, Audiences, Your
   name and Your email as **required**.
2. **Controlled fields → Choice questions** with the §3 options pasted as the choices:
   - *Type* — single choice (the Types list).
   - *Audiences*, *Age groups*, *Subjects* — Choice with **"Multiple answers" on**. M365
     joins multiple selections with `;`, which is exactly what the importer expects.
   - *Useful for teachers*, *Featured*, *Online event* — Choice (Yes / No).
3. **Dates** — use **Date** questions for Go-live / Expiry; for *Event start* / *Event
   end* either a Date question plus a short-text time, or a single short-text question in
   `dd/mm/yyyy hh:mm`. (Whatever Excel exports, the importer's tolerant date parser
   accepts ISO and `dd/mm/yyyy[ hh:mm]`.)
4. **Conditional sections** — use Form **branching** so event questions only show when
   *Type = Event*, and the research questions only when *Type = What our scientists are
   working on*. Keeps responses tidy and matches the conditional-required rules.
5. **Export & import** — in Forms, **Open in Excel** (or download responses) → **Save As
   CSV** → upload at `/admin/import`. The auto-collected M365 columns (ID, Start/Completion
   time, plus the respondent's email/name if the form isn't anonymous) are simply ignored;
   you can also map the form's automatic Email column to *Your email* on the matching step
   instead of asking for it again.

> **Privacy note:** the form collects submitter name/email and content that may concern
> minors — covered by the HubLab privacy notice (`/privacy`, F1) and gated on University
> DP sign-off. If the form is set to record respondent identity automatically, say so in
> the form description and align retention with the notice.

## 7. Keeping this in sync

`IMPORT_FIELDS` in `src/lib/import.ts` is authoritative. If a field or vocabulary value
changes there (and in `src/data/vocabularies.ts`), this document, the downloadable
template/legend, and the M365 question list should be updated to match.
