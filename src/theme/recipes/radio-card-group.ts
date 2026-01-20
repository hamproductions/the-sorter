import { radioGroupAnatomy } from '@ark-ui/react/anatomy';
import { defineSlotRecipe } from '@pandacss/dev';

export const radioCardGroup = defineSlotRecipe({
  className: 'radio-card-group',
  slots: radioGroupAnatomy.keys(),
  base: {
    root: {
      display: 'flex',
      gap: '1.5',
      flexDirection: 'column',
      width: 'full'
    },
    item: {
      cursor: 'pointer',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderRadius: 'l2',
      width: 'full',
      userSelect: 'none'
    },
    label: {
      textStyle: 'label'
    },
    itemControl: {
      display: 'inline-flex',
      flexShrink: '0',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 'full',
      verticalAlign: 'top',
      _after: {
        display: 'block',
        borderRadius: 'full',
        content: '""'
      },
      _focusVisible: {
        focusVisibleRing: 'outside'
      }
    },
    itemText: {
      textStyle: 'label'
    }
  },
  variants: {
    variant: {
      subtle: {
        item: {
          color: 'gray.subtle.fg',
          background: 'gray.subtle.bg',
          _checked: {
            color: 'colorPalette.subtle.fg',
            background: 'colorPalette.subtle.bg'
          }
        },
        itemControl: {
          borderColor: 'gray.subtle.border',
          borderWidth: '1px',
          _checked: {
            borderColor: 'colorPalette.solid.bg',
            _after: {
              bg: 'colorPalette.solid.bg'
            }
          }
        }
      },
      outline: {
        item: {
          borderColor: 'gray.outline.border',
          borderWidth: '1px',
          _checked: {
            borderColor: 'colorPalette.solid.bg',
            boxShadowColor: 'colorPalette.solid.bg',
            boxShadow: '0 0 0 1px var(--shadow-color)'
          }
        },
        itemControl: {
          borderColor: 'gray.outline.border',
          borderWidth: '1px',
          _checked: {
            borderColor: 'colorPalette.solid.bg',
            bg: 'colorPalette.solid.bg',
            _after: {
              background: 'colorPalette.solid.fg'
            }
          }
        }
      },
      surface: {
        item: {
          borderColor: 'gray.surface.border',
          borderWidth: '1px',
          color: 'gray.surface.fg',
          background: 'gray.surface.bg',
          _checked: {
            borderColor: 'colorPalette.solid.bg',
            boxShadowColor: 'colorPalette.solid.bg',
            boxShadow: '0 0 0 1px var(--shadow-color)'
          }
        },
        itemControl: {
          borderColor: 'gray.outline.border',
          borderWidth: '1px',
          _checked: {
            borderColor: 'colorPalette.solid.bg',
            background: 'colorPalette.solid.bg',
            _after: {
              background: 'colorPalette.solid.fg'
            }
          }
        }
      },
      solid: {
        item: {
          borderWidth: '1px',
          _checked: {
            borderColor: 'colorPalette.solid.bg',
            color: 'colorPalette.solid.fg',
            bg: 'colorPalette.solid.bg'
          }
        },
        itemControl: {
          borderColor: 'gray.outline.border',
          borderWidth: '1px',
          _checked: {
            borderColor: 'colorPalette.solid.fg',
            background: 'colorPalette.solid.fg',
            _after: {
              bg: 'colorPalette.solid.bg'
            }
          }
        }
      }
    },
    size: {
      md: {
        item: { gap: '2', p: '4' },
        itemControl: { boxSize: '5', _after: { boxSize: '2' } },
        itemText: { textStyle: 'sm' }
      }
    }
  },
  defaultVariants: {
    variant: 'outline',
    size: 'md'
  }
});
