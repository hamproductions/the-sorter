import { Stack, type StackProps } from 'styled-system/jsx';
import { css } from 'styled-system/css';
import { forwardRef } from 'react';

const rainbowTextStyle = css({
  color: 'transparent',
  fontSize: 'lg',
  fontWeight: 'bold',
  textAlign: 'center',
  WebkitTextFillColor: 'transparent',
  background:
    'linear-gradient(90deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3, #ff0000)',
  backgroundClip: 'text',
  backgroundSize: '200% 100%',
  animation: 'rainbowScroll 0.6s linear infinite'
});

export const TieToastContent = forwardRef<HTMLDivElement, StackProps>((props, ref) => (
  <Stack ref={ref} justifyContent="flex-end" w="full" minH="100px" {...props}>
    <span className={rainbowTextStyle}>ヒトリダケナンテエラベナイヨー</span>
  </Stack>
));
