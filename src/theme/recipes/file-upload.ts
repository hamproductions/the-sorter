import { fileUploadAnatomy } from '@ark-ui/react/anatomy';
import { defineSlotRecipe } from '@pandacss/dev';

export const fileUpload = defineSlotRecipe({
  className: 'file-upload',
  slots: fileUploadAnatomy.keys(),
  base: {
    root: {
      display: 'flex',
      gap: '1.5',
      flexDirection: 'column',
      alignItems: 'flex-start',
      width: 'full'
    },
    label: {
      textStyle: 'label'
    },
    dropzone: {
      display: 'flex',
      flexDirection: 'column',

      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 'l3',
      borderWidth: '2px',
      width: 'full',
      background: 'gray.surface.bg',
      transition: 'backgrounds',
      borderStyle: 'dashed',
      focusVisibleRing: 'outside',
      _dragging: {
        borderColor: 'colorPalette.solid.bg',
        background: 'gray.surface.bg.hover',
        borderStyle: 'solid'
      }
    },
    item: {
      alignItems: 'start',
      animationDuration: 'normal',
      animationName: 'fade-in',
      display: 'flex',
      pos: 'relative',
      borderRadius: 'l3',
      borderWidth: '1px',
      width: 'full',
      background: 'gray.surface.bg'
    },
    itemGroup: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'start',
      width: 'full'
    },
    itemName: {
      color: 'fg.default',
      fontWeight: 'medium'
    },
    itemSizeText: {
      color: 'fg.muted'
    },
    itemDeleteTrigger: {
      color: 'fg.subtle'
    },
    itemPreviewImage: {
      aspectRatio: '1',
      objectFit: 'cover',
      borderRadius: 'l2',
      maxW: '20'
    }
  },
  variants: {
    size: {
      md: {
        root: { gap: '4' },
        dropzone: { gap: '0', minHeight: 'xs', py: '4', px: '6' },
        item: { textStyle: 'sm', gap: '3', p: '4' },
        itemGroup: { gap: '3' },
        itemDeleteTrigger: { _icon: { boxSize: '4' } }
      }
    }
  },
  defaultVariants: {
    size: 'md'
  }
});
