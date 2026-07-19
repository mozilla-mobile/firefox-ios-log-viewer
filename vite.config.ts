import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Pin the dev server to a dedicated port. strictPort makes Vite fail loudly
  // if the port is taken instead of silently falling back to another one —
  // which would leave Tauri's devUrl pointing at whatever else holds 5173.
  server: {
    port: 1420,
    strictPort: true,
  },
})
