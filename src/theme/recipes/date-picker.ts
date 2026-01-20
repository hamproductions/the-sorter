import { datePickerAnatomy } from '@ark-ui/react/anatomy';
import { defineSlotRecipe } from '@pandacss/dev';

export const datePicker = defineSlotRecipe({
  className: 'date-picker',
  slots: datePickerAnatomy.keys(),
  base: {
    root: {
      display: 'flex',
      gap: '1.5',
      flexDirection: 'column'
    },
    content: {
      display: 'flex',
      zIndex: 'dropdown',
      gap: '3',
      flexDirection: 'column',
      borderRadius: 'l3',
      width: '344px',
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
    control: {
      display: 'flex',
      gap: '2',
      flexDirection: 'row'
    },
    label: {
      textStyle: 'sm',
      color: 'fg.default',
      fontWeight: 'medium'
    },
    tableHeader: {
      textStyle: 'sm',
      height: '10',
      color: 'fg.muted',
      fontWeight: 'semibold'
    },
    viewControl: {
      display: 'flex',
      gap: '2',
      justifyContent: 'space-between'
    },
    table: {
      width: 'full',
      m: '-1',
      borderCollapse: 'separate',
      borderSpacing: '1'
    },
    tableCell: {
      textAlign: 'center'
    },
    tableCellTrigger: {
      width: '100%',
      _selected: {
        _before: {
          color: 'colorPalette.contrast'
        }
      },
      _today: {
        _before: {
          position: 'absolute',
          marginTop: '6',
          color: 'colorPalette.solid',
          content: "'−'"
        }
      },
      '&[data-in-range]': {
        background: 'gray.subtle.bg'
      }
    },
    view: {
      display: 'flex',
      gap: '3',
      flexDirection: 'column',
      _hidden: {
        display: 'none'
      }
    }
  }
});
