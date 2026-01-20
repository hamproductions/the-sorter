import { clipboardAnatomy } from '@ark-ui/react/anatomy';
import { defineSlotRecipe } from '@pandacss/dev';

export const clipboard = defineSlotRecipe({
  className: 'clipboard',
  slots: clipboardAnatomy.keys(),
  base: {
    root: {
      display: 'flex',
      gap: '1.5',
      flexDirection: 'column',
      alignItems: 'flex-start'
    },
    label: {
      textStyle: 'sm',
      gap: '0.5',
      color: 'fg.default',
      fontWeight: 'medium'
    }
  }
});
