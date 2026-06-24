import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import pkg from './package.json'

// base: './' makes the built site work both when opened directly (file://)
// and when served from any GitHub Pages / Netlify subpath. No edits needed to deploy.
// __APP_VERSION__ / __BUILD_DATE__ are injected from package.json at build time so the
// running site can show which build it is (see the footer + docs/CHANGELOG.md).
export default defineConfig({
  plugins: [react()],
  base: './',
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString().slice(0, 10)),
  },
})
