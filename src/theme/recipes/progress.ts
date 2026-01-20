import { progressAnatomy } from '@ark-ui/react/anatomy';
import { defineSlotRecipe } from '@pandacss/dev';

export const progress = defineSlotRecipe({
  className: 'progress',
  slots: progressAnatomy.keys(),
  base: {
    root: {
      textStyle: 'sm',
      position: 'relative'
    },
    track: {
      position: 'relative',
      overflow: 'hidden'
    },
    range: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100%',
      bgColor: 'var(--track-color)',
      transitionDuration: 'slow',
      transitionProperty: 'width, height',
      _indeterminate: {
        position: 'absolute',
        minWidth: '50%',
        willChange: 'left',
        animation: 'position 1s ease infinite normal none running',
        backgroundImage: `linear-gradient(to right, transparent 0%, var(--track-color) 50%, transparent 100%)`,
        '--animate-from-x': '-40%',
        '--animate-to-x': '100%'
      }
    },
    label: {
      display: 'inline-flex',
      gap: '1',
      alignItems: 'center',
      fontWeight: 'medium'
    },
    valueText: {
      textStyle: 'xs',
      fontWeight: 'medium',
      lineHeight: '1'
    }
  },

  variants: {
    variant: {
      solid: {
        track: {
          bgColor: 'gray.subtle.bg'
        },
        range: {
          color: 'colorPalette.solid.fg',
          bgColor: 'colorPalette.solid.bg'
        }
      },
      subtle: {
        track: {
          bgColor: 'colorPalette.subtle.bg.active'
        },
        range: {
          color: 'colorPalette.solid.fg',
          bgColor: 'colorPalette.solid.bg'
        }
      }
    },

    shape: {
      square: {},
      rounded: {
        track: {
          borderRadius: 'l1'
        }
      },
      full: {
        track: {
          borderRadius: 'full'
        }
      }
    },

    striped: {
      true: {
        range: {
          backgroundImage: `linear-gradient(45deg, var(--stripe-color) 25%, transparent 25%, transparent 50%, var(--stripe-color) 50%, var(--stripe-color) 75%, transparent 75%, transparent)`,
          backgroundSize: `var(--stripe-size) var(--stripe-size)`,
          '--stripe-size': '1rem',
          '--stripe-color': {
            _dark: 'rgba(0, 0, 0, 0.3)',
            _light: 'rgba(255, 255, 255, 0.3)'
          }
        }
      }
    },

    animated: {
      true: {
        range: {
          animation: 'bg-position 1s linear infinite',
          '--animate-from': 'var(--stripe-size)'
        }
      }
    },

    size: {
      xs: { track: { h: '1.5' } },
      sm: { track: { h: '2' } },
      md: { track: { h: '2.5' } },
      lg: { track: { h: '3' } },
      xl: { track: { h: '3.5' } }
    }
  },

  defaultVariants: {
    variant: 'solid',
    size: 'md',
    shape: 'rounded'
  }
});
