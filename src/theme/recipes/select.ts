import { selectAnatomy } from '@ark-ui/react/anatomy';
import { defineSlotRecipe } from '@pandacss/dev';

export const select = defineSlotRecipe({
  className: 'select',
  slots: selectAnatomy.extendWith('indicatorGroup').keys(),
  base: {
    root: {
      display: 'flex',
      gap: '1.5',
      flexDirection: 'column',
      width: 'full'
    },
    content: {
      display: 'flex',
      zIndex: 'dropdown',
      flexDirection: 'column',
      outline: 0,
      borderRadius: 'l2',
      minWidth: 'max(var(--reference-width), {sizes.40})',
      maxH: 'min(var(--available-height), {sizes.96})',
      background: 'gray.surface.bg',
      boxShadow: 'md',
      overflowY: 'auto',
      _open: {
        animationStyle: 'slide-fade-in',
        animationDuration: 'slow'
      },
      _closed: {
        animationStyle: 'slide-fade-out',
        animationDuration: 'fastest'
      }
    },
    item: {
      cursor: 'pointer',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderRadius: 'l1',
      userSelect: 'none',
      _disabled: {
        layerStyle: 'disabled'
      },
      _highlighted: {
        background: 'gray.surface.bg.hover'
      },
      _selected: {},
      _hover: {
        background: 'gray.surface.bg.hover'
      }
    },
    indicatorGroup: {
      display: 'flex',
      gap: '1',
      alignItems: 'center',
      pointerEvents: 'none'
    },
    indicator: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      color: { base: 'fg.subtle' }
    },
    itemGroupLabel: {
      display: 'flex',
      gap: '1px',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'flex-start',
      color: 'fg.subtle',
      fontWeight: 'medium',
      _after: {
        width: '100%',
        height: '1px',
        bg: 'gray.4',
        content: '""'
      }
    },
    itemIndicator: {
      color: 'colorPalette.plain.fg'
    },
    label: {
      textStyle: 'sm',
      fontWeight: 'medium',
      userSelect: 'none'
    },
    trigger: {
      cursor: 'pointer',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      outline: '0',
      borderRadius: 'l2',
      width: 'full',
      minWidth: '0',
      textAlign: 'start',
      userSelect: 'none',
      transition: 'common',
      _disabled: {
        layerStyle: 'disabled'
      },
      _placeholderShown: {
        color: 'fg.subtle'
      }
    },
    valueText: {
      textOverflow: 'ellipsis',
      overflow: 'hidden',
      whiteSpace: 'nowrap'
    }
  },
  variants: {
    variant: {
      outline: {
        trigger: {
          borderColor: 'gray.outline.border',

          borderWidth: '1px',
          focusVisibleRing: 'inside'
        }
      },
      surface: {
        trigger: {
          borderColor: 'gray.surface.border',

          borderWidth: '1px',
          bg: 'gray.surface.bg',
          focusVisibleRing: 'inside'
        }
      }
    },
    size: {
      xs: {
        content: { textStyle: 'sm', gap: '0.5', p: '1' },
        item: { gap: '2', minH: '8', px: '1', _icon: { boxSize: '3.5' } },
        itemGroup: { gap: '0.5' },
        itemGroupLabel: { height: '8', px: '1' },
        trigger: { textStyle: 'sm', gap: '2', h: '8', px: '2', _icon: { boxSize: '3.5' } }
      },
      sm: {
        content: { textStyle: 'sm', gap: '0.5', p: '1' },
        item: { gap: '2', minH: '9', px: '1.5', _icon: { boxSize: '4' } },
        itemGroup: { gap: '0.5' },
        itemGroupLabel: { height: '9', px: '1.5' },
        trigger: { textStyle: 'sm', gap: '2', h: '9', px: '2.5', _icon: { boxSize: '4' } }
      },
      md: {
        content: { textStyle: 'md', gap: '0.5', p: '1' },
        item: { gap: '2', minH: '10', px: '2', _icon: { boxSize: '4' } },
        itemGroup: { gap: '0.5' },
        itemGroupLabel: { height: '10', px: '2' },
        trigger: { textStyle: 'md', gap: '2', h: '10', px: '3', _icon: { boxSize: '4' } }
      },
      lg: {
        content: { textStyle: 'md', gap: '0.5', p: '1' },
        item: { gap: '2', minH: '11', px: '2.5', _icon: { boxSize: '4.5' } },
        itemGroup: { gap: '0.5' },
        itemGroupLabel: { height: '11', px: '2.5' },
        trigger: { textStyle: 'md', gap: '2', h: '11', px: '3.5', _icon: { boxSize: '4.5' } }
      },
      xl: {
        content: { textStyle: 'lg', gap: '1', p: '1' },
        item: { gap: '3', minH: '12', px: '3', _icon: { boxSize: '5' } },
        itemGroup: { gap: '1' },
        itemGroupLabel: { height: '12', px: '3' },
        trigger: { textStyle: 'lg', gap: '3', h: '12', px: '4', _icon: { boxSize: '5' } }
      }
    }
  },
  defaultVariants: {
    size: 'md',
    variant: 'outline'
  }
});
