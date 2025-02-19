import type { HasuSongFilterType } from '~/components/sorter/HasuSongFilters';
import type { HasuSong } from '~/types/songs';

export const matchSongFilter = (item: HasuSong, filter: HasuSongFilterType) => {
  if (!filter) return true;
  const { generations, types, units } = filter;
  if (!isValidSongFilter(filter)) return true;
  let isValid = true;
  if (generations && generations.length > 0) {
    isValid = isValid && generations.includes(`1${item.id.toString().substring(1, 3)}`);
  }
  if (types && types.length > 0) {
    isValid =
      isValid &&
      types.some((type) => {
        if (type === 'original') {
          return (
            item.id.toString().charAt(3) === '1' &&
            !item.title.includes('（104期Ver.）') &&
            !item.title.includes('人Ver.)') &&
            !item.title.includes('(ReC Ver.)')
          );
        } else if (type === 'covers') {
          return item.id.toString().charAt(3) === '2' || item.id.toString().charAt(3) === '3';
        } else if (type === '104ver') {
          return item.title.includes('（104期Ver.）');
        } else if (type === 'nver') {
          return item.title.includes('人Ver.)') || item.title.includes('(ReC Ver.)');
        }
      });
  }
  if (units && units.length > 0) {
    isValid = isValid && units?.includes(item.unit);
  }

  return isValid;
};

export const isValidSongFilter = (
  filter?: HasuSongFilterType | null
): filter is HasuSongFilterType => {
  if (!filter) return false;
  const { generations, types, units } = filter;
  if (!Array.isArray(generations) || !Array.isArray(types) || !Array.isArray(units)) return false;
  return true;
};
