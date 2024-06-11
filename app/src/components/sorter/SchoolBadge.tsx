import { Character } from '~/types';
import { Badge, BadgeProps } from '../ui/badge';

export const SchoolBadge = ({ character, ...rest }: { character: Character } & BadgeProps) => {
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
};
