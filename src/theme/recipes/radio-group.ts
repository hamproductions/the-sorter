import { radioGroupAnatomy } from '@ark-ui/react/anatomy';
import { defineSlotRecipe } from '@pandacss/dev';

export const radioGroup = defineSlotRecipe({
  className: 'radio-group',
  slots: radioGroupAnatomy.keys(),
  base: {
    root: {
      display: 'flex',
      gap: '3',
      flexDirection: 'column'
    },
    itemControl: {
      display: 'inline-flex',
      flexShrink: 0,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 'full',
      verticalAlign: 'top',
      _after: {
        display: 'block',
        borderRadius: 'full',
        boxSize: '40%',
        content: '""'
      },
      _focusVisible: {
        focusVisibleRing: 'outside'
      }
    },
    item: {
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      _disabled: {
        layerStyle: 'disabled'
      }
    },
    itemText: {
      fontWeight: 'medium',
      userSelect: 'none'
    }
  },
  variants: {
    variant: {
      solid: {
        itemControl: {
          boxShadowColor: 'gray.surface.border',
          boxShadow: 'inset 0 0 0 1px var(--shadow-color)',
          _checked: {
            color: 'colorPalette.solid.fg',
            boxShadowColor: 'colorPalette.solid.bg',
            bg: 'colorPalette.solid.bg',
            _after: {
              background: 'colorPalette.solid.fg'
            }
          }
        }
      }
    },
    size: {
      sm: {
        item: { gap: '2' },
        itemControl: { boxSize: '4.5' },
        itemText: { textStyle: 'sm' }
      },
      md: {
        item: { gap: '3' },
        itemControl: { boxSize: '5' },
        itemText: { textStyle: 'md' }
      },
      lg: {
        item: { gap: '3' },
        itemControl: { boxSize: '5.5' },
        itemText: { textStyle: 'lg' }
      }
    }
  },
  defaultVariants: {
    variant: 'solid',
    size: 'md'
  }
});
