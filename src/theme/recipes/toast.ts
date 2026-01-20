import { toastAnatomy } from '@ark-ui/react/anatomy';
import { defineSlotRecipe } from '@pandacss/dev';

export const toast = defineSlotRecipe({
  className: 'toast',
  slots: toastAnatomy.keys(),
  base: {
    root: {
      display: 'flex',
      zIndex: 'var(--z-index)',
      position: 'relative',
      scale: 'var(--scale)',
      translate: 'var(--x) var(--y)',
      gap: '4',
      alignItems: 'start',
      borderRadius: 'l3',
      width: 'full',
      minWidth: 'sm',
      height: 'var(--height)',
      p: '4',
      background: 'gray.surface.bg',
      opacity: 'var(--opacity)',
      boxShadow: 'lg',
      overflowWrap: 'anywhere',
      transitionTimingFunction: 'default',
      transitionDuration: 'slow',
      transitionProperty: 'translate, scale, opacity, height',
      willChange: 'translate, opacity, scale'
    },
    title: {
      textStyle: 'sm',
      color: 'fg.default',
      fontWeight: 'medium'
    },
    description: {
      textStyle: 'sm',
      color: 'fg.muted'
    },
    actionTrigger: {
      textStyle: 'sm',
      cursor: 'pointer',
      color: 'colorPalette.plain.fg',
      fontWeight: 'semibold'
    },
    closeTrigger: {
      position: 'absolute',
      insetEnd: '2',
      top: '2'
    }
  }
});
