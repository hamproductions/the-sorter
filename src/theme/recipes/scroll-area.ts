import { defineSlotRecipe } from '@pandacss/dev';

export const scrollArea = defineSlotRecipe({
  className: 'scroll-area',
  slots: ['root', 'viewport', 'content', 'scrollbar', 'thumb', 'corner'],
  base: {
    root: {
      display: 'flex',
      position: 'relative',
      flexDirection: 'column',
      width: '100%',
      height: '100%',
      overflow: 'hidden',
      '--scrollbar-margin': '0px',
      '--scrollbar-size': 'calc(var(--thumb-size) + calc(var(--scrollbar-margin) * 2))'
    },
    viewport: {
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      height: '100%',
      scrollbarWidth: 'none',
      WebkitOverflowScrolling: 'touch',
      '&::-webkit-scrollbar': {
        display: 'none'
      },
      '&[data-overflow-x] [data-pinned]': {
        _after: {
          position: 'absolute',
          top: '0',
          bottom: '-1px',
          width: '32px',
          content: '""',
          pointerEvents: 'none'
        }
      },
      '&[data-overflow-x]:not([data-at-left]) [data-pinned="left"]': {
        _after: {
          insetInlineEnd: '0',
          translate: '100% 0',
          boxShadow: 'inset'
        }
      }
    },
    scrollbar: {
      display: 'flex',
      zIndex: 'overlay',
      position: 'relative',
      alignItems: 'center',
      touchAction: 'none',
      userSelect: 'none',
      _horizontal: {
        flexDirection: 'row',
        height: 'var(--scrollbar-size)',
        px: 'var(--scrollbar-margin)',
        '&:not([data-overflow-x])': {
          display: 'none'
        }
      },
      _vertical: {
        flexDirection: 'column',
        width: 'var(--scrollbar-size)',
        py: 'var(--scrollbar-margin)',
        '&:not([data-overflow-y])': {
          display: 'none'
        }
      }
    },
    thumb: {
      borderRadius: 'full',
      bg: 'var(--thumb-bg)',
      transitionTimingFunction: 'default',
      transitionDuration: 'normal',
      transitionProperty: 'background, color, box-shadow',
      _horizontal: { height: 'var(--thumb-size)' },
      _vertical: { width: 'var(--thumb-size)' }
    },
    corner: {}
  },
  variants: {
    scrollbar: {
      auto: {
        scrollbar: {
          '&[data-scrolling], &[data-hover]': {
            '--thumb-bg': '{colors.gray.subtle.bg.active}'
          }
        }
      },
      visible: {
        content: {
          '&[data-overflow-y]': {
            pe: 'var(--scrollbar-size)'
          },
          '&[data-overflow-x]': {
            pb: 'var(--scrollbar-size)'
          }
        },
        scrollbar: {
          borderRadius: 'full',
          bg: 'gray.subtle.bg'
        },
        thumb: {
          '--thumb-bg': '{colors.gray.subtle.bg.active}'
        }
      }
    },
    size: {
      xs: { root: { '--thumb-size': 'sizes.1' } },
      sm: { root: { '--thumb-size': 'sizes.1.5' } },
      md: { root: { '--thumb-size': 'sizes.2' } },
      lg: { root: { '--thumb-size': 'sizes.2.5' } }
    }
  },
  defaultVariants: {
    size: 'md',
    scrollbar: 'auto'
  }
});
