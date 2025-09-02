import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // React ecosystem
          if (id.includes('react') || id.includes('react-dom')) {
            return 'react-vendor';
          }
          
          // Supabase
          if (id.includes('@supabase/supabase-js')) {
            return 'supabase-vendor';
          }
          
          // Date utilities
          if (id.includes('date-fns')) {
            return 'date-vendor';
          }
          
          // DnD Kit
          if (id.includes('@dnd-kit')) {
            return 'dnd-vendor';
          }
          
          // Lucide icons - split from other UI
          if (id.includes('lucide-react')) {
            return 'icons-vendor';
          }
          
          // CSV parsing
          if (id.includes('papaparse')) {
            return 'csv-vendor';
          }
          
          // State management
          if (id.includes('zustand')) {
            return 'state-vendor';
          }
          
          // Large modals/components - separate chunks
          if (id.includes('/TaskModal') || id.includes('TaskModal.tsx')) {
            return 'task-modal';
          }
          
          if (id.includes('/BulkUploadModal') || id.includes('BulkUploadModal.tsx')) {
            return 'bulk-modal';
          }
          
          if (id.includes('/ActivityTrackerModal') || id.includes('ActivityTrackerModal.tsx')) {
            return 'activity-modal';
          }
          
          if (id.includes('/ProgressAnalyticsDashboard') || id.includes('ProgressAnalyticsDashboard.tsx')) {
            return 'analytics';
          }
          
          // Node modules
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    },
    // Optimize chunk size warnings
    chunkSizeWarningLimit: 400,
    // Enable minification optimizations (using default esbuild)
    minify: true,
    // Additional build optimizations
    sourcemap: false,
    target: ['es2020', 'chrome58', 'firefox57', 'safari11'],
  }
})
