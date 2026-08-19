import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    // firestore-tests/ is a separate Node `--test` + emulator suite (its own
    // package.json), not Vitest — exclude it so `vitest run` only picks up
    // this app's src/**/*.test.ts pure-function tests.
    include: ["src/**/*.test.{ts,tsx}"],
  },
})
