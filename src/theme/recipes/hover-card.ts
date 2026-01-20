import { hoverCardAnatomy } from '@ark-ui/react/anatomy';
import { defineSlotRecipe } from '@pandacss/dev';

export const hoverCard = defineSlotRecipe({
  className: 'hover-card',
  slots: hoverCardAnatomy.keys(),
  base: {
    content: {
      textStyle: 'sm',
      display: 'flex',
      zIndex: 'popover',
      position: 'relative',
      transformOrigin: 'var(--transform-origin)',
      flexDirection: 'column',
      outline: '0',
      borderRadius: 'l3',
      maxWidth: '80',
      padding: '4',
      bg: 'var(--hovercard-bg)',
      boxShadow: 'lg',
      _open: {
        animationStyle: 'slide-fade-in',
        animationDuration: 'fast'
      },
      _closed: {
        animationStyle: 'slide-fade-out',
        animationDuration: 'faster'
      },
      '--hovercard-bg': 'colors.gray.surface.bg'
    },
    arrow: {
      '--arrow-size': 'sizes.3',
      '--arrow-background': 'var(--hovercard-bg)'
    },
    arrowTip: {
      borderInlineStartWidth: '0.5px',
      borderTopWidth: '0.5px'
    }
  }
});
