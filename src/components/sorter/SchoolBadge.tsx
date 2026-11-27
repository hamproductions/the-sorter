import type { BadgeProps } from '../ui/badge';
import { Badge } from '../ui/badge';
import { useSeriesData } from '~/hooks/useSeriesData';
import type { Locale } from '~/i18n';
import type { Character } from '~/types';
import type { Song } from '~/types/songs';
import { getSeriesName } from '~/utils/names';
import { getSongColor } from '~/utils/song';
import { useAbbreviations } from '~/hooks/useAbbreviations';

export function SchoolBadge({
  character,
  song,
  locale,
  abbreviate,
  ...rest
}: (
  | { song?: undefined; character: Character; locale: Locale }
  | { character?: undefined; song: Song; locale: Locale }
) &
  BadgeProps & { abbreviate?: boolean }) {
  const seriesData = useSeriesData();
  const { short } = useAbbreviations();
  const seriesName = (name: string) =>
    (abbreviate && short.name(name)) || getSeriesName(name, locale);
  if (character) {
    const { series, seriesColor } = character;

    return (
      <Badge
        style={{ backgroundColor: seriesColor ?? undefined }}
        size="sm"
        h="fit-content"
        minH="5"
        color="colorPalette.fg"
        textWrap="wrap"
        textAlign="center"
        {...rest}
      >
        {seriesName(series)}
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
      textWrap="wrap"
      textAlign="center"
      {...rest}
    >
      {song.seriesIds
        .map((s) => seriesName(seriesData.find((d) => `${s}` === d.id)?.name ?? ''))
        .join(', ')}
    </Badge>
  );
}
