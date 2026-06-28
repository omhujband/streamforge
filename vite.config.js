import { defineConfig } from 'vite'
import reactPlugin from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    reactPlugin(),
    tailwindcss(),
  ],
})