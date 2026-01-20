import { tagsInputAnatomy } from '@ark-ui/react/anatomy';
import { defineSlotRecipe } from '@pandacss/dev';

export const tagsInput = defineSlotRecipe({
  className: 'tags-input',
  slots: tagsInputAnatomy.keys(),
  base: {
    root: {
      display: 'flex',
      gap: '1.5',
      flexDirection: 'column',
      width: 'full'
    },
    label: {
      textStyle: 'label'
    },
    control: {
      display: 'flex',
      pos: 'relative',
      alignItems: 'center',
      borderRadius: 'l2',
      minH: 'var(--tags-input-height)',
      px: 'var(--tags-input-px)',

      transitionDuration: 'normal',
      transitionProperty: 'border-color, box-shadow',

      flexWrap: 'wrap',
      _disabled: {
        opacity: '0.5'
      },
      _invalid: {
        borderColor: 'var(--error-color)'
      },
      '--focus-color': 'colors.colorPalette.solid.bg',
      '--error-color': 'colors.error',
      '--input-height': 'var(--tags-input-height)'
    },
    clearTrigger: {
      cursor: { base: 'button', _disabled: 'initial' },
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 'l1',
      boxSize: 'calc(var(--tags-input-item-height) / 1.5)',

      color: 'fg.muted',
      focusRingWidth: '2px',
      focusVisibleRing: 'inside',
      _icon: {
        boxSize: '5'
      }
    },
    input: {
      flex: '1',
      outline: 'none',
      minWidth: '20',
      height: 'var(--tags-input-item-height)',

      px: 'calc(var(--tags-input-item-px) / 1.25)',
      _readOnly: {
        display: 'none'
      }
    },
    itemInput: {
      outline: 'none',
      minWidth: '2ch',
      height: 'var(--tags-input-item-height)',
      px: 'var(--tags-input-item-px)',
      lineHeight: '1',
      verticalAlign: 'middle'
    },
    itemDeleteTrigger: {
      cursor: 'pointer',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 'l1',
      _hover: {
        bg: 'colorPalette.plain.bg.hover'
      }
    },
    itemPreview: {
      display: 'inline-flex',
      alignItems: 'center',
      borderRadius: 'l1',
      height: 'var(--tags-input-item-height)',
      px: 'var(--tags-input-item-px)',

      userSelect: 'none'
    },
    itemText: {
      lineClamp: '1'
    }
  },
  variants: {
    variant: {
      outline: {
        control: {
          borderWidth: '1px',
          _focus: {
            borderColor: 'var(--focus-color)',
            outlineWidth: '1px',
            outlineColor: 'var(--focus-color)',
            outlineStyle: 'solid',
            _invalid: {
              borderColor: 'var(--error-color)',
              outlineColor: 'var(--error-color)'
            }
          }
        },
        itemPreview: {
          color: 'colorPalette.subtle.fg',
          bg: 'colorPalette.subtle.bg',
          _highlighted: {
            bg: 'colorPalette.subtle.bg.hover'
          }
        }
      },
      subtle: {
        control: {
          borderColor: 'transparent',
          borderWidth: '1px',
          color: 'gray.subtle.fg',
          bg: 'gray.subtle.bg',
          _focus: {
            borderColor: 'var(--focus-color)',
            outlineWidth: '1px',
            outlineColor: 'var(--focus-color)',
            outlineStyle: 'solid',
            _invalid: {
              borderColor: 'var(--error-color)',
              outlineColor: 'var(--error-color)'
            }
          }
        },
        itemPreview: {
          borderWidth: '1px',
          bg: 'gray.surface.bg',
          _highlighted: {
            borderColor: 'gray.surface.border.hover',
            bg: 'gray.surface.bg.hover'
          }
        }
      },
      surface: {
        control: {
          borderColor: 'gray.surface.border',
          borderWidth: '1px',
          bg: 'gray.surface.bg',
          _focus: {
            borderColor: 'var(--focus-color)',
            outlineWidth: '1px',
            outlineColor: 'var(--focus-color)',
            outlineStyle: 'solid',
            _invalid: {
              borderColor: 'var(--error-color)',
              outlineColor: 'var(--error-color)'
            }
          }
        },
        itemPreview: {
          color: 'colorPalette.subtle.fg',
          bg: 'colorPalette.subtle.bg',
          _highlighted: {
            bg: 'colorPalette.subtle.bg.hover'
          }
        }
      }
    },
    size: {
      xs: {
        root: {
          textStyle: 'xs',
          _icon: { boxSize: '3' },
          '--tags-input-height': 'sizes.8',
          '--tags-input-px': 'spacing.1.5',
          '--tags-input-item-height': 'sizes.5',
          '--tags-input-item-px': 'spacing.1'
        },
        control: { gap: '1' },
        itemPreview: { gap: '1' },
        itemDeleteTrigger: { boxSize: '3.5', me: '-1px' }
      },
      sm: {
        root: {
          textStyle: 'sm',
          _icon: { boxSize: '3.5' },
          '--tags-input-height': 'sizes.9',
          '--tags-input-px': 'spacing.1.5',
          '--tags-input-item-height': 'sizes.6',
          '--tags-input-item-px': 'spacing.1.5'
        },
        control: { gap: '1' },
        itemPreview: { gap: '1' },
        itemDeleteTrigger: { boxSize: '4.5', me: '-0.5' }
      },
      md: {
        root: {
          textStyle: 'sm',
          _icon: { boxSize: '3.5' },
          '--tags-input-height': 'sizes.10',
          '--tags-input-px': 'spacing.1.5',
          '--tags-input-item-height': 'sizes.7',
          '--tags-input-item-px': 'spacing.2'
        },
        control: { gap: '1.5' },
        itemPreview: { gap: '1' },
        itemDeleteTrigger: { boxSize: '5', me: '-1' }
      },
      lg: {
        root: {
          textStyle: 'md',
          _icon: { boxSize: '4' },
          '--tags-input-height': 'sizes.11',
          '--tags-input-px': 'spacing.1.5',
          '--tags-input-item-height': 'sizes.8',
          '--tags-input-item-px': 'spacing.2.5'
        },
        control: { gap: '1.5' },
        itemPreview: { gap: '1' },
        itemDeleteTrigger: { boxSize: '6', me: '-1.5' }
      }
    }
  },
  defaultVariants: {
    size: 'md',
    variant: 'outline'
  }
});
