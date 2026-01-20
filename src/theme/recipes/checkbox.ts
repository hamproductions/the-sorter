import { checkboxAnatomy } from '@ark-ui/react/anatomy';
import { defineSlotRecipe } from '@pandacss/dev';

export const checkbox = defineSlotRecipe({
  className: 'checkbox',
  slots: checkboxAnatomy.keys(),
  base: {
    root: {
      display: 'inline-flex',
      position: 'relative',
      gap: '2',
      alignItems: 'center',
      verticalAlign: 'top',
      _disabled: {
        layerStyle: 'disabled'
      }
    },
    control: {
      cursor: 'pointer',
      display: 'inline-flex',
      flexShrink: '0',
      justifyContent: 'center',
      alignItems: 'center',
      borderColor: 'transparent',
      borderRadius: 'l1',
      borderWidth: '1px',
      focusVisibleRing: 'outside',

      _icon: {
        boxSize: 'full'
      }
    },
    label: {
      fontWeight: 'medium',
      userSelect: 'none'
    }
  },

  variants: {
    size: {
      sm: {
        root: { gap: '2' },
        label: { textStyle: 'sm' },
        control: { boxSize: '4.5', _icon: { boxSize: '3' } }
      },
      md: {
        root: { gap: '3' },
        label: { textStyle: 'md' },
        control: { boxSize: '5', _icon: { boxSize: '3.5' } }
      },
      lg: {
        root: { gap: '3' },
        label: { textStyle: 'lg' },
        control: { boxSize: '5.5', _icon: { boxSize: '4' } }
      }
    },

    variant: {
      solid: {
        control: {
          borderColor: 'border.default',
          _checked: {
            borderColor: 'colorPalette.solid.bg',
            color: 'colorPalette.solid.fg',
            bg: 'colorPalette.solid.bg'
          },
          _invalid: {
            background: 'error'
          }
        }
      },
      surface: {
        control: {
          borderColor: 'colorPalette.surface.border',
          borderWidth: '1px',
          color: 'colorPalette.surface.fg',
          bg: 'colorPalette.surface.bg'
        }
      },
      subtle: {
        control: {
          color: 'colorPalette.subtle.fg',
          bg: 'colorPalette.subtle.bg'
        }
      },
      outline: {
        control: {
          borderColor: 'colorPalette.outline.border',
          borderWidth: '1px',
          color: 'colorPalette.outline.fg',
          _checked: {
            borderColor: 'colorPalette.solid.bg'
          }
        }
      },
      plain: {
        control: {
          color: 'colorPalette.plain.fg'
        }
      }
    }
  },

  defaultVariants: {
    variant: 'solid',
    size: 'md'
  }
});
