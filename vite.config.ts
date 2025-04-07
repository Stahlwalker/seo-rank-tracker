import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // React and related packages
          if (id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/react-router-dom/')) {
            return 'react-vendor';
          }

          // Radix UI components
          if (id.includes('node_modules/@radix-ui/')) {
            return 'radix-vendor';
          }

          // Shadcn and styling utilities
          if (id.includes('node_modules/class-variance-authority/') ||
            id.includes('node_modules/clsx/') ||
            id.includes('node_modules/tailwind-merge/')) {
            return 'ui-utils';
          }

          // Chart.js and related packages
          if (id.includes('node_modules/chart.js/') ||
            id.includes('node_modules/@kurkle/')) {
            return 'chart-vendor';
          }

          // Supabase client
          if (id.includes('node_modules/@supabase/')) {
            return 'supabase-vendor';
          }

          // Other utilities
          if (id.includes('node_modules/date-fns/') ||
            id.includes('node_modules/lucide-react/')) {
            return 'utils-vendor';
          }
        }
      }
    }
  },
});
