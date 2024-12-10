import type { BadgeProps } from '../ui/badge';
import { Badge } from '../ui/badge';
import type { Locale } from '~/i18n';
import type { Character } from '~/types';
import { getSeriesName } from '~/utils/names';

export function SchoolBadge({
  character,
  locale,
  ...rest
}: { character: Character; locale: Locale } & BadgeProps) {
  const { series, seriesColor } = character;

  return (
    <Badge
      style={{ backgroundColor: seriesColor ?? undefined }}
      size="sm"
      h="fit-content"
      minH="5"
      color="colorPalette.fg"
      textAlign="center"
      textWrap="wrap"
      {...rest}
    >
      {getSeriesName(series, locale)}
    </Badge>
  );
}
