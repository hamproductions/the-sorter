import { sliderAnatomy } from '@ark-ui/react/anatomy';
import { defineSlotRecipe } from '@pandacss/dev';

export const slider = defineSlotRecipe({
  className: 'slider',
  slots: sliderAnatomy.extendWith('markerIndicator').keys(),
  base: {
    root: {
      textStyle: 'sm',
      display: 'flex',
      position: 'relative',
      gap: '1',
      flexDirection: 'column',
      width: 'full',
      touchAction: 'none',
      isolation: 'isolate'
    },
    label: {
      textStyle: 'sm',
      fontWeight: 'medium'
    },
    control: {
      display: 'inline-flex',
      alignItems: 'center'
    },
    track: {
      flex: '1',
      borderRadius: 'full',
      overflow: 'hidden'
    },
    range: {
      width: 'inherit',
      height: 'inherit'
    },
    markerGroup: {
      zIndex: '1',
      position: 'absolute!'
    },
    marker: {
      textStyle: 'xs',
      display: 'flex',
      gap: 'calc(var(--slider-thumb-size) / 2)',
      alignItems: 'center',
      color: 'fg.muted'
    },
    markerIndicator: {
      borderRadius: 'full',
      width: 'var(--slider-marker-size)',
      height: 'var(--slider-marker-size)',
      bg: 'colorPalette.solid.fg'
    },
    thumb: {
      display: 'flex',
      zIndex: '2',
      justifyContent: 'center',
      alignItems: 'center',
      outline: 0,
      borderRadius: 'full',
      width: 'var(--slider-thumb-size)',
      height: 'var(--slider-thumb-size)',
      _focusVisible: {
        ringOffsetColor: 'bg',
        ring: '2px',
        ringOffset: '2px',
        ringColor: 'colorPalette.solid'
      }
    }
  },
  variants: {
    size: {
      sm: {
        root: {
          '--slider-thumb-size': 'sizes.5',
          '--slider-track-size': 'sizes.2',
          '--slider-marker-center': '8px',
          '--slider-marker-size': 'sizes.1',
          '--slider-marker-inset': '4px'
        }
      },
      md: {
        root: {
          '--slider-thumb-size': 'sizes.5',
          '--slider-track-size': 'sizes.2',
          '--slider-marker-center': '8px',
          '--slider-marker-size': 'sizes.1',
          '--slider-marker-inset': '4px'
        }
      },
      lg: {
        root: {
          '--slider-thumb-size': 'sizes.5',
          '--slider-track-size': 'sizes.2',
          '--slider-marker-center': '8px',
          '--slider-marker-size': 'sizes.1',
          '--slider-marker-inset': '4px'
        }
      }
    },
    variant: {
      outline: {
        thumb: {
          borderColor: 'colorPalette.solid.bg',
          borderWidth: '2px',
          bg: 'gray.surface.bg',
          boxShadow: 'xs'
        },
        range: {
          bg: 'colorPalette.solid.bg'
        },
        track: {
          bg: 'border'
        }
      }
    },
    orientation: {
      vertical: {
        root: {
          display: 'inline-flex'
        },
        control: {
          flexDirection: 'column',
          minWidth: 'var(--slider-thumb-size)',
          height: '100%',
          '&[data-has-mark-label]': {
            marginEnd: '4'
          }
        },
        track: {
          width: 'var(--slider-track-size)'
        },
        thumb: {
          left: '50%',
          translate: '-50% 0'
        },
        markerGroup: {
          insetBlock: 'var(--slider-marker-inset)',
          insetStart: 'var(--slider-marker-center)'
        },
        marker: {
          flexDirection: 'row'
        }
      },
      horizontal: {
        control: {
          flexDirection: 'row',
          width: '100%',
          minHeight: 'var(--slider-thumb-size)',
          '&[data-has-mark-label]': {
            marginBottom: '4'
          }
        },
        track: {
          height: 'var(--slider-track-size)'
        },
        thumb: {
          top: '50%',
          translate: '0 -50%'
        },
        markerGroup: {
          insetInline: 'var(--slider-marker-inset)',
          top: 'var(--slider-marker-center)'
        },
        marker: {
          flexDirection: 'column'
        }
      }
    }
  },
  defaultVariants: {
    size: 'md',
    variant: 'outline',
    orientation: 'horizontal'
  }
});
