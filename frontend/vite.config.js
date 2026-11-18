import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Configuración de Vite para el frontend y el proxy hacia los servicios locales.
// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
    server: {
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": "http://localhost:8000",
      "/auth": "http://localhost:8000",
    },
  },
});
