import { defineRecipe } from '@pandacss/dev';

export const formLabel = defineRecipe({
  className: 'formLabel',
  base: {
    display: 'block',
    mb: '1',
    fontWeight: 'bold'
  },
  variants: {
    size: {
      sm: { textStyle: 'sm' },
      md: { textStyle: 'md' },
      lg: { textStyle: 'lg' },
      xl: { textStyle: 'xl' }
    }
  },
  defaultVariants: {
    size: 'md'
  }
});
