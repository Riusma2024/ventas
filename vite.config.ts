import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Miss Ventas',
        short_name: 'MissVentas',
        description: 'Gestión comercial Local-First',
        theme_color: '#ec4899',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        scope: '/',
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
      }
    })
  ],
  resolve: {
    alias: {
      'react-is': 'react-is',
    },
  },
  optimizeDeps: {
    include: ['react-is'],
  },
  build: {
    commonjsOptions: {
      include: [/react-is/, /node_modules/],
    },
  }
});
