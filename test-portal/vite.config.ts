import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './', // Relative base for GitHub Pages and sub-directory deployment
  server: {
    port: 5000,
    host: '0.0.0.0',
    cors: true,
  },
  preview: {
    port: 5000,
    host: '0.0.0.0',
  },
});
