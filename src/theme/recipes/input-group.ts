import { defineSlotRecipe } from '@pandacss/dev';

export const inputGroup = defineSlotRecipe({
  className: 'input-group',
  slots: ['root', 'element'],
  base: {
    root: {
      position: 'relative',
      width: 'full'
    },
    element: {
      display: 'flex',
      zIndex: '2',
      position: 'absolute',
      justifyContent: 'center',
      alignItems: 'center',
      height: 'full',
      color: 'fg.muted',
      _icon: {
        color: 'fg.subtle'
      }
    }
  },
  variants: {
    size: {
      xs: {
        element: { minW: '8', _icon: { boxSize: '4' } },
        root: {
          '& > input:not(:first-child)': { ps: '7!' },
          '& > input:not(:last-child)': { pe: '7!' }
        }
      },
      sm: {
        root: {
          '& > input:not(:first-child)': { ps: '8!' },
          '& > input:not(:last-child)': { pe: '8!' }
        },
        element: { minW: '9', _icon: { boxSize: '4.5' } }
      },
      md: {
        root: {
          '& > input:not(:first-child)': { ps: '9!' },
          '& > input:not(:last-child)': { pe: '9!' }
        },
        element: { minW: '10', _icon: { boxSize: '5' } }
      },
      lg: {
        root: {
          '& > input:not(:first-child)': { ps: '10!' },
          '& > input:not(:last-child)': { pe: '10!' }
        },
        element: { minW: '11', _icon: { boxSize: '5' } }
      },
      xl: {
        root: {
          '& > input:not(:first-child)': { ps: '11!' },
          '& > input:not(:last-child)': { pe: '11!' }
        },
        element: { minW: '11', _icon: { boxSize: '5.5' } }
      }
    }
  },
  defaultVariants: {
    size: 'md'
  }
});
