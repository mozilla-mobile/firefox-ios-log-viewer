import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// https://vite.dev/config/
export default defineConfig({
  // Inline all JS/CSS into a single dist/index.html so the app can be opened
  // directly from the filesystem (file://) with no server — just double-click.
  plugins: [react(), viteSingleFile()],
})
