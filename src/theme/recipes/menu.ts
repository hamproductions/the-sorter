import { menuAnatomy } from '@ark-ui/react/anatomy';
import { defineSlotRecipe } from '@pandacss/dev';

export const menu = defineSlotRecipe({
  className: 'menu',
  slots: menuAnatomy.keys(),
  base: {
    content: {
      display: 'flex',
      zIndex: 'calc(var(--menu-z-index) + var(--layer-index, 0))',
      position: 'relative',
      flexDirection: 'column',
      outline: '0',
      borderRadius: 'l3',
      minWidth: 'max(var(--reference-width), {sizes.40})',
      maxH: 'min(var(--available-height), {sizes.96})',
      bg: 'gray.surface.bg',
      boxShadow: 'md',
      overflow: 'hidden',
      overflowY: 'auto',
      _open: {
        animationStyle: 'slide-fade-in',
        animationDuration: 'fast'
      },
      _closed: {
        animationStyle: 'slide-fade-out',
        animationDuration: 'faster'
      },
      '--menu-z-index': 'zIndex.dropdown'
    },
    item: {
      display: 'flex',
      flex: '0 0 auto',
      alignItems: 'center',
      outline: '0',
      borderRadius: 'l2',
      width: '100%',
      textDecoration: 'none',
      textAlign: 'start',
      userSelect: 'none',
      _disabled: {
        layerStyle: 'disabled'
      },
      _highlighted: {
        bg: 'gray.surface.bg.hover'
      }
    },
    trigger: {
      _focusVisible: {
        focusVisibleRing: 'outside'
      }
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
        bg: 'border',
        content: '""'
      }
    },
    itemIndicator: {
      display: 'flex',
      flex: '1',
      justifyContent: 'flex-end',
      _checked: {
        _icon: {
          color: 'colorPalette.plain.fg'
        }
      }
    }
  },
  variants: {
    size: {
      xs: {
        content: { textStyle: 'sm', gap: '0.5', p: '1' },
        item: { gap: '2', minH: '8', px: '1', _icon: { boxSize: '3.5' } },
        itemGroup: { gap: '0.5' },
        itemGroupLabel: { height: '8', px: '1' },
        separator: { my: '0.5', mx: '-1' }
      },
      sm: {
        content: { textStyle: 'sm', gap: '0.5', p: '1' },
        item: { gap: '2', minH: '9', px: '1.5', _icon: { boxSize: '4' } },
        itemGroup: { gap: '0.5' },
        itemGroupLabel: { height: '9', px: '1.5' },
        separator: { my: '0.5', mx: '-1.5' }
      },
      md: {
        content: { textStyle: 'md', gap: '0.5', p: '1' },
        item: { gap: '2', minH: '10', px: '2', _icon: { boxSize: '4' } },
        itemGroup: { gap: '0.5' },
        itemGroupLabel: { height: '10', px: '2' },
        separator: { my: '0.5', mx: '-2' }
      },
      lg: {
        content: { textStyle: 'md', gap: '0.5', p: '1' },
        item: { gap: '2', minH: '11', px: '2.5', _icon: { boxSize: '4.5' } },
        itemGroup: { gap: '0.5' },
        itemGroupLabel: { height: '11', px: '2.5' },
        separator: { my: '0.5', mx: '-2.5' }
      },
      xl: {
        content: { textStyle: 'lg', gap: '1', p: '1' },
        item: { gap: '3', minH: '12', px: '3', _icon: { boxSize: '5' } },
        itemGroup: { gap: '1' },
        itemGroupLabel: { height: '12', px: '3' },
        separator: { my: '0', mx: '-3' }
      }
    }
  },
  defaultVariants: {
    size: 'md'
  }
});
