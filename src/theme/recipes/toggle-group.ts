import { toggleGroupAnatomy } from '@ark-ui/react/anatomy';
import { defineSlotRecipe } from '@pandacss/dev';

export const toggleGroup = defineSlotRecipe({
  className: 'toggle-group',
  slots: toggleGroupAnatomy.keys(),
  base: {
    root: {}
  },
  variants: {
    variant: {
      outline: {
        root: {
          gap: '1',
          borderRadius: 'l3',
          borderWidth: '1px',
          p: '1'
        }
      }
    }
  }
});
