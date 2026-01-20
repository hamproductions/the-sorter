import { defineConfig } from '@pandacss/dev';
import { recipes, slotRecipes } from './src/theme/recipes';
import { theme } from './src/theme';
import { globalCss } from './src/theme/global-css';
import { conditions } from './src/theme/conditions';
import { pink } from './src/theme/colors/pink';
import { mauve } from './src/theme/colors/mauve';
import { red } from './src/theme/colors/red';
import { green } from './src/theme/colors/green';
import { amber } from './src/theme/colors/amber';
import { blue } from './src/theme/colors/blue';

const config = defineConfig({
  preflight: true,

  hash: {
    className: true,
    cssVar: true
  },

  presets: [
    '@pandacss/preset-base',
    '@pandacss/preset-panda',
  ],

  // Where to look for your css declarations
  include: ['./src/**/*.{js,jsx,ts,tsx,astro}'],

  // Files to exclude
  exclude: [],

  globalCss: {
    ...globalCss.extend,
    html: {
      ...globalCss.extend.html,
      colorPalette: 'pink'
    }
  },

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
    extend: {
      ...theme,
      recipes,
      slotRecipes,
      semanticTokens: {
        ...theme.semanticTokens,
        colors: {
          ...theme.semanticTokens?.colors,
          pink: pink,
          gray: mauve,
          mauve: mauve,
          red: red,
          green: green,
          amber: amber,
          blue: blue,
        },
        radii: {
          l1: { value: '{radii.md}' },
          l2: { value: '{radii.lg}' },
          l3: { value: '{radii.xl}' }
        }
      }
    }
  },

  plugins: [
    {
      name: 'Remove Panda Preset Colors',
      hooks: {
        'preset:resolved': ({ utils, preset, name }) =>
          name === '@pandacss/preset-panda'
            ? utils.omit(preset, ['theme.tokens.colors', 'theme.semanticTokens.colors'])
            : preset
      }
    }
  ],

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
    ...conditions,
    extend: {
      ...conditions.extend,
      dark: ['&.dark, .dark &'],
      light: ['&.light, .light &']
    }
  },

  lightningcss: true
});

export default config;
