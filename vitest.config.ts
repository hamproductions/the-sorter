/// <reference types="vitest" />
import react from '@vitejs/plugin-react';
import { configDefaults } from 'vitest/config';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler', {}]]
      }
    })
  ],
  //@ts-expect-error TODO: fix
  test: {
    environment: 'jsdom',
    css: process.env.TEST_PREVIEW === 'true',
    // testTimeout: process.env.CI === 'true' ? 5000 : 10000,
    // environmentOptions: {
    //   jsdom: {}
    // },
    isolate: true,
    setupFiles: ['./vitest-setup.js'],
    coverage: {
      provider: 'v8',
      // you can include other reporters, but 'json-summary' is required, json is recommended
      reporter: ['text', 'json-summary', 'json', 'html'],
      // If you want a coverage reports even if your tests are failing, include the reportOnFailure option
      reportOnFailure: true,
      exclude: [
        '*.config.*',
        '+config.ts',
        'scripts',
        '**/*.d.ts',
        'styled-system/*',
        '*/__test__/*',
        '*/components/ui/styled/*',
        '*/theme/*'
      ]
    },
    outputFile: {
      'json-summary': './coverage-summary.json'
    },
    exclude: [...configDefaults.exclude]
  }
});
