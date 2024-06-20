import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';

import { afterEach, beforeEach } from 'vitest';

beforeEach(async () => {
  window.PointerEvent = MouseEvent;
  delete window.location;
  // @ts-ignore
  window.location = new URL('http://localhost/');
  window.localStorage.clear();
});

afterEach(async () => {
  await cleanup(); // clear testing data after each test run
});
