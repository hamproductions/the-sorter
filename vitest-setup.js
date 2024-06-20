import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';

import { afterEach } from 'vitest';

afterEach(async () => {
  await cleanup(); // clear testing data after each test run
});
