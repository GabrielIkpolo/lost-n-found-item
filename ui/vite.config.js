import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dotenv from "dotenv";

dotenv.config();

export default defineConfig({
  plugins: [react()],

  server: {
    https: {
      key: process.env.SSL_KEY_PATH,
      cert: process.env.SSL_CERT_PATH,
    },
    proxy: {
      '/api': {
        target: process.env.VITE_REACT_APP_API_BASE_URL, // Replace with your actual API server URL
        changeOrigin: true,
        secure: process.env.SECURE, // Set to true if your API server uses HTTPS
      },
    },
  },

})