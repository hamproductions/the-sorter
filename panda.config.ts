import { defineConfig } from '@pandacss/dev';
import { createPreset } from '@park-ui/panda-preset';
import { theme } from './src/theme';

const config = defineConfig({
  // Whether to use css reset
  preflight: true,

  presets: [
    '@pandacss/preset-base',
    createPreset({
      accentColor: 'pink',
      grayColor: 'mauve',
      borderRadius: 'lg'
    })
  ],

  // Where to look for your css declarations
  include: ['./src/**/*.{js,jsx,ts,tsx,astro}'],

  // Files to exclude
  exclude: [],

  staticCss: {
    recipes: {
      // text: ['*']
    },
    css: [
      {
        properties: {
          listStyleType: ['none', 'disc', 'decimal'],
          fontWeight: ['bold'],
          fontSize: ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl']
        }
      }
    ]
  },
  // Useful for theme customization
  theme: {
    extend: theme
  },

  jsxFramework: 'react',

  // The output directory for your css system
  outdir: './styled-system',

  importMap: {
    css: 'styled-system/css',
    recipes: 'styled-system/recipes',
    patterns: 'styled-system/patterns',
    jsx: 'styled-system/jsx'
  },

  conditions: {
    extend: {
      dark: ['&.dark, .dark &'],
      light: ['&.light, .light &']
    }
  },

  lightningcss: true
});

export default config;
