import { ratingGroupAnatomy } from '@ark-ui/react/anatomy';
import { defineSlotRecipe } from '@pandacss/dev';

export const ratingGroup = defineSlotRecipe({
  className: 'rating-group',
  slots: ratingGroupAnatomy.extendWith('itemIndicator').keys(),
  base: {
    root: {
      display: 'inline-flex',
      alignItems: 'center',
      verticalAlign: 'top'
    },
    control: {
      display: 'inline-flex',
      gap: '0.5',
      alignItems: 'center'
    },
    item: {
      display: 'inline-flex',
      justifyContent: 'center',
      alignItems: 'center',
      userSelect: 'none'
    },
    label: {
      fontWeight: 'medium',
      userSelect: 'none'
    },
    itemIndicator: {
      display: 'inline-flex',
      position: 'relative',
      justifyContent: 'center',
      alignItems: 'center',
      _icon: {
        display: 'inline-block',
        position: 'absolute',
        top: 0,
        left: 0,
        flexShrink: 0,
        width: 'inherit',
        height: 'inherit',
        stroke: 'currentColor'
      },
      '--clip-path': { base: 'inset(0 50% 0 0)', _rtl: 'inset(0 0 0 50%)' },
      '& [data-bg]': {
        color: 'gray.subtle.bg'
      },
      '& [data-fg]': {
        color: 'transparent'
      },
      '&[data-highlighted]:not([data-half])': {
        '& [data-fg]': {
          color: 'colorPalette.solid.bg'
        }
      },
      '&[data-half]': {
        '& [data-fg]': {
          color: 'colorPalette.solid.bg',
          clipPath: 'var(--clip-path)'
        }
      }
    }
  },

  variants: {
    size: {
      xs: { root: { gap: '2' }, itemIndicator: { width: '4', height: '4' } },
      sm: { root: { gap: '2' }, itemIndicator: { width: '4.5', height: '4.5' } },
      md: { root: { gap: '3' }, itemIndicator: { width: '5', height: '5' } },
      lg: { root: { gap: '3' }, itemIndicator: { width: '5.5', height: '5.5' } },
      xl: { root: { gap: '3' }, itemIndicator: { width: '6', height: '6' } }
    }
  },

  defaultVariants: {
    size: 'md'
  }
});
