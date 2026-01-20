import { editableAnatomy } from '@ark-ui/react/anatomy';
import { defineSlotRecipe } from '@pandacss/dev';

export const editable = defineSlotRecipe({
  className: 'editable',
  slots: editableAnatomy.keys(),
  base: {
    root: {
      display: 'inline-flex',
      position: 'relative',
      gap: '1.5',
      alignItems: 'center',
      width: 'full'
    },
    preview: {
      cursor: 'default',
      display: 'inline-flex',
      alignItems: 'center',
      borderRadius: 'l2',
      transitionDuration: 'normal',
      transitionProperty: 'common',
      _disabled: {
        userSelect: 'none'
      },
      _hover: {
        bg: 'gray.plain.bg.hover'
      }
    },
    input: {
      borderRadius: 'l2',

      focusRingWidth: '2px',
      focusRing: 'inside',
      width: 'full',
      transitionDuration: 'normal',
      transitionProperty: 'common',
      _focusVisible: {
        outlineOffset: '-1px'
      }
    },
    control: {
      display: 'inline-flex',
      gap: '1.5',
      alignItems: 'center'
    }
  },
  variants: {
    size: {
      '2xs': {
        preview: { textStyle: 'xs', px: '2', py: '0.5' },
        input: { textStyle: 'xs', px: '2', py: '0.5' }
      },
      xs: {
        preview: { textStyle: 'sm', py: '1.5', px: '2.5' },
        input: { textStyle: 'sm', py: '1.5', px: '2.5' }
      },
      sm: {
        preview: { textStyle: 'sm', py: '2', px: '3' },
        input: { textStyle: 'sm', py: '2', px: '3' }
      },
      md: {
        preview: { textStyle: 'sm', py: '2.5', px: '3.5' },
        input: { textStyle: 'sm', py: '2.5', px: '3.5' }
      },
      lg: {
        preview: { textStyle: 'md', py: '2.5', px: '4' },
        input: { textStyle: 'md', py: '2.5', px: '4' }
      }
    }
  },
  defaultVariants: {
    size: 'md'
  }
});
