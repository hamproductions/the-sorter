import { accordionAnatomy } from '@ark-ui/react/anatomy';
import { defineSlotRecipe } from '@pandacss/dev';

export const accordion = defineSlotRecipe({
  className: 'accordion',
  slots: accordionAnatomy.extendWith('itemBody').keys(),
  base: {
    root: {
      width: 'full',
      '--accordion-radius': 'radii.l2'
    },
    item: {
      overflowAnchor: 'none'
    },
    itemTrigger: {
      textStyle: 'lg',
      cursor: 'pointer',
      display: 'flex',
      gap: '3',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderRadius: 'var(--accordion-radius)',
      width: 'full',
      color: 'fg.default',
      fontWeight: 'semibold',
      textAlign: 'start',
      _disabled: {
        layerStyle: 'disabled'
      },
      _focusVisible: {
        outline: '2px solid',
        outlineColor: 'colorPalette.focusRing'
      }
    },
    itemIndicator: {
      transformOrigin: 'center',
      color: 'fg.subtle',
      transition: 'rotate 0.2s',
      _open: {
        rotate: '180deg'
      },
      _icon: {
        width: '1.2em',
        height: '1.2em'
      }
    },
    itemBody: {
      pb: 'calc(var(--accordion-padding-y) * 2)',
      color: 'fg.muted'
    },
    itemContent: {
      borderRadius: 'var(--accordion-radius)',
      overflow: 'hidden',
      _open: {
        animationName: 'expand-height, fade-in',
        animationDuration: 'normal'
      },
      _closed: {
        animationName: 'collapse-height, fade-out',
        animationDuration: 'normal'
      }
    }
  },
  variants: {
    variant: {
      outline: {
        item: {
          borderBottomWidth: '1px'
        }
      },
      plain: {}
    },
    size: {
      md: {
        root: {
          '--accordion-padding-x': 'spacing.4',
          '--accordion-padding-y': 'spacing.2.5'
        },
        itemTrigger: {
          textStyle: 'md',
          py: 'var(--accordion-padding-y)'
        }
      }
    }
  },
  defaultVariants: {
    size: 'md',
    variant: 'outline'
  }
});
