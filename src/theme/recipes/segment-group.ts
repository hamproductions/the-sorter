import { segmentGroupAnatomy } from '@ark-ui/react/anatomy';
import { defineSlotRecipe } from '@pandacss/dev';

export const segmentGroup = defineSlotRecipe({
  className: 'segment-group',
  slots: segmentGroupAnatomy.keys(),
  base: {
    root: {
      display: 'inline-flex',
      pos: 'relative',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 'l3',
      boxShadowColor: 'border',
      bg: {
        _dark: 'gray.1',
        _light: 'gray.2'
      },
      boxShadow: 'inset 0 0 0px 1px var(--shadow-color)',
      isolation: 'isolate',
      _vertical: {
        flexDirection: 'column',
        alignItems: 'stretch'
      }
    },
    item: {
      display: 'inline-flex',
      position: 'relative',
      gap: '2',
      flexShrink: '0',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 'l3',
      fontWeight: 'medium',
      userSelect: 'none',
      _disabled: {
        opacity: '0.5'
      },
      _before: {
        position: 'absolute',
        bg: 'gray.surface.border',
        transition: 'opacity 0.2s',
        content: '""'
      },

      _horizontal: {
        _before: {
          insetBlock: '1.5',
          insetInlineStart: '0',
          width: '1px'
        }
      },

      _vertical: {
        _before: {
          insetInline: '1.5',
          insetBlockStart: '0',
          height: '1px'
        }
      },

      '&:has(input:focus-visible)': {
        focusVisibleRing: 'outside'
      },

      '& + &[data-state=checked], &[data-state=checked] + &, &:first-of-type': {
        _before: {
          opacity: '0'
        }
      }
    },

    indicator: {
      zIndex: -1,
      pos: 'absolute',
      borderColor: 'gray.surface.border',
      borderRadius: 'l3',
      borderWidth: '1px',
      width: 'var(--width)',
      height: 'var(--height)',
      bg: {
        _dark: 'gray.2',
        _light: 'white'
      }
    }
  },

  variants: {
    size: {
      xs: { item: { textStyle: 'sm', minW: '8', h: '8', px: '2.5', _icon: { boxSize: '4' } } },
      sm: { item: { textStyle: 'sm', minW: '9', h: '9', px: '3', _icon: { boxSize: '4' } } },
      md: { item: { textStyle: 'sm', minW: '10', h: '10', px: '3.5', _icon: { boxSize: '5' } } },
      lg: { item: { textStyle: 'md', minW: '11', h: '11', px: '4', _icon: { boxSize: '5' } } },
      xl: { item: { textStyle: 'md', minW: '12', h: '12', px: '4.5', _icon: { boxSize: '5.5' } } }
    },
    fitted: {
      true: {
        root: {
          display: 'flex'
        },
        item: {
          flex: '1'
        }
      }
    }
  },

  defaultVariants: {
    size: 'md'
  }
});
