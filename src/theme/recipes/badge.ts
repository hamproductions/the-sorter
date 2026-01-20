import { defineRecipe } from '@pandacss/dev';

export const badge = defineRecipe({
  className: 'badge',
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    borderRadius: 'l2',
    fontWeight: 'medium',
    fontVariantNumeric: 'tabular-nums',
    lineHeight: '1',
    userSelect: 'none',
    whiteSpace: 'nowrap'
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
      }
    },
    size: {
      sm: { gap: '0.5', h: '4.5', px: '1.5', fontSize: 'xs', _icon: { boxSize: '2.5' } },
      md: { gap: '1', h: '5', px: '2', fontSize: 'xs', _icon: { boxSize: '3' } },
      lg: { gap: '1', h: '5.5', px: '2.5', fontSize: 'xs', _icon: { boxSize: '3.5' } },
      xl: { gap: '1.5', h: '6', px: '2.5', fontSize: 'sm', _icon: { boxSize: '4' } },
      '2xl': { fontSize: 'md', px: '3', h: '7', gap: '1.5', _icon: { boxSize: '4.5' } }
    }
  },
  defaultVariants: {
    variant: 'subtle',
    size: 'md'
  }
});
