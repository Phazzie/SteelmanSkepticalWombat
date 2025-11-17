import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: [],
    mockReset: true,
    clearMocks: true,
    restoreMocks: true,
  },
});
