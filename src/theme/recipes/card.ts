import { defineSlotRecipe } from '@pandacss/dev';

export const card = defineSlotRecipe({
  className: 'card',
  slots: ['root', 'header', 'body', 'footer', 'title', 'description'],
  base: {
    root: {
      display: 'flex',
      position: 'relative',
      flexDirection: 'column',
      borderRadius: 'l3',
      overflow: 'hidden'
    },
    header: {
      display: 'flex',
      gap: '1',
      flexDirection: 'column',
      p: '6'
    },
    body: {
      display: 'flex',
      flex: '1',
      flexDirection: 'column',
      px: '6',
      pb: '6'
    },
    footer: {
      display: 'flex',
      gap: '3',
      justifyContent: 'flex-end',
      px: '6',
      pt: '2',
      pb: '6'
    },
    title: {
      textStyle: 'lg',
      fontWeight: 'semibold'
    },
    description: {
      textStyle: 'sm',
      color: 'fg.muted'
    }
  },
  variants: {
    variant: {
      elevated: {
        root: {
          bg: 'gray.surface.bg',
          boxShadow: 'lg'
        }
      },
      outline: {
        root: {
          borderWidth: '1px',
          bg: 'gray.surface.bg'
        }
      },
      subtle: {
        root: {
          bg: 'gray.subtle.bg'
        }
      }
    }
  },
  defaultVariants: {
    variant: 'outline'
  }
});
