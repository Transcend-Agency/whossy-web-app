import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Debug console.log calls (several print user ids and birth dates) are
  // dropped from production bundles; console.error and warn stay.
  esbuild: { pure: ['console.log', 'console.debug'] },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Large libraries get their own files so they cache between releases
        // and download in parallel with the app code.
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('/firebase/') || id.includes('/@firebase/')) return 'firebase'
          if (id.includes('/@mui/') || id.includes('/@emotion/')) return 'mui'
          if (id.includes('/framer-motion/')) return 'motion'
          if (id.includes('/react-dom/') || id.includes('/react-router') || id.includes('/react/')) return 'react'
          return undefined
        },
      },
    },
  },
  test: {
    // firestore-tests/ is a separate Node `--test` + emulator suite (its own
    // package.json), not Vitest — exclude it so `vitest run` only picks up
    // this app's src/**/*.test.ts pure-function tests.
    include: ["src/**/*.test.{ts,tsx}"],
  },
})
