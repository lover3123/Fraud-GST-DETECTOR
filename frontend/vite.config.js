import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Matches your repository name exactly (Case Sensitive)
  base: '/Fraud-GST-DETECTOR/', 
})
