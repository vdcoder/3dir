import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Shares the repo root public/ folder so generated assets live in one place.
export default defineConfig({ plugins: [react()], publicDir: "../../public" })
