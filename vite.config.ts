import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
    include: ['react', 'react-dom']
  },
  server: {
    port: 5173,
    strictPort: false,
    hmr: {
      overlay: false
    }
  }
})