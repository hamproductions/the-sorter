import '@testing-library/jest-dom/vitest';
import { cleanup, configure } from '@testing-library/react';

import { afterEach, beforeAll, beforeEach } from 'vitest';

beforeAll(() => {
  configure({
    // asyncUtilTimeout: import.meta.env.CI === true ? undefined : 5000 
  })
})
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
