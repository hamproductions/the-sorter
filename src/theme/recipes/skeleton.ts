import { defineRecipe } from '@pandacss/dev';

export const skeleton = defineRecipe({
  jsx: ['Skeleton', 'SkeletonCircle', 'SkeletonText'],
  className: 'skeleton',
  base: {},
  variants: {
    loading: {
      true: {
        cursor: 'default',
        flexShrink: '0',
        borderRadius: 'l2',
        color: 'transparent',
        backgroundClip: 'padding-box',
        boxShadow: 'none',
        userSelect: 'none',
        pointerEvents: 'none',
        '&::before, &::after, *': {
          visibility: 'hidden'
        }
      },
      false: {
        background: 'unset',
        animation: 'fade-in var(--fade-duration, 0.1s) ease-out !important'
      }
    },

    circle: {
      true: {
        display: 'flex',
        flex: '0 0 auto',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: '9999px'
      }
    },

    variant: {
      pulse: {
        background: 'gray.subtle.bg.active',
        animation: 'pulse',
        animationDuration: 'var(--duration, 1.2s)'
      },
      shine: {
        backgroundImage:
          'linear-gradient(270deg,var(--start-color),var(--end-color),var(--end-color),var(--start-color))',
        backgroundSize: '400% 100%',
        animation: 'bg-position var(--duration, 5s) ease-in-out infinite',
        '--animate-from': '200%',
        '--animate-to': '-200%',
        '--start-color': 'colors.gray.subtle.bg',
        '--end-color': 'colors.gray.subtle.bg.active'
      },
      none: {
        animation: 'none'
      }
    }
  },

  defaultVariants: {
    variant: 'pulse',
    loading: true
  }
});
