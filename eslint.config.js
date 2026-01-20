import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import unusedImports from 'eslint-plugin-unused-imports';
import oxlint from 'eslint-plugin-oxlint';
import globals from 'globals';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
  recommendedConfig: js.configs.recommended
});

export default [
  {
    ignores: [
      '**/scripts/internal/*',
      '**/styled-system/*',
      '**/components/ui/styled/**/*',
      '**/lib/**/*',
      '**/dist/**/*',
      '**/.vite/**/*',
      '**/panda/*.ts',
      'panda.config.ts',
      'vite.config.ts',
      'vitest.config.ts'
    ]
  },
  {
    files: ['**/*.{js,jsx,mjs,cjs,ts,tsx}'],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        ...globals.browser
      }
    }
  },
  ...compat.config({
    plugins: ['eslint-plugin-react-compiler'],
    rules: {
      'react-compiler/react-compiler': 'warn'
    }
  }),
  ...compat.extends('plugin:@pandacss/recommended'),
  {
    rules: {
      '@pandacss/no-unsafe-token-fn-usage': 'off',
      '@pandacss/no-hardcoded-color': 'off',
      '@pandacss/no-config-function-in-source': 'off'
    }
  },
  {
    files: ['**/*.d.ts'],
    rules: {}
  },
  {
    plugins: {
      'unused-imports': unusedImports
    },
    rules: {
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_'
        }
      ]
    }
  },
  eslintPluginPrettierRecommended,
  ...oxlint.configs['flat/recommended']
];
