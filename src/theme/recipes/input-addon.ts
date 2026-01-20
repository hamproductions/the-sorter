import { defineRecipe } from '@pandacss/dev';

export const inputAddon = defineRecipe({
  className: 'input-addon',
  base: {
    display: 'flex',
    flex: '0 0 auto',
    alignItems: 'center',
    alignSelf: 'stretch',
    borderRadius: 'l2',
    width: 'auto',
    color: 'fg.muted',
    whiteSpace: 'nowrap'
  },
  variants: {
    variant: {
      outline: {
        borderColor: 'gray.outline.border',
        borderWidth: '1px'
      },
      surface: {
        borderColor: 'gray.surface.border',
        borderWidth: '1px',
        bg: 'gray.surface.bg'
      },
      subtle: {
        bg: 'gray.subtle.bg'
      }
    },
    size: {
      xs: { textStyle: 'sm', px: '2', _icon: { boxSize: '4' } },
      sm: { textStyle: 'sm', px: '2.5', _icon: { boxSize: '4.5' } },
      md: { textStyle: 'md', px: '3', _icon: { boxSize: '5' } },
      lg: { textStyle: 'md', px: '3.5', _icon: { boxSize: '5' } },
      xl: { textStyle: 'lg', px: '4', _icon: { boxSize: '5.5' } }
    }
  },
  defaultVariants: {
    size: 'md',
    variant: 'outline'
  }
});
