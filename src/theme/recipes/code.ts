import { defineRecipe } from '@pandacss/dev';

export const code = defineRecipe({
  className: 'code',
  base: {
    display: 'inline-flex',
    gap: '1',
    alignItems: 'center',
    borderRadius: 'l2',
    fontFamily: 'code',
    fontWeight: 'medium',
    fontVariantNumeric: 'tabular-nums',
    lineHeight: '1'
  },
  variants: {
    variant: {
      solid: {
        color: 'colorPalette.solid.fg',
        bg: 'colorPalette.solid.bg'
      },
      surface: {
        borderColor: 'colorPalette.surface.border',
        borderWidth: '1px',
        color: 'colorPalette.surface.fg',
        bg: 'colorPalette.surface.bg'
      },
      subtle: {
        color: 'colorPalette.subtle.fg',
        bg: 'colorPalette.subtle.bg'
      },
      outline: {
        borderColor: 'colorPalette.outline.border',
        borderWidth: '1px',
        color: 'colorPalette.outline.fg'
      },
      plain: {
        color: 'colorPalette.plain.fg'
      }
    },
    size: {
      sm: { textStyle: 'xs', minWidth: '4.5', height: '4.5', px: '1' },
      md: { textStyle: 'sm', minWidth: '5', height: '5', px: '1' },
      lg: { textStyle: 'sm', minWidth: '5.5', height: '5.5', px: '1' },
      xl: { textStyle: 'md', minWidth: '6', height: '6', px: '1' }
    }
  },
  defaultVariants: {
    size: 'md',
    variant: 'subtle'
  }
});
