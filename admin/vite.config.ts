import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Dream Home 11 Admin',
        short_name: 'DH11 Admin',
        description: 'Admin panel for Dream Home 11',
        theme_color: '#1a1a2e',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          { src: '/icon.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any maskable' },
        ],
      },
    }),
    visualizer({ open: false, filename: 'bundle-analysis.html' }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['lucide-react', 'react-hot-toast'],
        },
      },
    },
    chunkSizeWarningLimit: 500,
  },
});
