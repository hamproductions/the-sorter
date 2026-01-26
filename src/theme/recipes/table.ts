import { defineSlotRecipe } from '@pandacss/dev';

export const table = defineSlotRecipe({
  className: 'table',
  slots: ['root', 'body', 'cell', 'foot', 'head', 'header', 'row', 'caption'],
  base: {
    root: {
      width: 'full',
      fontVariantNumeric: 'lining-nums tabular-nums',
      textAlign: 'start',
      verticalAlign: 'top',
      borderCollapse: 'collapse'
    },
    cell: {
      textStyle: 'sm',
      _pinned: {
        zIndex: 1,
        position: 'sticky',
        shadowColor: 'border',
        bg: 'inherit',
        boxShadow: 'inset 0 -1px 0 0 var(--shadow-color)',
        overflow: 'unset'
      },
      alignItems: 'center',
      color: 'fg.muted',
      shadowColor: 'border',
      textAlign: 'start',
      textOverflow: 'ellipsis',
      boxShadow: 'inset 0 -1px 0 0 var(--shadow-color)',
      overflow: 'hidden',
      whiteSpace: 'nowrap'
    },
    row: {
      _last: { '& td': { boxShadow: 'none' } }
    },
    header: {
      _pinned: {
        zIndex: 2,
        position: 'sticky',
        bg: 'inherit'
      },
      shadowColor: 'border',
      textAlign: 'left',
      verticalAlign: 'middle',
      boxShadow: 'inset 0 -1px 0 0 var(--shadow-color)'
    },
    head: {
      textStyle: 'xs',
      color: 'fg.muted',
      fontWeight: 'semibold',
      textAlign: 'start',
      whiteSpace: 'nowrap'
    },
    caption: {
      color: 'fg.subtle',
      fontWeight: 'medium'
    },
    foot: {
      fontWeight: 'medium',
      '& td': { shadowColor: 'border', boxShadow: 'inset 0 1px 0 0 var(--shadow-color)!' }
    }
  },
  variants: {
    variant: {
      surface: {
        header: { bg: 'gray.surface.bg.hover' },
        row: { bg: 'gray.surface.bg' }
      },
      plain: {}
    },
    striped: {
      true: {
        row: { '&:nth-of-type(odd) td': { bg: 'gray.surface.bg.hover' } }
      }
    },
    interactive: {
      true: {
        body: { '& tr': { _hover: { bg: 'gray.surface.bg.hover' } } }
      }
    },
    columnBorder: {
      true: {
        header: { '&:not(:last-of-type)': { borderInlineEndWidth: '1px' } },
        cell: { '&:not(:last-of-type)': { borderInlineEndWidth: '1px' } }
      }
    },
    stickyHeader: {
      true: {
        head: {
          '& :where(tr)': {
            zIndex: 2,
            position: 'sticky',
            top: 'var(--table-sticky-offset, 0)'
          }
        }
      }
    },
    size: {
      md: {
        root: { textStyle: 'sm' },
        header: { py: '3', px: '3' },
        cell: { py: '3', px: '3' }
      }
    }
  },
  defaultVariants: {
    size: 'md',
    variant: 'plain'
  }
});
