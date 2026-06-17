import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' makes the built site work both when opened directly (file://)
// and when served from any GitHub Pages / Netlify subpath. No edits needed to deploy.
export default defineConfig({
  plugins: [react()],
  base: './',
})
