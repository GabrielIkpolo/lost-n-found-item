import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, afterAll, vi } from 'vitest';
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// 1. Initialize MSW Server
export const server = setupServer(...handlers);

beforeAll(() => server.listen());

afterEach(() => {
  cleanup();           // Clear the DOM
  server.resetHandlers(); // Clear any temporary test overrides
});

afterAll(() => server.close());

// 2. Mock browser APIs Vitest doesn't have
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
  })),
});