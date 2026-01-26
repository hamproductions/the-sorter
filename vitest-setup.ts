import '@testing-library/jest-dom/vitest';
import 'vitest-localstorage-mock';
import { cleanup, configure, screen } from '@testing-library/react';
// ResizeObserver mock
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
import { vi } from 'vitest';
import './src/index.css';
import { afterEach, beforeAll, beforeEach, onTestFailed } from 'vitest';

beforeAll(() => {
  // configure({
  //   asyncUtilTimeout: import.meta.env.CI === true ? undefined : 5000,
  // });
});
beforeEach(async () => {
  //@ts-expect-error will do later zzz
  window.PointerEvent = MouseEvent;
  //@ts-expect-error will do later zzz
  delete window.location;
  //@ts-expect-error will do later zzz
  window.location = new URL('http://localhost/');
  //@ts-expect-error mocking idk
  window.matchMedia = vi.fn((query) => {
    return {
      matches: query !== '(prefers-color-scheme: dark)',
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    };
  });

  // Clear localStorage safely
  try {
    window.localStorage.clear();
  } catch {}
});

afterEach(async () => {
  onTestFailed(() => {
    // debug();
    // screen.debug();
  });

  vi.restoreAllMocks();
  await cleanup(); // clear testing data after each test run
});
