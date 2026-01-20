import { defineSlotRecipe } from '@pandacss/dev';

export const breadcrumb = defineSlotRecipe({
  className: 'breadcrumb',
  slots: ['root', 'list', 'link', 'item', 'separator', 'ellipsis'],
  base: {
    list: {
      display: 'flex',
      alignItems: 'center',
      wordBreak: 'break-word',
      listStyle: 'none'
    },
    link: {
      display: 'inline-flex',
      gap: '2',
      alignItems: 'center',
      borderRadius: 'l1',
      focusRing: 'outside',
      outline: '0',
      textDecoration: 'none',
      transition: 'color',
      _icon: { boxSize: '1em' }
    },
    item: {
      display: 'inline-flex',
      alignItems: 'center',
      color: 'fg.muted',
      _last: {
        color: 'fg.default'
      }
    },
    separator: {
      color: 'fg.subtle',
      _rtl: { rotate: '180deg' },
      _icon: { boxSize: '1em' }
    },
    ellipsis: {
      display: 'inline-flex',
      justifyContent: 'center',
      alignItems: 'center',
      color: 'fg.muted',
      _icon: { boxSize: '1em' }
    }
  },

  variants: {
    variant: {
      underline: {
        link: {
          textDecoration: 'underline',
          textDecorationColor: 'fg.subtle',
          textDecorationThickness: '0.1em',
          textUnderlineOffset: '0.125em',
          _hover: { textDecorationColor: 'fg.default' }
        }
      },
      plain: {
        link: {
          color: 'fg.muted',
          _currentPage: { color: 'fg.default' },
          _hover: { color: 'fg.default' }
        }
      }
    },
    size: {
      xs: { list: { textStyle: 'xs', gap: '1' } },
      sm: { list: { textStyle: 'sm', gap: '1' } },
      md: { list: { textStyle: 'md', gap: '1.5' } },
      lg: { list: { textStyle: 'lg', gap: '2' } }
    }
  },

  defaultVariants: {
    variant: 'plain',
    size: 'md'
  }
});
