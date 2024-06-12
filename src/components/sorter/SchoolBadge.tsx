import { Badge, BadgeProps } from '../ui/badge';
import { Character } from '~/types';

export function SchoolBadge({ character, ...rest }: { character: Character } & BadgeProps) {
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
      {series}
    </Badge>
  );
}
