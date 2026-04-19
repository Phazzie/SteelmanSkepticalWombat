import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [],
    mockReset: true,
    clearMocks: true,
    restoreMocks: true,
  },
});
