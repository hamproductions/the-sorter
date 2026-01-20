import { dialogAnatomy } from '@ark-ui/react/anatomy';
import { defineSlotRecipe } from '@pandacss/dev';

export const drawer = defineSlotRecipe({
  className: 'drawer',
  slots: dialogAnatomy.extendWith('header', 'body', 'footer', 'actionTrigger').keys(),
  base: {
    backdrop: {
      zIndex: 'overlay',
      position: 'fixed',
      insetInlineStart: '0',
      top: '0',
      width: '100vw',
      height: '100dvh',
      background: 'black.a7',
      _open: {
        animationName: 'fade-in',
        animationTimingFunction: 'emphasized-in',
        animationDuration: 'slow'
      },
      _closed: {
        animationName: 'fade-out',
        animationTimingFunction: 'emphasized-out',
        animationDuration: 'normal'
      }
    },
    positioner: {
      display: 'flex',
      zIndex: 'modal',
      position: 'fixed',
      insetInlineStart: '0',
      top: '0',
      width: '100vw',
      height: '100dvh',
      overscrollBehaviorY: 'none'
    },
    content: {
      display: 'flex',
      zIndex: 'modal',
      position: 'relative',
      flexDirection: 'column',
      outline: 0,
      width: '100%',
      maxH: '100dvh',
      color: 'inherit',
      bg: 'gray.surface.bg',
      boxShadow: 'lg',
      _open: {
        animationDuration: 'slowest',
        animationTimingFunction: 'cubic-bezier(0.05, 0.7, 0.1, 1.0)'
      },
      _closed: {
        animationDuration: 'normal',
        animationTimingFunction: 'cubic-bezier(0.3, 0.0, 0.8, 0.15)'
      }
    },
    header: {
      display: 'flex',
      flex: '0',
      gap: '1',
      flexDirection: 'column',
      px: { base: '4', md: '6' },
      pt: { base: '4', md: '6' },
      pb: '4'
    },
    body: {
      display: 'flex',
      flex: '1',
      flexDirection: 'column',
      alignItems: 'flex-start',
      p: { base: '4', md: '6' },
      overflow: 'auto'
    },
    footer: {
      display: 'flex',
      flex: '0',
      gap: '3',
      justifyContent: 'flex-end',
      alignItems: 'center',
      py: '4',
      px: { base: '4', md: '6' }
    },
    title: {
      textStyle: 'xl',
      color: 'fg.default',
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
    }
  },
  variants: {
    size: {
      xs: {
        content: {
          maxW: 'xs'
        }
      },
      sm: {
        content: {
          maxW: 'sm'
        }
      },
      md: {
        content: {
          maxW: 'md'
        }
      },
      lg: {
        content: {
          maxW: 'lg'
        }
      },
      xl: {
        content: {
          maxW: 'xl'
        }
      },
      full: {
        content: {
          maxW: '100vw',
          h: '100dvh'
        }
      }
    },
    placement: {
      start: {
        positioner: {
          justifyContent: 'flex-start',
          alignItems: 'stretch'
        },
        content: {
          _open: {
            animationName: {
              base: 'slide-from-left-full, fade-in',
              _rtl: 'slide-from-right-full, fade-in'
            }
          },
          _closed: {
            animationName: {
              base: 'slide-to-left-full, fade-out',
              _rtl: 'slide-to-right-full, fade-out'
            }
          }
        }
      },
      end: {
        positioner: {
          justifyContent: 'flex-end',
          alignItems: 'stretch'
        },
        content: {
          _open: {
            animationName: {
              base: 'slide-from-right-full, fade-in',
              _rtl: 'slide-from-left-full, fade-in'
            }
          },
          _closed: {
            animationName: {
              base: 'slide-to-right-full, fade-out',
              _rtl: 'slide-to-left-full, fade-out'
            }
          }
        }
      },
      top: {
        positioner: {
          justifyContent: 'stretch',
          alignItems: 'flex-start'
        },
        content: {
          maxW: '100%',
          _open: { animationName: 'slide-from-top-full, fade-in' },
          _closed: { animationName: 'slide-to-top-full, fade-out' }
        }
      },

      bottom: {
        positioner: {
          justifyContent: 'stretch',
          alignItems: 'flex-end'
        },
        content: {
          maxW: '100%',
          _open: { animationName: 'slide-from-bottom-full, fade-in' },
          _closed: { animationName: 'slide-to-bottom-full, fade-out' }
        }
      }
    }
  },
  defaultVariants: {
    placement: 'end',
    size: 'sm'
  }
});
