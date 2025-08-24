import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React ecosystem
          'react-vendor': ['react', 'react-dom'],
          
          // UI/Animation libraries
          'ui-vendor': [
            'lucide-react',
            '@dnd-kit/core',
            '@dnd-kit/sortable',
            '@dnd-kit/utilities'
          ],
          
          // Date/Time utilities
          'date-vendor': ['date-fns'],
          
          // Database/Storage
          'supabase-vendor': ['@supabase/supabase-js']
        }
      }
    },
    // Enable chunk size warnings for bundles larger than 500kb
    chunkSizeWarningLimit: 500
  }
})
