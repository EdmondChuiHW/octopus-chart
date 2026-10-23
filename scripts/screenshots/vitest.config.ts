import { defineConfig } from 'vitest/config';

// Standalone config: renders charts in Node for screenshots (no browser needed).
export default defineConfig({
  esbuild: { jsx: 'automatic' },
  test: {
    root: __dirname,
    include: ['*.shot.tsx'],
    environment: 'node',
    testTimeout: 120_000,
    env: { TZ: 'Europe/London' },
  },
});
