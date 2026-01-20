import { defineRecipe } from '@pandacss/dev';

export const icon = defineRecipe({
  className: 'icon',
  base: {
    display: 'inline-block',
    flexShrink: '0',
    color: 'currentcolor',
    lineHeight: '1em',
    verticalAlign: 'middle'
  },
  variants: {
    size: {
      '2xs': { boxSize: '3' },
      xs: { boxSize: '4' },
      sm: { boxSize: '4.5' },
      md: { boxSize: '5' },
      lg: { boxSize: '5.5' },
      xl: { boxSize: '6' }
    }
  },
  defaultVariants: {
    size: 'md'
  }
});
