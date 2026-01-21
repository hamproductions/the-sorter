import { defineTokens } from '@pandacss/dev';

const ll = defineTokens.colors({
  1: { value: '#170e11' },
  2: { value: '#211217' },
  3: { value: '#3c1223' },
  4: { value: '#53082c' },
  5: { value: '#620f36' },
  6: { value: '#731d43' },
  7: { value: '#8e2c56' },
  8: { value: '#b7386f' },
  9: { value: '#e4007f' },
  10: { value: '#d40072' },
  11: { value: '#ff87b8' },
  12: { value: '#ffd0e0' },
  a1: { value: '#ec001207' },
  a2: { value: '#f4206612' },
  a3: { value: '#fb17732f' },
  a4: { value: '#ff007247' },
  a5: { value: '#ff0c7e57' },
  a6: { value: '#ff2f8b69' },
  a7: { value: '#ff459586' },
  a8: { value: '#ff4998b2' },
  a9: { value: '#fe008ce3' },
  a10: { value: '#ff0088d1' },
  a11: { value: '#ff87b8' },
  a12: { value: '#ffd0e0' }
});

export const colors = defineTokens.colors({
  current: { value: 'currentColor' },
  black: {
    DEFAULT: { value: '#000000' },
    a1: { value: 'rgba(0, 0, 0, 0.05)' },
    a2: { value: 'rgba(0, 0, 0, 0.1)' },
    a3: { value: 'rgba(0, 0, 0, 0.15)' },
    a4: { value: 'rgba(0, 0, 0, 0.2)' },
    a5: { value: 'rgba(0, 0, 0, 0.3)' },
    a6: { value: 'rgba(0, 0, 0, 0.4)' },
    a7: { value: 'rgba(0, 0, 0, 0.5)' },
    a8: { value: 'rgba(0, 0, 0, 0.6)' },
    a9: { value: 'rgba(0, 0, 0, 0.7)' },
    a10: { value: 'rgba(0, 0, 0, 0.8)' },
    a11: { value: 'rgba(0, 0, 0, 0.9)' },
    a12: { value: 'rgba(0, 0, 0, 0.95)' }
  },
  white: {
    DEFAULT: { value: '#ffffff' },
    a1: { value: 'rgba(255, 255, 255, 0.05)' },
    a2: { value: 'rgba(255, 255, 255, 0.1)' },
    a3: { value: 'rgba(255, 255, 255, 0.15)' },
    a4: { value: 'rgba(255, 255, 255, 0.2)' },
    a5: { value: 'rgba(255, 255, 255, 0.3)' },
    a6: { value: 'rgba(255, 255, 255, 0.4)' },
    a7: { value: 'rgba(255, 255, 255, 0.5)' },
    a8: { value: 'rgba(255, 255, 255, 0.6)' },
    a9: { value: 'rgba(255, 255, 255, 0.7)' },
    a10: { value: 'rgba(255, 255, 255, 0.8)' },
    a11: { value: 'rgba(255, 255, 255, 0.9)' },
    a12: { value: 'rgba(255, 255, 255, 0.95)' }
  },
  transparent: { value: 'rgb(0 0 0 / 0)' },
  ll
});