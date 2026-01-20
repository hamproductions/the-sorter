import { defineRecipe } from '@pandacss/dev';

export const link = defineRecipe({
  className: 'link',
  base: {
    cursor: 'pointer',
    display: 'inline-flex',
    gap: '1.5',
    alignItems: 'center',
    borderRadius: 'l1',
    focusVisibleRing: 'outside',
    outline: 'none',
    fontWeight: 'medium',
    textDecorationThickness: '0.1em',
    textUnderlineOffset: '0.125em',
    transitionDuration: 'normal',
    transitionProperty: 'text-decoration-color',
    textDecorationLine: 'underline',
    _icon: {
      boxSize: '1em'
    }
  },
  variants: {
    variant: {
      underline: {
        textDecorationColor: 'colorPalette.surface.fg/60',
        _hover: {
          textDecorationColor: 'colorPalette.surface.fg'
        }
      },
      plain: {
        textDecorationColor: 'transparent',
        _hover: {
          textDecorationColor: 'colorPalette.surface.fg'
        }
      }
    }
  },
  defaultVariants: {
    variant: 'plain'
  }
});
