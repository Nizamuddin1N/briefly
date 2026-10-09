import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Pinned to 3000 so the backend's default CORS origins cover the dev server.
  server: { port: 3000, strictPort: true },
})
