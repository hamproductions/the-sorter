import { fieldAnatomy } from '@ark-ui/react/anatomy';
import { defineSlotRecipe } from '@pandacss/dev';

export const field = defineSlotRecipe({
  className: 'field',
  slots: fieldAnatomy.keys(),
  base: {
    root: {
      display: 'flex',
      gap: '1.5',
      flexDirection: 'column'
    },
    label: {
      textStyle: 'label',
      display: 'flex',
      gap: '0.5',
      alignItems: 'center',
      color: 'fg.default',
      textAlign: 'start',
      userSelect: 'none',
      _disabled: {
        layerStyle: 'disabled'
      }
    },
    requiredIndicator: {
      color: 'colorPalette.solid'
    },
    helperText: {
      textStyle: 'sm',
      color: 'fg.muted',
      _disabled: {
        layerStyle: 'disabled'
      }
    },
    errorText: {
      textStyle: 'sm',
      color: 'error'
    }
  }
});
