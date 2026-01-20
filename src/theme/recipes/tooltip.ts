import { tooltipAnatomy } from '@ark-ui/react/anatomy';
import { defineSlotRecipe } from '@pandacss/dev';

export const tooltip = defineSlotRecipe({
  className: 'tooltip',
  slots: tooltipAnatomy.keys(),
  base: {
    content: {
      textStyle: 'xs',
      borderRadius: 'l2',
      maxWidth: 'xs',
      py: '1.5',
      px: '2',
      color: 'gray.solid.fg',
      fontWeight: 'semibold',
      bg: 'var(--tooltip-bg)',
      boxShadow: 'sm',
      _open: {
        animationStyle: 'scale-fade-in',
        animationDuration: 'fast'
      },
      _closed: {
        animationStyle: 'scale-fade-out',
        animationDuration: 'faster'
      },
      '--tooltip-bg': 'colors.gray.solid.bg'
    },
    arrow: {
      '--arrow-size': 'sizes.2',
      '--arrow-background': 'var(--tooltip-bg)'
    },
    arrowTip: {
      borderColor: 'var(--tooltip-bg)',
      borderInlineStartWidth: '1px',
      borderTopWidth: '1px'
    }
  }
});
