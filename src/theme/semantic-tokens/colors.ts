import { defineSemanticTokens } from '@pandacss/dev';

export const colors = defineSemanticTokens.colors({
  canvas: { value: '{colors.gray.1}' },
  bg: {
    canvas: { value: '{colors.gray.1}' },
    default: { value: '{colors.gray.2}' },
    subtle: { value: '{colors.gray.3}' },
    muted: { value: '{colors.gray.4}' },
    emphasized: { value: '{colors.gray.5}' },
    disabled: { value: '{colors.gray.3}' }
  },
  fg: {
    default: { value: '{colors.gray.12}' },
    muted: { value: '{colors.gray.11}' },
    subtle: { value: '{colors.gray.10}' },
    emphasized: { value: '{colors.gray.12}' },
    disabled: { value: '{colors.gray.7}' }
  },
  border: {
    default: { value: '{colors.gray.7}' },
    muted: { value: '{colors.gray.6}' },
    subtle: { value: '{colors.gray.4}' },
    emphasized: { value: '{colors.gray.8}' },
    disabled: { value: '{colors.gray.5}' },
    outline: { value: '{colors.gray.a9}' },
    accent: { value: '{colors.ll.9}' }
  },
  accent: {
    1: { value: '{colors.ll.1}' },
    2: { value: '{colors.ll.2}' },
    3: { value: '{colors.ll.3}' },
    4: { value: '{colors.ll.4}' },
    5: { value: '{colors.ll.5}' },
    6: { value: '{colors.ll.6}' },
    7: { value: '{colors.ll.7}' },
    8: { value: '{colors.ll.8}' },
    9: { value: '{colors.ll.9}' },
    10: { value: '{colors.ll.10}' },
    11: { value: '{colors.ll.11}' },
    12: { value: '{colors.ll.12}' },
    a1: { value: '{colors.ll.a1}' },
    a2: { value: '{colors.ll.a2}' },
    a3: { value: '{colors.ll.a3}' },
    a4: { value: '{colors.ll.a4}' },
    a5: { value: '{colors.ll.a5}' },
    a6: { value: '{colors.ll.a6}' },
    a7: { value: '{colors.ll.a7}' },
    a8: { value: '{colors.ll.a8}' },
    a9: { value: '{colors.ll.a9}' },
    a10: { value: '{colors.ll.a10}' },
    a11: { value: '{colors.ll.a11}' },
    a12: { value: '{colors.ll.a12}' },
    default: { value: '{colors.ll.9}' },
    emphasized: { value: '{colors.ll.10}' },
    fg: { value: '{colors.white}' },
    text: { value: '{colors.ll.a11}' }
  },
  error: { value: '{colors.red.9}' },
  success: { value: '{colors.green.9}' },
  warning: { value: '{colors.amber.9}' },
  info: { value: '{colors.blue.9}' }
});
