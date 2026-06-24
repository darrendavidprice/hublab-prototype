# RESUME_PROMPT.md

Copy the block below into a **new chat** (ideally inside the same Project, so the brand assets
are available). Attach the latest `hublab-prototype-v0.9.0.zip` first.

---

You are picking up an in-progress build. I've attached the HubLab prototype
(`hublab-prototype-v0.9.0.zip`) — a Vite + React + TypeScript front-end for the University of
Manchester FSE "HubLab" engagement platform (three sub-brands: FunLab, FutureLab, LifeLab).

**Before doing anything**, read these in order:
1. `docs/PROJECT_STATE.md` — the single source of truth (locked decisions, architecture map,
   phase status, §9 enhancements, §10 Vercel + Supabase migration plan).
2. `docs/ITERATION_BACKLOG.md` — the **ordered, steppable to-do list** with a status against
   each item (☑ done, ◐ in progress, ☐ to do) and design notes. This is what we work through.
3. `docs/CHANGELOG.md` — versioning scheme + history (current build **v0.9.0**).
4. Skim `docs/WORDPRESS_MAPPING.md` (prototype → WordPress/Supabase mapping) and
   `docs/IMPORT_TEMPLATE.md` (the M365 intake / bulk-import column contract).

Where things stand (all green, `npm run build` passes, axe = 0 violations across touched routes):
- Build phases 0–5 complete; **Submission UX** upgrade done (drafts, inline validation, image
  preview, confirmation screen).
- **Visual direction V1–V6 done:** brand textures/glows, real transparent lab logos in
  `public/brand/labs/`, branded per-lab home tiles, per-lab `--lab-radius`, Zilla Slab headings
  (revert note in `tokens.css`). **A1** photography in place (Home people-band + FunLab "real
  moments" strip); **A2** About page live; **B1/B2** logo home-link + clickable tags; **C1–C3**
  calendar filters / pill toggles / "Open calendar" disclosure; **D1** Google/Outlook calendar links.
- **E2** bulk import (`/admin/import`) + **E3** intake spec/template done.
- **E5** video embeds done: `lib/video.ts` (YouTube + Vimeo URL → embed) + `VideoEmbed`
  (responsive 16:9, lazy, youtube-nocookie/Vimeo dnt, iframe title + captions/transcript note);
  unrecognised URLs fall back to a "Watch the video" out-link.
- **v0.9.0 additions:** admin **Preview submitted content** disclosure (thumbnail + one-click
  file/video/link access) on the queue + tables; submission-form **stock-imagery picker**
  (`lib/stockImages.ts`); a new physics **video** seed record.
- **F1 privacy** page (`/privacy`) drafted + footer legal row — needs University DP sign-off.

Locked constraints (don't drift):
- Data layer is the swap point — everything goes through `DataSource` in `src/data/api.ts`
  (`LocalStorageAdapter`, seeded from `src/data/seed.ts`). `SupabaseAdapter` is already drafted
  in `src/data/`. UI must not bypass the seam.
- Design system is locked: tokens in `src/styles/tokens.css`, per-lab theming via `[data-lab]`,
  reusable classes in `src/styles/components.css`. Don't redesign; extend.
- Accessibility floor WCAG 2.2 AA — keep axe clean.
- Tone: plain, audience-first, sentence case, no jargon.
- Media: images/docs simulate as inline data URLs now (graduate to Supabase Storage); **video is
  never self-hosted** — embed YouTube/Vimeo (E5).
- `/admin` deliberately **stays open on the public Pages build** (prototype, demo data only);
  real auth (Entra SSO + moderator role + Supabase RLS) is designed at the Supabase stage.

Working method:
1. Unzip; `npm install`; confirm `npm run build` is green before changing anything.
2. Small steps; after meaningful UI changes, build, screenshot with headless Chromium, and
   review your own screenshots.
   - Screenshot/axe harness (the Playwright CDN is blocked here): use the chromium already at
     `/opt/pw-browsers/chromium-1194/chrome-linux/chrome` via `executablePath`; serve `dist/`
     with a tiny in-process Node `http` server (index.html fallback), **not** `vite preview`;
     `npm i -D playwright` for the API, then **uninstall it** before re-zipping so deps match.
3. Re-run axe (inject `node_modules/axe-core/axe.min.js`, call `axe.run`) on pages you touch.
4. Keep `docs/PROJECT_STATE.md`, `docs/ITERATION_BACKLOG.md`, `docs/WORDPRESS_MAPPING.md` and
   `docs/CHANGELOG.md` updated; bump `package.json` version; name the hand-off
   `hublab-prototype-v<version>.zip`; re-zip excluding `node_modules`/`dist`/`.git`.

What I want you to work on this session: <PICK THE NEXT ITEMS FROM `docs/ITERATION_BACKLOG.md`.
Best buildable-now candidate: **E4** (submitter-initiated removal — a "Request removal" affordance
on the record + a "Removal requests" admin view; soft-delete with audit retained, not instant
hard delete). Then **G1** (full a11y audit + report) and **G2** (security review + report) when
ready. Still gated on me: Supabase UK/EU region, F1 DPO sign-off, Entra tenant creds (E1/E3 live),
the deployed Pages URL, brand-asset licensing. Tell me which and I'll step through them.>

---
