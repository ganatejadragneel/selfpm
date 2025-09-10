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
    // Enable minification optimizations with terser for better compression
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info'],
        passes: 2,
      },
      mangle: true,
      format: {
        comments: false,
      },
    },
    // Additional build optimizations
    sourcemap: false,
    target: ['es2020', 'chrome87', 'firefox78', 'safari14'],
    // Optimize CSS
    cssCodeSplit: true,
    cssMinify: true,
    // Increase asset inline limit
    assetsInlineLimit: 4096,
    // Enable brotli compression size reporting
    reportCompressedSize: true,
  },
  // Optimize dependencies pre-bundling
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'date-fns',
      '@supabase/supabase-js',
      'zustand',
      'lucide-react',
    ],
    exclude: [],
  },
  // Server optimizations for development
  server: {
    open: false,
    cors: true,
    // Enable compression in dev
    middlewareMode: false,
  },
})
