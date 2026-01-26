import { defineRecipe } from '@pandacss/dev';

export const button = defineRecipe({
  jsx: ['Button', 'IconButton', 'CloseButton', 'ButtonGroup'],
  className: 'button',
  base: {
    cursor: 'pointer',
    display: 'inline-flex',
    appearance: 'none',
    position: 'relative',
    gap: '2',
    flexShrink: '0',
    justifyContent: 'center',
    alignItems: 'center',
    outline: '0',
    borderRadius: 'l2',
    fontWeight: 'semibold',
    verticalAlign: 'middle',
    userSelect: 'none',
    transition: 'colors',
    transitionProperty: 'background-color, border-color, color, box-shadow',
    isolation: 'isolate',
    whiteSpace: 'nowrap',
    _disabled: {
      layerStyle: 'disabled'
    },
    _icon: {
      flexShrink: '0'
    },
    focusVisibleRing: 'outside'
  },
  variants: {
    variant: {
      solid: {
        color: 'colorPalette.solid.fg',
        bg: 'colorPalette.solid.bg',
        _hover: {
          bg: 'colorPalette.solid.bg.hover'
        }
      },
      surface: {
        borderColor: 'colorPalette.surface.border',
        borderWidth: '1px',
        color: 'colorPalette.surface.fg',
        bg: 'colorPalette.surface.bg',
        _on: {
          bg: 'colorPalette.surface.bg.active'
        },
        _active: {
          bg: 'colorPalette.surface.bg.active'
        },
        _hover: {
          borderColor: 'colorPalette.surface.border.hover'
        }
      },
      subtle: {
        color: 'colorPalette.subtle.fg',
        bg: 'colorPalette.subtle.bg',
        _on: {
          bg: 'colorPalette.subtle.bg.active'
        },
        _active: {
          bg: 'colorPalette.subtle.bg.active'
        },
        _hover: {
          bg: 'colorPalette.subtle.bg.hover'
        }
      },
      outline: {
        borderColor: 'colorPalette.outline.border',
        borderWidth: '1px',
        color: 'colorPalette.outline.fg',
        _on: {
          bg: 'colorPalette.outline.bg.active'
        },
        _active: {
          bg: 'colorPalette.outline.bg.active'
        },
        _hover: {
          bg: 'colorPalette.outline.bg.hover'
        }
      },
      plain: {
        color: 'colorPalette.plain.fg',
        _on: {
          bg: 'colorPalette.plain.bg.active'
        },
        _active: {
          bg: 'colorPalette.plain.bg.active'
        },
        _hover: {
          bg: 'colorPalette.plain.bg.hover'
        }
      },
      ghost: {
        color: 'text.fg'
      },
      link: {
        minW: '0!',
        height: 'auto!',
        px: '0!',
        color: 'colorPalette.text.fg',
        textDecoration: 'none',
        _disabled: {
          textDecoration: 'none'
        },
        _hover: {
          textDecoration: 'underline'
        }
      }
    },
    size: {
      '2xs': { h: '6', minW: '6', textStyle: 'xs', px: '2', _icon: { boxSize: '3.5' } },
      xs: { textStyle: 'sm', minW: '8', h: '8', px: '2.5', _icon: { boxSize: '4' } },
      sm: { textStyle: 'sm', minW: '9', h: '9', px: '3', _icon: { boxSize: '4' } },
      md: { textStyle: 'sm', minW: '10', h: '10', px: '3.5', _icon: { boxSize: '5' } },
      lg: { textStyle: 'md', minW: '11', h: '11', px: '4', _icon: { boxSize: '5' } },
      xl: { textStyle: 'md', minW: '12', h: '12', px: '4.5', _icon: { boxSize: '5.5' } },
      '2xl': { h: '16', minW: '16', textStyle: 'xl', px: '6', _icon: { boxSize: '6' } }
    }
  },
  defaultVariants: {
    variant: 'solid',
    size: 'md'
  }
});
