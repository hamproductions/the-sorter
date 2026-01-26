import { type PartialTheme } from '@pandacss/types';
import { keyframes as localKeyframes } from './keyframes';
import { textStyles } from './text-styles';
import { semanticTokens } from './semantic-tokens';
import { tokens } from './tokens';

export const theme: PartialTheme = {
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px'
  },
  layerStyles: {
    textStroke: {
      value: {
        //@ts-expect-error TODO: incompatible type
        WebkitTextStrokeWidth: '0.23',
        //@ts-expect-error TODO: incompatible type
        WebkitTextStrokeColor: '{colors.fg.default}'
      }
    }
  },
  tokens,
  semanticTokens,
  keyframes: {
    ...localKeyframes,
    rainbowScroll: {
      '0%': { backgroundPosition: '200% 50%' },
      '100%': { backgroundPosition: '0% 50%' }
    }
  },
  textStyles,
  recipes: {},
  slotRecipes: {}
};
