import { popoverAnatomy } from '@ark-ui/react/anatomy';
import { defineSlotRecipe } from '@pandacss/dev';

export const popover = defineSlotRecipe({
  className: 'popover',
  slots: popoverAnatomy.extendWith('header', 'body', 'footer').keys(),
  base: {
    content: {
      textStyle: 'sm',
      display: 'flex',
      zIndex: 'calc(var(--z-index-popover) + var(--layer-index, 0))',
      position: 'relative',
      transformOrigin: 'var(--transform-origin)',
      flexDirection: 'column',
      outline: '0',
      borderRadius: 'l3',
      width: 'xs',
      maxHeight: 'var(--available-height)',
      background: 'var(--popover-bg)',
      boxShadow: 'lg',
      _open: {
        animationStyle: 'scale-fade-in',
        animationDuration: 'fast'
      },
      _closed: {
        animationStyle: 'scale-fade-out',
        animationDuration: 'faster'
      },
      '--popover-bg': 'colors.gray.surface.bg',
      '--popover-padding': 'spacing.4'
    },
    title: {
      textStyle: 'md',
      color: 'fg.default',
      fontWeight: 'medium'
    },
    description: {
      textStyle: 'sm',
      color: 'fg.muted'
    },
    closeTrigger: {
      position: 'absolute',
      top: '1',
      right: '1'
    },
    header: {
      display: 'flex',
      flexDirection: 'column',
      px: 'var(--popover-padding)',
      pt: 'var(--popover-padding)'
    },
    body: { display: 'flex', flex: '1', flexDirection: 'column', p: 'var(--popover-padding)' },
    footer: {
      display: 'flex',
      gap: '3',
      justifyContent: 'flex-end',
      alignItems: 'center',
      paddingInline: 'var(--popover-padding)',
      paddingBottom: 'var(--popover-padding)'
    },
    arrow: {
      '--arrow-size': 'sizes.3',
      '--arrow-background': 'var(--popover-bg)'
    },
    arrowTip: {
      borderInlineStartWidth: '0.5px',
      borderTopWidth: '0.5px'
    }
  }
});
