import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
// import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/web-codecs-demo',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@p': path.resolve(__dirname, 'packages'),
    },
  },
  plugins: [
    react(),
    // basicSsl()
  ],
  server: {
    open: true,
    port: 8887,
    host: '0.0.0.0',
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  optimizeDeps: {
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
  },
})
