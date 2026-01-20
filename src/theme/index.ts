import { type PartialTheme } from '@pandacss/types';
import { keyframes as localKeyframes } from './keyframes';
import { textStyles } from './text-styles';
import { animationStyles } from './animation-styles';
import { layerStyles as localLayerStyles } from './layer-styles';
import { colors } from './tokens/colors';
import { semanticColors } from './tokens/semantic-colors';
import { shadows } from './tokens/shadows';
import { durations } from './tokens/durations';
import { zIndex } from './tokens/z-index';
import { spacing } from './tokens/spacing';
import { sizes } from './tokens/sizes';

export const theme: PartialTheme = {
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px'
  },
  layerStyles: {
    ...localLayerStyles,
    textStroke: {
      value: {
        //@ts-expect-error TODO: incompatible type
        WebkitTextStrokeWidth: '0.23',
        //@ts-expect-error TODO: incompatible type
        WebkitTextStrokeColor: '{colors.fg.default}'
      }
    }
  },
  tokens: {
    colors,
    durations,
    zIndex,
    spacing,
    sizes
  },
  semanticTokens: {
    shadows,
    colors: semanticColors
  },
  keyframes: {
    ...localKeyframes,
    rainbowScroll: {
      '0%': { backgroundPosition: '200% 50%' },
      '100%': { backgroundPosition: '0% 50%' }
    }
  },
  textStyles,
  animationStyles,
  recipes: {},
  slotRecipes: {}
};
