import { vi, beforeAll } from 'vitest';

// Mock fetch globally before any tests run
beforeAll(() => {
  global.fetch = vi.fn();
  
  // Mock import.meta.env for Vite
  (import.meta as any).env = {
    VITE_GEMINI_API_KEY: 'test-api-key-for-testing',
    VITE_GEMINI_MODEL_NAME: 'gemini-2.5-flash-preview-05-20',
  };
});
