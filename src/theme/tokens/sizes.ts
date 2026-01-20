import { defineTokens } from '@pandacss/dev';
import { spacing } from './spacing';

export const sizes = defineTokens.sizes({
  ...spacing,
  xs: { value: '20rem' },
  sm: { value: '24rem' },
  md: { value: '28rem' },
  lg: { value: '32rem' },
  xl: { value: '36rem' },
  '2xl': { value: '42rem' },
  '3xl': { value: '48rem' },
  '4xl': { value: '56rem' },
  '5xl': { value: '64rem' },
  '6xl': { value: '72rem' },
  '7xl': { value: '80rem' }
});
