import { splitterAnatomy } from '@ark-ui/react/anatomy';
import { defineSlotRecipe } from '@pandacss/dev';

export const splitter = defineSlotRecipe({
  className: 'splitter',
  slots: splitterAnatomy.keys(),
  base: {
    root: {
      display: 'flex',
      gap: '2'
    },
    panel: {
      display: 'flex',
      borderRadius: 'l3',
      borderWidth: '1px',
      p: '4',
      background: 'gray.surface.bg'
    },
    resizeTrigger: {
      outline: '0',
      borderRadius: 'l3',
      background: 'gray.subtle.bg',
      transition: 'common',
      _horizontal: {
        minWidth: '1.5'
      },
      _vertical: {
        minHeight: '1.5'
      }
    }
  }
});
