import { carouselAnatomy } from '@ark-ui/react/anatomy';
import { defineSlotRecipe } from '@pandacss/dev';

export const carousel = defineSlotRecipe({
  className: 'carousel',
  slots: carouselAnatomy.keys(),
  base: {
    root: {
      display: 'flex',
      position: 'relative',
      gap: '2',
      flexDirection: 'column',
      _vertical: {
        flexDirection: 'row'
      }
    },
    control: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderRadius: 'l2',
      _vertical: {
        flexDirection: 'column'
      }
    },
    itemGroup: {
      flex: '1'
    },
    indicatorGroup: {
      display: 'flex',
      _vertical: {
        flexDirection: 'column'
      }
    },
    indicator: {
      cursor: 'pointer',
      borderRadius: 'full',
      background: 'gray.subtle.bg',
      _current: {
        background: 'colorPalette.solid.bg'
      },
      focusVisibleRing: 'outside'
    }
  },
  variants: {
    inline: {
      true: {
        control: {
          position: 'absolute',
          left: '50%',
          bottom: '3',
          transform: 'translateX(-50%)',
          p: '1',
          background: { _dark: 'black.a11', _light: 'white.a11' }
        }
      }
    },
    size: {
      md: {
        control: {
          gap: '3'
        },
        indicatorGroup: {
          gap: '3'
        },
        indicator: {
          boxSize: '2.5'
        }
      }
    }
  },
  defaultVariants: {
    size: 'md'
  }
});
