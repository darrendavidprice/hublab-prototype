# RESUME_PROMPT.md

Copy the block below into a **new chat** (ideally inside the same Project, so the brand assets
are available). Attach the latest `hublab-prototype-phase5.zip` first.

---

You are picking up an in-progress build. I've attached the HubLab prototype
(`hublab-prototype-phase5.zip`) — a Vite + React + TypeScript front-end for the University of
Manchester FSE "HubLab" engagement platform (three sub-brands: FunLab, FutureLab, LifeLab).

**Before doing anything**, read these in order:
1. `docs/PROJECT_STATE.md` — the single source of truth (locked decisions, architecture map,
   phase status, §9 enhancements, §10 Vercel + Supabase migration plan).
2. `docs/ITERATION_BACKLOG.md` — the **ordered, steppable to-do list** with a status against
   each item (☑ done, ◐ in progress, ☐ to do) and design notes. This is what we work through.
3. Skim `docs/WORDPRESS_MAPPING.md` (prototype → WordPress/Supabase mapping).

Where things stand (all green, `npm run build` passes, axe = 0 violations across all routes):
- Build phases 0–5 complete; **Submission UX** upgrade done (drafts, inline validation, image
  preview, confirmation screen).
- **Visual direction V1–V6 done:** brand textures/glows, real transparent lab logos in
  `public/brand/labs/`, branded per-lab home tiles, per-lab `--lab-radius`, Zilla Slab headings
  (revert note in `tokens.css`). A1 photography: FunLab illustrated gallery shipped; the two
  **people-photo bands are still waiting on real event photos** (attach them to populate).
- **F1 privacy** page (`/privacy`) drafted + footer legal row — needs University DP sign-off.
- **B2 + C done:** tag chips/age/subject tags link to the filtered directory (with glow); the
  calendar filters on the same tags; filters are accessible pill toggles; the calendar is behind
  an "Open calendar" disclosure with "Next up" leading.

Locked constraints (don't drift):
- Data layer is the swap point — everything goes through `DataSource` in `src/data/api.ts`
  (`LocalStorageAdapter`, seeded from `src/data/seed.ts`). `SupabaseAdapter` is already drafted
  in `src/data/`. UI must not bypass the seam.
- Design system is locked: tokens in `src/styles/tokens.css`, per-lab theming via `[data-lab]`,
  reusable classes in `src/styles/components.css`. Don't redesign; extend.
- Accessibility floor WCAG 2.2 AA — keep axe clean.
- Tone: plain, audience-first, sentence case, no jargon.
- `/admin` deliberately **stays open on the public Pages build** (prototype, demo data only);
  real auth (Entra SSO + moderator role + Supabase RLS) is designed at the Supabase stage.

Working method:
1. Unzip; `npm install`; confirm `npm run build` is green before changing anything.
2. Small steps; after meaningful UI changes, build, screenshot with headless Chromium
   (Playwright), and review your own screenshots.
3. Re-run axe (inject `node_modules/axe-core/axe.min.js`, call `axe.run`) on pages you touch.
4. Keep `docs/PROJECT_STATE.md`, `docs/ITERATION_BACKLOG.md` and `docs/WORDPRESS_MAPPING.md`
   updated as you go.
5. Re-zip excluding `node_modules`/`dist` and hand back via the outputs folder.

What I want you to work on this session: <PICK THE NEXT ITEMS FROM `docs/ITERATION_BACKLOG.md`.
Good candidates: **A1** (drop in the real event photos I'll attach — Home "Get to know us"
band + a FunLab "real moments" strip), **D1** (Add to Google Calendar links), **A2** (About
page). The E-series (auth, bulk import + M365 intake, submitter deletion) and the full
security/accessibility audits (G1/G2) are best tackled together at the Supabase migration stage.
Tell me which and I'll step through them.>

---
