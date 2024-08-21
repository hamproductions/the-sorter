import { FlatCompat } from '@eslint/eslintrc';
import { fixupPluginRules } from '@eslint/compat';
import js from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import unusedImports from 'eslint-plugin-unused-imports';
import globals from 'globals';

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
  recommendedConfig: js.configs.recommended
});

const project = './tsconfig.json';

/**
 * @param {string} name the pugin name
 * @param {string} alias the plugin alias
 * @returns {import("eslint").ESLint.Plugin}
 */
function legacyPlugin(name, alias = name) {
  const plugin = compat.plugins(name)[0]?.plugins?.[alias];

  if (!plugin) {
    throw new Error(`Unable to resolve plugin ${name} and/or alias ${alias}`);
  }

  return fixupPluginRules(plugin);
}

const config = tseslint.config(
  {
    ignores: [
      '**/styled-system/*',
      '**/components/ui/styled/**/*',
      '**/lib/**/*',
      '*.config.*',
      '*-setup.js'
    ]
  },
  ...tseslint.configs.recommendedTypeChecked.map((c) => ({
    ...c
  })),
  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: '.'
      }
    },
    rules: {
      // '@typescript-eslint/no-unused-vars': ['error', { varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/triple-slash-reference': 'off'
    }
  },
  {
    files: ['**/*.{js,jsx,mjs,cjs,ts,tsx}'],
    plugins: {
      react
    },
    settings: {
      react: {
        version: 'detect'
      }
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        ...globals.browser
      }
    },
    rules: {
      // ... any rules you want
      'react/jsx-uses-react': 'error',
      'react/jsx-uses-vars': 'error',
      'react/function-component-definition': 'error'
    }
    // ... others are omitted for brevity
  },
  // ... oth
  {
    languageOptions: {
      parserOptions: {
        project,
        tsconfigRootDir: import.meta.dirname
      }
    },
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project
        }
      }
    },
    plugins: {
      import: legacyPlugin('eslint-plugin-import', 'import')
      // ...rest of plugins
    },
    rules: {
      // your rules here....
      'import/no-unused-modules': 'error',
      'import/order': 'error'
    }
  },
  ...compat.config({
    plugins: ['eslint-plugin-react-compiler'],
    rules: {
      'react-compiler/react-compiler': 'warn'
    }
  }),
  ...compat.config({
    plugins: ['jsx-a11y'],
    extends: ['plugin:jsx-a11y/recommended'],
    settings: {
      'jsx-a11y': {
        polymorphicPropName: 'as',
        components: {
          'styled.img': 'img',
          Button: 'button',
          IconButton: 'button',
          Input: 'input',
          Text: 'p'
        }
      }
    }
  }),
  ...compat.config({ extends: ['plugin:@pandacss/recommended'] }),
  {
    rules: {
      '@pandacss/no-unsafe-token-fn-usage': 'off',
      '@pandacss/no-hardcoded-color': 'off'
    }
  },
  eslintPluginPrettierRecommended,
  {
    files: ['**/*.d.ts'],
    rules: {}
  },
  {
    plugins: {
      'unused-imports': unusedImports
    },
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
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
  }
);

export default config;
