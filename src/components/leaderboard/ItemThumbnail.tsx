import type { RankingItemDisplay } from './useRankingItems';
import { css } from 'styled-system/css';
import { Box, styled } from 'styled-system/jsx';

const SIZES = {
  '8': css({ w: '8', h: '8' }),
  '12': css({ w: '12', h: '12' }),
  '16': css({ w: '16', h: '16' })
};

export function ItemThumbnail({
  item,
  size
}: {
  item: RankingItemDisplay;
  size: keyof typeof SIZES;
}) {
  return item.image ? (
    <styled.img
      className={SIZES[size]}
      src={item.image}
      alt=""
      loading="lazy"
      flexShrink={0}
      objectFit="cover"
      borderRadius="sm"
    />
  ) : (
    <Box
      className={SIZES[size]}
      style={{ background: item.color ?? 'var(--colors-bg-muted)' }}
      flexShrink={0}
      borderRadius="sm"
    />
  );
}
