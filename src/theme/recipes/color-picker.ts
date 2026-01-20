import { colorPickerAnatomy } from '@ark-ui/react/anatomy';
import { defineSlotRecipe } from '@pandacss/dev';

export const colorPicker = defineSlotRecipe({
  className: 'color-picker',
  slots: colorPickerAnatomy.keys(),
  base: {
    root: {
      display: 'flex',
      gap: '1.5',
      flexDirection: 'column'
    },
    label: {
      textStyle: 'sm',
      color: 'fg.default',
      fontWeight: 'medium'
    },
    control: {
      display: 'flex',
      gap: '2',
      flexDirection: 'row'
    },
    content: {
      display: 'flex',
      zIndex: 'dropdown',
      flexDirection: 'column',
      borderRadius: 'l3',
      maxWidth: 'sm',
      p: '4',
      background: 'gray.surface.bg',
      boxShadow: 'lg',
      _open: {
        animation: 'fadeIn 0.25s ease-out'
      },
      _closed: {
        animation: 'fadeOut 0.2s ease-out'
      },
      _hidden: {
        display: 'none'
      }
    },
    area: {
      borderRadius: 'l2',
      height: '36',
      overflow: 'hidden'
    },
    areaThumb: {
      outline: 'none',
      borderRadius: 'full',
      width: '2.5',
      height: '2.5',
      boxShadow: 'white 0px 0px 0px 2px, black 0px 0px 2px 1px'
    },
    areaBackground: {
      height: 'full'
    },
    channelSlider: {
      borderRadius: 'l2'
    },
    channelSliderTrack: {
      borderRadius: 'l2',
      height: '3'
    },
    swatchGroup: {
      display: 'grid',
      gap: '2',
      gridTemplateColumns: 'repeat(7, 1fr)',
      background: 'gray.surface.bg'
    },
    swatch: {
      borderRadius: 'l2',
      width: '6',
      height: '6',
      boxShadow:
        '0 0 0 1px var(--colors-border-emphasized), 0 0 0 2px var(--colors-bg-default) inset'
    },
    channelSliderThumb: {
      transform: 'translate(-50%, -50%)',
      outline: 'none',
      borderRadius: 'full',
      width: '2.5',
      height: '2.5',
      boxShadow: 'white 0px 0px 0px 2px, black 0px 0px 2px 1px'
    },
    transparencyGrid: {
      borderRadius: 'l2'
    }
  }
});
