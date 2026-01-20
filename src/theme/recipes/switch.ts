import { switchAnatomy } from '@ark-ui/react/anatomy';
import { defineSlotRecipe } from '@pandacss/dev';

export const switchRecipe = defineSlotRecipe({
  jsx: ['Switch', /Switch\.+/],
  className: 'switch',
  slots: switchAnatomy.extendWith('indicator').keys(),
  base: {
    root: {
      display: 'inline-flex',
      position: 'relative',
      alignItems: 'center',
      verticalAlign: 'middle',
      '--switch-diff': 'calc(var(--switch-width) - var(--switch-height))',
      '--switch-x': {
        base: 'var(--switch-diff)',
        _rtl: 'calc(var(--switch-diff) * -1)'
      }
    },
    label: {
      fontWeight: 'medium',
      lineHeight: '1',
      userSelect: 'none'
    },
    indicator: {
      display: 'grid',
      position: 'absolute',
      insetInlineStart: 'calc(var(--switch-x) - 2px)',
      flexShrink: 0,
      width: 'var(--switch-height)',
      height: 'var(--switch-height)',
      fontSize: 'var(--switch-indicator-font-size)',
      fontWeight: 'medium',
      userSelect: 'none',
      transition: 'inset-inline-start 0.12s ease',
      placeContent: 'center',
      _checked: {
        insetInlineStart: '2px'
      }
    },
    control: {
      cursor: 'pointer',
      display: 'inline-flex',
      position: 'relative',
      gap: '0.5rem',
      flexShrink: 0,
      justifyContent: 'flex-start',
      borderRadius: 'full',
      width: 'var(--switch-width)',
      height: 'var(--switch-height)',
      transition: 'backgrounds',
      focusVisibleRing: 'outside',
      _disabled: {
        layerStyle: 'disabled'
      },
      _invalid: {
        outline: '2px solid',
        outlineOffset: '2px',
        outlineColor: 'error'
      }
    },
    thumb: {
      display: 'flex',
      flexShrink: 0,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 'inherit',
      transitionDuration: 'fast',
      transitionProperty: 'translate',
      _checked: {
        translate: 'var(--switch-x) 0'
      }
    }
  },
  variants: {
    variant: {
      solid: {
        control: {
          borderRadius: 'full',
          bg: 'gray.subtle.bg',
          focusVisibleRing: 'outside',
          _checked: {
            bg: 'colorPalette.solid.bg'
          }
        },
        thumb: {
          scale: '0.8',
          width: 'var(--switch-height)',
          height: 'var(--switch-height)',
          bg: 'white',
          boxShadow: 'xs',
          _checked: {
            bg: 'colorPalette.solid.fg'
          }
        }
      }
    },
    size: {
      xs: {
        root: {
          gap: '2',
          '--switch-width': 'sizes.8',
          '--switch-height': 'sizes.4',
          '--switch-indicator-font-size': 'fontSizes.xs'
        },
        label: { fontSize: 'sm' }
      },
      sm: {
        root: {
          gap: '2',
          '--switch-width': 'sizes.9',
          '--switch-height': 'sizes.4.5',
          '--switch-indicator-font-size': 'fontSizes.xs'
        },
        label: { fontSize: 'sm' }
      },
      md: {
        root: {
          gap: '3',
          '--switch-width': 'sizes.10',
          '--switch-height': 'sizes.5',
          '--switch-indicator-font-size': 'fontSizes.sm'
        },
        label: { fontSize: 'md' }
      },
      lg: {
        root: {
          gap: '3',
          '--switch-width': 'sizes.11',
          '--switch-height': 'sizes.5.5',
          '--switch-indicator-font-size': 'fontSizes.md'
        },
        label: { fontSize: 'lg' }
      }
    }
  },
  defaultVariants: {
    variant: 'solid',
    size: 'md'
  }
});
