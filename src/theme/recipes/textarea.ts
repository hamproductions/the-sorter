import { defineRecipe } from '@pandacss/dev';

export const textarea = defineRecipe({
  className: 'textarea',
  base: {
    appearance: 'none',
    position: 'relative',
    outline: '0',
    borderRadius: 'l2',
    width: '100%',
    minWidth: '0',
    transition: 'colors',
    transitionProperty: 'box-shadow, border-color',
    _disabled: {
      layerStyle: 'disabled'
    }
  },
  variants: {
    variant: {
      outline: {
        borderColor: 'gray.outline.border',
        borderWidth: '1px',
        focusVisibleRing: 'inside',
        _invalid: {
          borderColor: 'error',
          focusRingColor: 'error'
        }
      },
      surface: {
        borderColor: 'gray.surface.border',
        borderWidth: '1px',
        bg: 'gray.surface.bg',
        focusVisibleRing: 'inside',
        _invalid: {
          borderColor: 'error',
          focusRingColor: 'error'
        }
      },
      subtle: {
        borderColor: 'transparent',
        borderWidth: '1px',
        color: 'gray.subtle.fg',
        bg: 'gray.subtle.bg',
        focusVisibleRing: 'inside',
        _invalid: {
          borderColor: 'error',
          focusRingColor: 'error'
        }
      },
      flushed: {
        borderBottomWidth: '1px',
        borderBottomColor: 'gray.outline.border',
        borderRadius: '0',
        px: '0',
        color: 'fg.default',
        _invalid: {
          borderColor: 'error'
        },
        _focus: {
          borderColor: 'colorPalette.solid.bg',
          boxShadowColor: 'colorPalette.solid.bg',
          boxShadow: '0 1px 0 0 var(--shadow-color)',
          _invalid: {
            borderColor: 'error',
            boxShadowColor: 'error'
          }
        }
      }
    },
    size: {
      xs: { textStyle: 'sm', py: '5px', px: '2', scrollPaddingBottom: '5px' },
      sm: { textStyle: 'sm', py: '7px', px: '2.5', scrollPaddingBottom: '7px' },
      md: { textStyle: 'md', py: '7px', px: '3', scrollPaddingBottom: '7px' },
      lg: { textStyle: 'md', py: '9px', px: '3.5', scrollPaddingBottom: '9px' },
      xl: { textStyle: 'lg', py: '9px', px: '4', scrollPaddingBottom: '9px' }
    }
  },
  defaultVariants: {
    size: 'md',
    variant: 'surface'
  }
});
