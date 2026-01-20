import { tabsAnatomy } from '@ark-ui/react/anatomy';
import { defineSlotRecipe } from '@pandacss/dev';

export const tabs = defineSlotRecipe({
  className: 'tabs',
  slots: tabsAnatomy.keys(),
  base: {
    root: {
      display: 'flex',
      position: 'relative',
      alignItems: 'start',
      _horizontal: {
        gap: '2',
        flexDirection: 'column'
      },
      _vertical: {
        gap: '4',
        flexDirection: 'row'
      }
    },
    list: {
      display: 'flex',
      position: 'relative',
      isolation: 'isolate',
      _horizontal: {
        flexDirection: 'row'
      },
      _vertical: {
        flexDirection: 'column'
      }
    },
    trigger: {
      cursor: 'pointer',
      display: 'flex',
      position: 'relative',
      alignItems: 'center',
      outline: '0',
      fontWeight: 'semibold',
      _disabled: {
        layerStyle: 'disabled'
      },
      _focusVisible: {
        zIndex: 1,
        focusVisibleRing: 'outside'
      }
    },
    content: {
      focusVisibleRing: 'inside',

      _horizontal: {
        width: '100%'
      },
      _vertical: {
        height: '100%'
      }
    },
    indicator: {
      zIndex: -1,
      width: 'var(--width)',
      height: 'var(--height)'
    }
  },

  variants: {
    size: {
      xs: {
        list: { gap: '1' },
        trigger: { textStyle: 'xs', gap: '2', minW: '8', h: '8', px: '3' }
      },
      sm: {
        list: { gap: '1' },
        trigger: { textStyle: 'sm', gap: '2', minW: '9', h: '9', px: '3.5' }
      },
      md: {
        list: { gap: '1' },
        trigger: { textStyle: 'sm', gap: '2', minW: '10', h: '10', px: '4' }
      },
      lg: {
        list: { gap: '1' },
        trigger: { textStyle: 'md', gap: '2', minW: '11', h: '11', px: '4.5' }
      }
    },
    variant: {
      line: {
        root: {
          alignItems: 'stretch'
        },
        list: {
          _horizontal: {
            borderBottomWidth: '1px'
          },
          _vertical: {
            borderStartWidth: '1px'
          }
        },
        indicator: {
          background: 'colorPalette.solid.bg',
          _horizontal: {
            bottom: '0',
            transform: 'translateY(1px)',
            height: '0.5'
          },
          _vertical: {
            left: '0',
            transform: 'translateX(-1px)',
            width: '0.5'
          }
        },
        trigger: {
          color: 'fg.muted',
          _selected: {
            color: 'colorPalette.plain.fg'
          }
        }
      },
      subtle: {
        trigger: {
          color: 'fg.muted',
          _selected: {
            color: 'colorPalette.subtle.fg'
          }
        },
        indicator: {
          borderRadius: 'l2',
          color: 'colorPalette.subtle.fg',
          bg: 'colorPalette.subtle.bg'
        }
      },
      enclosed: {
        list: {
          borderRadius: 'l3',
          p: '1',
          boxShadowColor: 'border',
          bg: {
            _dark: 'gray.1',
            _light: 'gray.2'
          },
          boxShadow: 'inset 0 0 0px 1px var(--shadow-color)'
        },
        trigger: {
          color: 'fg.muted',
          _selected: {
            color: 'colorPalette.surface.fg'
          }
        },
        indicator: {
          borderRadius: 'l2',
          bg: {
            _dark: 'gray.2',
            _light: 'white'
          },
          boxShadow: {
            _dark: 'none',
            _light: 'xs'
          }
        }
      }
    },
    fitted: {
      true: {
        root: {
          alignItems: 'stretch'
        },
        trigger: {
          flex: 1,
          justifyContent: 'center',
          textAlign: 'center'
        }
      }
    }
  },

  defaultVariants: {
    size: 'md',
    variant: 'line'
  }
});
