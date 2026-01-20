import { numberInputAnatomy } from '@ark-ui/react/anatomy';
import { defineSlotRecipe } from '@pandacss/dev';
import { input } from './input';

const trigger = {
  alignItems: 'center',
  color: 'fg.muted',
  cursor: 'pointer',
  display: 'flex',
  flex: '1',
  justifyContent: 'center',
  lineHeight: '1',
  transition: 'common',
  userSelect: 'none',
  _icon: {
    boxSize: '1em'
  },
  _hover: {
    bg: 'gray.surface.bg.hover'
  },
  _active: {
    bg: 'gray.surface.bg.active'
  }
};

export const numberInput = defineSlotRecipe({
  className: 'number-input',
  slots: numberInputAnatomy.keys(),
  base: {
    root: {
      position: 'relative',
      isolation: 'isolate',
      _disabled: {
        layerStyle: 'disabled'
      }
    },
    control: {
      display: 'flex',
      zIndex: '1',
      position: 'absolute',
      insetEnd: '0px',
      top: '0',
      flexDirection: 'column',
      divideY: '1px',
      borderStartWidth: '1px',
      width: 'var(--stepper-width)',
      height: 'calc(100% - 2px)',
      margin: '1px'
    },
    input: {
      ...input.base,
      pe: 'calc(var(--stepper-width) + 0.5rem)',
      verticalAlign: 'top'
    },
    label: {
      color: 'fg.default',
      fontWeight: 'medium'
    },
    incrementTrigger: {
      ...trigger,
      borderTopRightRadius: 'l2'
    },
    decrementTrigger: {
      ...trigger,
      borderBottomRightRadius: 'l2'
    }
  },
  variants: {
    size: {
      sm: {
        control: {
          '--stepper-width': 'sizes.4.5'
        },
        input: input.variants.size.sm
      },
      md: {
        control: {
          '--stepper-width': 'sizes.5'
        },
        input: input.variants.size.md
      },
      lg: {
        control: {
          '--stepper-width': 'sizes.5.5'
        },
        input: input.variants.size.lg
      },
      xl: {
        control: {
          '--stepper-width': 'sizes.6'
        },
        input: input.variants.size.xl
      }
    },
    variant: {
      outline: {
        input: input.variants.variant.outline
      },
      surface: {
        input: input.variants.variant.surface
      }
    }
  },
  defaultVariants: {
    size: 'md',
    variant: 'outline'
  }
});
