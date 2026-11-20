import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  // Project page URL on GitHub Pages: https://dablon.github.io/gta-vi-strategic-map/
  base: '/gta-vi-strategic-map/',
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 4731,
    strictPort: true,
  },
})
