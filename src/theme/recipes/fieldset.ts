import { fieldsetAnatomy } from '@ark-ui/react/anatomy';
import { defineSlotRecipe } from '@pandacss/dev';

export const fieldset = defineSlotRecipe({
  className: 'fieldset',
  slots: fieldsetAnatomy.extendWith('content', 'control').keys(),
  base: {
    root: {
      display: 'flex',
      gap: { base: '5', md: '8' },
      flexDirection: { base: 'column', md: 'row' },
      justifyContent: 'space-between',
      width: 'full'
    },
    control: {
      display: 'flex',
      gap: '1',
      flexDirection: 'column',
      width: 'full',
      maxW: 'xs'
    },
    content: {
      display: 'flex',
      gap: '4',
      flexDirection: 'column',
      width: 'full',
      maxW: '2xl'
    },
    legend: {
      color: 'fg.default',
      fontWeight: 'semibold'
    },
    helperText: {
      textStyle: 'sm',
      color: 'fg.muted'
    },
    errorText: {
      textStyle: 'sm',
      display: 'inline-flex',
      gap: '2',
      alignItems: 'center',
      color: 'error',
      fontWeight: 'medium'
    }
  }
});
