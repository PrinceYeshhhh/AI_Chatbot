import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['lucide-react', 'framer-motion'],
          utils: ['@supabase/supabase-js', 'zod'],
          services: ['dompurify', 'xss']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  // Remove base path for Vercel deployment
  // base: '/AI_Chatbot/',
});
