import type { BadgeProps } from '../ui/badge';
import { Badge } from '../ui/badge';
import { useSeriesData } from '~/hooks/useSeriesData';
import type { Locale } from '~/i18n';
import type { Character } from '~/types';
import type { Song } from '~/types/songs';
import { getSeriesName } from '~/utils/names';
import { getSongColor } from '~/utils/song';

export function SchoolBadge({
  character,
  song,
  locale,
  ...rest
}: (
  | { song?: undefined; character: Character; locale: Locale }
  | { character?: undefined; song: Song; locale: Locale }
) &
  BadgeProps) {
  const seriesData = useSeriesData();
  if (character) {
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

  const seriesColor = getSongColor(song);

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
      {song.seriesIds.map((s) =>
        getSeriesName(seriesData.find((d) => `${s}` === d.id)?.name ?? '', locale)
      )}
    </Badge>
  );
}
