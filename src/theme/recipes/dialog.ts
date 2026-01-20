import { dialogAnatomy } from '@ark-ui/react/anatomy';
import { defineSlotRecipe } from '@pandacss/dev';

export const dialog = defineSlotRecipe({
  className: 'dialog',
  slots: dialogAnatomy.extendWith('header', 'body', 'footer', 'actionTrigger').keys(),
  base: {
    backdrop: {
      zIndex: 'var(--z-index)',
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100dvw',
      height: '100dvh',
      background: 'black.a7',
      _open: {
        animationName: 'fade-in',
        animationTimingFunction: 'emphasized-in',
        animationDuration: 'normal'
      },
      _closed: {
        animationName: 'fade-out',
        animationTimingFunction: 'emphasized-out',
        animationDuration: 'fast'
      }
    },
    positioner: {
      display: 'flex',
      zIndex: 'calc(var(--dialog-z-index) + var(--layer-index, 0))',
      position: 'fixed',
      top: 0,
      left: 0,
      justifyContent: 'center',
      width: '100dvw',
      height: '100dvh',
      overscrollBehaviorY: 'none',
      '--dialog-z-index': 'zIndex.modal'
    },

    title: {
      textStyle: 'lg',
      fontWeight: 'semibold'
    },
    description: {
      textStyle: 'sm',
      color: 'fg.muted'
    },
    closeTrigger: {
      pos: 'absolute',
      insetEnd: '3',
      top: '3'
    },
    content: {
      textStyle: 'sm',
      display: 'flex',
      zIndex: 'calc(var(--dialog-z-index) + var(--layer-index, 0))',
      position: 'relative',
      gap: { base: '4', md: '6' },
      flexDirection: 'column',
      outline: 0,
      borderRadius: 'l3',
      width: '100%',
      my: 'var(--dialog-margin, var(--dialog-base-margin))',
      py: { base: '4', md: '6' },
      bg: 'gray.surface.bg',
      boxShadow: 'lg',
      _open: {
        animationDuration: 'slowest'
      },
      _closed: {
        animationDuration: 'normal'
      },
      '--dialog-z-index': 'zIndex.modal'
    },
    header: {
      display: 'flex',
      flex: '0',
      gap: '0.5',
      flexDirection: 'column',
      px: { base: '4', md: '6' }
    },
    body: {
      display: 'flex',
      flex: '1',
      flexDirection: 'column',
      alignItems: 'flex-start',
      px: { base: '4', md: '6' }
    },
    footer: {
      display: 'flex',
      flex: '0',
      gap: '3',
      justifyContent: 'flex-end',
      alignItems: 'center',
      px: { base: '4', md: '6' }
    }
  },
  variants: {
    motionPreset: {
      scale: {
        content: {
          _open: { animationName: 'scale-in, fade-in' },
          _closed: { animationName: 'scale-out, fade-out' }
        }
      },
      'slide-in-bottom': {
        content: {
          _open: { animationName: 'slide-from-bottom, fade-in' },
          _closed: { animationName: 'slide-to-bottom, fade-out' }
        }
      },
      'slide-in-top': {
        content: {
          _open: { animationName: 'slide-from-top, fade-in' },
          _closed: { animationName: 'slide-to-top, fade-out' }
        }
      },
      'slide-in-left': {
        content: {
          _open: { animationName: 'slide-from-left, fade-in' },
          _closed: { animationName: 'slide-to-left, fade-out' }
        }
      },
      'slide-in-right': {
        content: {
          _open: { animationName: 'slide-from-right, fade-in' },
          _closed: { animationName: 'slide-to-right, fade-out' }
        }
      },
      none: {}
    },
    size: {
      xs: { content: { maxW: 'xs' } },
      sm: { content: { maxW: 'sm' } },
      md: { content: { maxW: 'md' } },
      lg: { content: { maxW: 'lg' } },
      xl: { content: { maxW: 'xl' } },
      cover: {
        positioner: { padding: '8' },
        content: {
          width: '100%',
          height: '100%',
          '--dialog-margin': '0'
        }
      },
      full: {
        content: {
          borderRadius: '0',
          maxW: '100dvw',
          minH: '100dvh',
          '--dialog-margin': '0'
        }
      }
    },
    placement: {
      center: {
        positioner: {
          alignItems: 'center'
        },
        content: {
          mx: 'auto',
          '--dialog-base-margin': 'auto'
        }
      },
      top: {
        positioner: {
          alignItems: 'flex-start'
        },
        content: {
          mx: 'auto',
          '--dialog-base-margin': 'spacing.16'
        }
      },
      bottom: {
        positioner: {
          alignItems: 'flex-end'
        },
        content: {
          mx: 'auto',
          '--dialog-base-margin': 'spacing.16'
        }
      }
    },
    scrollBehavior: {
      inside: {
        positioner: {
          overflow: 'hidden'
        },
        content: {
          maxH: 'calc(100% - 7.5rem)'
        },
        body: {
          overflow: 'auto'
        }
      },
      outside: {
        positioner: {
          overflow: 'auto',
          pointerEvents: 'auto'
        }
      }
    }
  },
  defaultVariants: {
    size: 'md',
    scrollBehavior: 'outside',
    placement: 'center',
    motionPreset: 'scale'
  }
});
