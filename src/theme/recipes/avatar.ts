import { avatarAnatomy } from '@ark-ui/react/anatomy';
import { defineSlotRecipe } from '@pandacss/dev';

export const avatar = defineSlotRecipe({
  className: 'avatar',
  slots: avatarAnatomy.keys(),
  base: {
    root: {
      display: 'inline-flex',
      position: 'relative',
      flexShrink: '0',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 'var(--avatar-radius)',
      width: 'var(--avatar-size)',
      height: 'var(--avatar-size)',
      fontSize: 'var(--avatar-font-size)',
      fontWeight: 'medium',
      verticalAlign: 'top',
      userSelect: 'none'
    },
    fallback: {
      borderRadius: 'var(--avatar-radius)',
      fontSize: 'var(--avatar-font-size)',
      fontWeight: 'medium',
      lineHeight: '1',
      textTransform: 'uppercase'
    },
    image: {
      objectFit: 'cover',
      borderRadius: 'var(--avatar-radius)',
      width: '100%',
      height: '100%'
    }
  },
  variants: {
    size: {
      full: {
        root: {
          '--avatar-size': '100%',
          '--avatar-font-size': '100%'
        }
      },
      '2xs': {
        root: {
          '--avatar-font-size': 'fontSizes.2xs',
          '--avatar-size': 'sizes.6'
        },
        fallback: {
          _icon: { width: '3', height: '3' }
        }
      },
      xs: {
        root: {
          '--avatar-font-size': 'fontSizes.xs',
          '--avatar-size': 'sizes.8'
        },
        fallback: {
          _icon: { width: '4', height: '4' }
        }
      },
      sm: {
        root: {
          '--avatar-font-size': 'fontSizes.sm',
          '--avatar-size': 'sizes.9'
        },
        fallback: {
          _icon: { width: '4.5', height: '4.5' }
        }
      },
      md: {
        root: {
          '--avatar-font-size': 'fontSizes.md',
          '--avatar-size': 'sizes.10'
        },
        fallback: {
          _icon: { width: '5', height: '5' }
        }
      },
      lg: {
        root: {
          '--avatar-font-size': 'fontSizes.md',
          '--avatar-size': 'sizes.11'
        },
        fallback: {
          _icon: { width: '5.5', height: '5.5' }
        }
      },
      xl: {
        root: {
          '--avatar-font-size': 'fontSizes.lg',
          '--avatar-size': 'sizes.12'
        },
        fallback: {
          _icon: { width: '6', height: '6' }
        }
      },
      '2xl': {
        root: {
          '--avatar-font-size': 'fontSizes.xl',
          '--avatar-size': 'sizes.16'
        },
        fallback: {
          _icon: { width: '8', height: '8' }
        }
      }
    },
    variant: {
      solid: {
        root: {
          color: 'colorPalette.solid.fg',
          bg: 'colorPalette.solid.bg'
        }
      },
      surface: {
        root: {
          borderColor: 'colorPalette.surface.border',
          borderWidth: '1px',
          color: 'colorPalette.surface.fg',
          bg: 'colorPalette.surface.bg'
        }
      },
      subtle: {
        root: {
          color: 'colorPalette.subtle.fg',
          bg: 'colorPalette.subtle.bg'
        }
      },
      outline: {
        root: {
          borderColor: 'colorPalette.outline.border',
          borderWidth: '1px',
          color: 'colorPalette.outline.fg'
        }
      }
    },
    shape: {
      square: {},
      rounded: {
        root: { '--avatar-radius': 'radii.l3' }
      },
      full: {
        root: { '--avatar-radius': 'radii.full' }
      }
    }
  },
  defaultVariants: {
    size: 'md',
    shape: 'full',
    variant: 'subtle'
  }
});
