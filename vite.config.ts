import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Bundle analyzer - generates stats.html after build
    visualizer({
      filename: 'dist/bundle-analysis.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
      template: 'treemap', // 'treemap', 'sunburst', 'network'
    }) as any,
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Core React ecosystem - Critical for initial load
          if (id.includes('react') || id.includes('react-dom') || id.includes('scheduler')) {
            return 'react-vendor';
          }

          // Authentication and backend
          if (id.includes('@supabase/supabase-js') || id.includes('@supabase')) {
            return 'supabase-vendor';
          }

          // Date and time utilities
          if (id.includes('date-fns')) {
            return 'date-vendor';
          }

          // Drag and drop functionality
          if (id.includes('@dnd-kit')) {
            return 'dnd-vendor';
          }

          // Icons - Large icon sets
          if (id.includes('lucide-react')) {
            return 'icons-vendor';
          }

          // State management
          if (id.includes('zustand') || id.includes('immer') || id.includes('valtio')) {
            return 'state-vendor';
          }

          // File processing utilities
          if (id.includes('papaparse') || id.includes('file-saver') || id.includes('jszip')) {
            return 'file-utils-vendor';
          }

          // Validation and schema libraries
          if (id.includes('zod') || id.includes('yup') || id.includes('joi')) {
            return 'validation-vendor';
          }

          // Performance and caching phase 6 additions
          // Note: apiClient removed as dead code

          // Analytics and reporting components
          if (id.includes('/analytics/') || id.includes('ProgressAnalyticsDashboard') || id.includes('DailyTaskAnalyticsModal')) {
            return 'analytics-chunk';
          }

          // Modal components - Group by functionality
          if (id.includes('TaskModal') || id.includes('AddTaskModal') || id.includes('/modals/Task')) {
            return 'task-modals';
          }

          if (id.includes('BulkUploadModal') || id.includes('ActivityTrackerModal') || id.includes('/modals/Activity')) {
            return 'activity-modals';
          }

          if (id.includes('/modals/') && !id.includes('/modals/Task') && !id.includes('/modals/Activity')) {
            return 'general-modals';
          }

          // Settings and configuration
          if (id.includes('/settings/') || id.includes('Settings') || id.includes('/config/')) {
            return 'settings-chunk';
          }

          // Reports and exports
          if (id.includes('/reports/') || id.includes('/export') || id.includes('Report')) {
            return 'reports-chunk';
          }

          // Router and navigation
          if (id.includes('/lib/router') || id.includes('/components/Router')) {
            return 'router-chunk';
          }

          // Error handling and boundaries
          if (id.includes('ErrorBoundary') || id.includes('/utils/errorHandling')) {
            return 'error-handling';
          }

          // Large utility libraries - Group together
          if (id.includes('lodash') || id.includes('ramda') || id.includes('moment')) {
            return 'utils-vendor';
          }

          // UI component libraries
          if (id.includes('@headlessui') || id.includes('@radix-ui') || id.includes('react-aria')) {
            return 'ui-vendor';
          }

          // CSS and styling libraries
          if (id.includes('styled-components') || id.includes('@emotion') || id.includes('clsx') || id.includes('classnames')) {
            return 'styles-vendor';
          }

          // Core app components that change frequently - separate to avoid vendor cache invalidation
          if (id.includes('/src/') && !id.includes('/src/lib/') && !id.includes('node_modules')) {
            // Split by feature area for better caching
            if (id.includes('/components/analytics/') || id.includes('/hooks/usePerformance')) {
              return 'analytics-components';
            }

            if (id.includes('/components/auth/') || id.includes('/store/supabaseAuthStore')) {
              return 'auth-components';
            }

            if (id.includes('/components/ui/') || id.includes('/styles/')) {
              return 'ui-components';
            }

            if (id.includes('/hooks/') || id.includes('/contexts/')) {
              return 'app-logic';
            }

            if (id.includes('/components/') && !id.includes('/components/ui/')) {
              return 'feature-components';
            }

            // Everything else in src
            return 'app-core';
          }

          // All other node_modules - Large catch-all for remaining dependencies
          if (id.includes('node_modules')) {
            return 'vendor-misc';
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
