# HubLab — discovery platform prototype

A backend-agnostic front-end prototype for the **HubLab** website (University of
Manchester, Faculty of Science & Engineering engagement portfolio). One central
repository of tagged "records" (events + resources), surfaced through a HubLab
umbrella site, three sub-brand views (FunLab / FutureLab / LifeLab), and an
internal moderation/admin workflow.

> **Prototype** — all content is illustrative. Data lives in the browser
> (localStorage); see `docs/WORDPRESS_MAPPING.md` for the route to real data, and
> `docs/MIGRATION_VERCEL_SUPABASE.md` for the Vercel + Supabase plan.

## Run it locally

You need **Node.js 18+** (CI uses 20). Get it from <https://nodejs.org> if you don't
have it (`node -v` to check). Then, from inside this project folder:

```bash
npm install      # one-time — downloads dependencies
npm run dev      # starts the dev server with hot reload
```

Open the URL it prints (usually <http://localhost:5173>). To preview the real
production build instead:

```bash
npm run build    # type-check + build to dist/
npm run preview  # serve the built site locally
```

**Note on data:** the prototype saves records in your browser's localStorage, so
anything you add or moderate persists per-browser. The Admin page has a **Reset demo
data** button to restore the original seed content.

## Share it with the team

- **Live link (recommended): GitHub Pages.** Push the repo to GitHub, then
  **Settings → Pages → Source: GitHub Actions**. The included
  `.github/workflows/deploy.yml` builds and publishes on every push to `main`, giving
  a URL like `https://<org>.github.io/<repo>/` that anyone can open — no installs.
  (Private repos need a paid GitHub plan for Pages; otherwise make the repo public or
  use Vercel, which serves private repos free.)
- **Vercel / Netlify / Cloudflare Pages.** One-click from a GitHub repo: build command
  `npm run build`, output directory `dist`. This is also the first step toward the
  Supabase backend.
- **Zip.** Fine for a developer who'll run it locally; non-technical reviewers can't
  open it without Node, so prefer a live link for wider review.

Because data lives in each visitor's browser, every reviewer gets their own clean copy
— handy for stakeholder demos. Send teammates `docs/REVIEW_NOTES.md` alongside the link.

## What's built (Phases 0–5)

- **Umbrella site** — video hero, featured pieces, explore-by-audience, what's-on teaser, mailing-list signup.
- **Find** — faceted directory (audience / age / subject / type / teacher + search), filter state in the URL.
- **What's on** — accessible month calendar + upcoming list.
- **Record detail** — a layout per content type, with engagement (thumbs/rating/views), add-to-calendar, related items.
- **Sub-brand pages** — FunLab / FutureLab / LifeLab, each themed, with cross-category surfacing.
- **Admin** — submission form, moderation queue, manage (unpublish/republish/feature/delete), expiry tab + reminders, audit trail.
- **Accessibility** — WCAG 2.2 AA target; axe automated audit clean. Skip link, visible focus, semantic landmarks, fieldset/legend filters, table calendar, live regions, and a motion toggle that honours `prefers-reduced-motion`.

## Architecture (where to look)

- `src/data/types.ts` — the data contract (`HubRecord`, statuses, query).
- `src/data/api.ts` — `DataSource` interface + `LocalStorageAdapter`. **This is the swap point** for a real backend.
- `src/data/vocabularies.ts`, `src/data/seed.ts` — controlled tags + demo content.
- `src/routes/`, `src/components/`, `src/lib/`, `src/styles/` — UI.
- `docs/PROJECT_STATE.md` — single source of truth (decisions, architecture, phase status, enhancements, migration plan).
- `docs/WORDPRESS_MAPPING.md` — how every concept maps to WordPress / Supabase.
- `docs/MIGRATION_VERCEL_SUPABASE.md` — step-by-step Vercel + Supabase migration.
- `docs/REVIEW_NOTES.md` — a short note to hand reviewers.
- `docs/RESUME_PROMPT.md` — paste-ready prompt to continue work in a fresh session.

## Deploy

### GitHub Pages
Push to `main`; `.github/workflows/deploy.yml` builds and publishes `dist/`. In the repo:
**Settings → Pages → Build and deployment → Source: GitHub Actions**. `base: './'` +
HashRouter mean it works on a project subpath with no extra config.

### Static host (Vercel / Cloudflare Pages / Netlify)
Build command `npm run build`, output directory `dist`. No server rewrites needed
(HashRouter). To move off hash URLs later, switch to `BrowserRouter` and add a SPA
fallback (`/* -> /index.html`).
