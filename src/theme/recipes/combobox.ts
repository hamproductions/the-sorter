import { comboboxAnatomy } from '@ark-ui/react/anatomy';
import { defineSlotRecipe } from '@pandacss/dev';
import { input } from './input';

export const combobox = defineSlotRecipe({
  className: 'combobox',
  slots: comboboxAnatomy.extendWith('indicatorGroup').keys(),
  base: {
    root: {
      display: 'flex',
      gap: '1.5',
      flexDirection: 'column',
      width: 'full'
    },
    label: {
      textStyle: 'label'
    },
    input: {
      ...input.base,
      textOverflow: 'ellipsis',
      overflow: 'hidden',
      whiteSpace: 'nowrap'
    },
    control: {
      position: 'relative'
    },
    content: {
      display: 'flex',
      zIndex: 'dropdown',
      flexDirection: 'column',
      outline: '0',
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
      },
      '&[data-empty]:not(:has([data-scope=combobox][data-part=empty]))': {
        opacity: 0
      }
    },
    item: {
      cursor: 'pointer',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderRadius: 'l1',
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
    itemGroup: {
      display: 'flex',
      flexDirection: 'column'
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
      color: 'colorPalette.plain.fg'
    },
    indicatorGroup: {
      display: 'flex',
      pos: 'absolute',
      insetEnd: '0',
      top: '0',
      bottom: '0',
      gap: '1',
      justifyContent: 'center',
      alignItems: 'center'
    },
    trigger: {
      color: 'fg.subtle'
    },
    clearTrigger: {
      color: 'fg.muted'
    },
    empty: {
      display: 'flex',
      alignItems: 'center',
      color: 'fg.subtle'
    }
  },
  variants: {
    variant: {
      outline: {
        input: input.variants.variant.outline
      },
      surface: {
        input: input.variants.variant.surface
      },
      subtle: {
        input: input.variants.variant.subtle
      }
    },
    size: {
      xs: {
        input: {
          ...input.variants.size.xs,
          pe: '12'
        },
        content: { textStyle: 'sm', gap: '0.5', p: '1' },
        item: { gap: '2', minH: '8', px: '1', _icon: { boxSize: '3.5' } },
        itemGroup: { gap: '0.5' },
        itemGroupLabel: { height: '8', px: '1' },
        indicatorGroup: { px: '2', _icon: { boxSize: '3.5' } },
        empty: { minH: '8', px: '1' }
      },
      sm: {
        input: {
          ...input.variants.size.sm,
          pe: '14'
        },
        content: { textStyle: 'sm', gap: '0.5', p: '1' },
        item: { gap: '2', minH: '9', px: '1.5', _icon: { boxSize: '4' } },
        itemGroup: { gap: '0.5' },
        itemGroupLabel: { height: '9', px: '1.5' },
        indicatorGroup: { px: '2.5', _icon: { boxSize: '4' } },
        empty: { minH: '9', px: '1.5' }
      },
      md: {
        input: {
          ...input.variants.size.md,
          pe: '14'
        },
        content: { textStyle: 'md', gap: '0.5', p: '1' },
        indicatorGroup: { px: '3', _icon: { boxSize: '4' } },
        item: { gap: '2', minH: '10', px: '2', _icon: { boxSize: '4' } },
        itemGroup: { gap: '0.5' },
        itemGroupLabel: { height: '10', px: '2' },
        empty: { minH: '10', px: '2' }
      },
      lg: {
        input: {
          ...input.variants.size.lg,
          pe: '16'
        },
        content: { textStyle: 'md', gap: '0.5', p: '1' },
        item: { gap: '2', minH: '11', px: '2.5', _icon: { boxSize: '4.5' } },
        itemGroup: { gap: '0.5' },
        itemGroupLabel: { height: '11', px: '2.5' },
        indicatorGroup: { px: '3.5', _icon: { boxSize: '4.5' } },
        empty: { minH: '11', px: '2.5' }
      },
      xl: {
        input: {
          ...input.variants.size.xl,
          pe: '16'
        },
        content: { textStyle: 'lg', gap: '1', p: '1' },
        item: { gap: '3', minH: '12', px: '3', _icon: { boxSize: '5' } },
        itemGroup: { gap: '1' },
        itemGroupLabel: { height: '12', px: '3' },
        indicatorGroup: { px: '4', _icon: { boxSize: '5' } },
        empty: { minH: '12', px: '3' }
      }
    }
  },
  defaultVariants: {
    size: 'md',
    variant: 'outline'
  }
});
