# Deploy to GitHub Pages

This prototype ships with a GitHub Actions workflow (`.github/workflows/deploy.yml`) that
builds the site and publishes it to GitHub Pages automatically. It works as a project site
(`https://<user>.github.io/<repo>/`) because `vite.config` sets `base: './'` and the app uses
`HashRouter` (no server rewrites needed).

## What to upload
Upload the **contents of the `hublab/` folder** from the zip to the repository root — i.e. the
repo root should contain `package.json`, `index.html`, `src/`, `public/`, `.github/`, `docs/`,
etc.

**Do not upload** `node_modules/` or `dist/` (they're excluded from the zip already, and a
`.gitignore` covers them). GitHub Actions installs and builds for you.

## One-time setup
1. Create a new GitHub repository (public or private — Pages works on both for most plans).
2. Add the files. Either:
   - **Web upload:** unzip locally, then on the repo's main page choose **Add file → Upload
     files**, drag in everything (you may need to upload `src/`, `public/`, `docs/` and the
     `.github/` folder separately so the folder structure is preserved), commit to `main`; or
   - **Command line:**
     ```bash
     cd hublab
     git init -b main
     git add .
     git commit -m "HubLab prototype"
     git remote add origin https://github.com/<user>/<repo>.git
     git push -u origin main
     ```
     > Note: `.github/` is a hidden folder — make sure it's included (the CLI includes it; the
     > web uploader can miss dot-folders, so drag `.github/workflows/deploy.yml` in explicitly
     > if needed).
3. In the repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
4. Push to `main` (or use **Actions → Deploy to GitHub Pages → Run workflow**). The workflow
   runs `npm ci && npm run build` and publishes `dist/`.
5. The live URL appears in **Settings → Pages** and on the Actions run
   (`https://<user>.github.io/<repo>/`).

## Updating later
Any push to `main` re-builds and re-deploys. To preview locally first: `npm install` then
`npm run dev` (or `npm run build && npm run preview`).

## Notes / gotchas
- `/admin` is intentionally reachable on the public build — this is a design + functionality
  prototype with demo data only (localStorage). Real authentication is planned for the
  Supabase/Vercel stage (see `ITERATION_BACKLOG.md` E1).
- Data is seeded into the browser's localStorage from `src/data/seed.ts`; there's a "Reset demo
  data" button in `/admin`. Nothing is stored server-side.
- There are both `vite.config.js` and `vite.config.ts` in the repo (identical intent) — minor
  cleanup for a future session; the build is unaffected.
