import { useTranslation } from 'react-i18next';
import { Badge, BadgeProps } from '../ui/badge';
import { Character } from '~/types';
import { getSeriesName } from '~/utils/filter';

export function SchoolBadge({ character, ...rest }: { character: Character } & BadgeProps) {
  const { i18n } = useTranslation();
  const { series, seriesColor } = character;
  const lang = i18n.language as 'en';
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
      {getSeriesName(series, lang)}
    </Badge>
  );
}
