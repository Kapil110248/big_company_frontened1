import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return id.toString().split('node_modules/')[1].split('/')[0].toString();
          }
        }
      }
    }
  },
  server: {
    host: '0.0.0.0',
    port: 3062,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      'bigcompany.alexandratechlab.com',
      'bigcompany-retailer.alexandratechlab.com',
      'bigcompany-wholesaler.alexandratechlab.com'
    ]
  }
})
