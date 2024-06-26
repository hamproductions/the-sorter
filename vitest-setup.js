import '@testing-library/jest-dom/vitest';
import { cleanup, configure, screen } from '@testing-library/react';
import './src/index.css';

import { afterEach, beforeAll, beforeEach, onTestFailed } from 'vitest';

beforeAll(() => {
  configure({
    // asyncUtilTimeout: import.meta.env.CI === true ? undefined : 5000,
  });
});
beforeEach(async () => {
  window.PointerEvent = MouseEvent;
  delete window.location;
  // @ts-ignore
  window.location = new URL('http://localhost/');
  window.localStorage.clear();
});

afterEach(async () => {
  onTestFailed(() => {
    // debug();
    // screen.debug();
  });

  await cleanup(); // clear testing data after each test run
});
