import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'  // ← phải đúng tên này

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
})
