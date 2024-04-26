import { Character } from '~/types';
import { Badge } from '../ui/badge';

export const SchoolBadge = ({ character }: { character: Character }) => {
  const { series, seriesColor } = character;
  return (
    <Badge style={{ backgroundColor: seriesColor ?? undefined }} size="sm" color="colorPalette.fg">
      {series}
    </Badge>
  );
};
