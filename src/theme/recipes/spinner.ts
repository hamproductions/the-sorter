import { defineRecipe } from '@pandacss/dev';

export const spinner = defineRecipe({
  className: 'spinner',
  base: {
    animation: 'spin',
    animationDuration: 'slowest',
    display: 'inline-block',
    borderColor: 'currentColor',
    borderInlineStartColor: 'var(--spinner-track-color)',
    borderBottomColor: 'var(--spinner-track-color)',
    borderRadius: 'full',
    borderWidth: '2px',
    width: 'var(--spinner-size)',
    height: 'var(--spinner-size)',
    borderStyle: 'solid',
    '--spinner-track-color': 'transparent'
  },
  variants: {
    size: {
      inherit: { '--spinner-size': '1em' },
      xs: { '--spinner-size': 'sizes.3' },
      sm: { '--spinner-size': 'sizes.4' },
      md: { '--spinner-size': 'sizes.5' },
      lg: { '--spinner-size': 'sizes.6' },
      xl: { '--spinner-size': 'sizes.7' },
      '2xl': { '--spinner-size': 'sizes.8' }
    }
  },
  defaultVariants: {
    size: 'md'
  }
});
