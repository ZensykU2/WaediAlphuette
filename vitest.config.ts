import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/renderer/src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}', 'electron/**/*.{test,spec}.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      include: ['src/renderer/src/**', 'electron/**']
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src/renderer/src'),
      '@renderer': resolve(__dirname, './src/renderer/src')
    }
  }
})
