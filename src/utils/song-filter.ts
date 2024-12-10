import type { SongFilterType } from '~/components/sorter/SongFilters';
import type { Song } from '~/types/songs';

export const matchSongFilter = (item: Song, filter: SongFilterType) => {
  if (!filter) return true;
  const { generations, types, units } = filter;
  if (!isValidSongFilter(filter)) return true;
  console.log('MATCHING', item, filter);
  return (
    generations?.includes(`1${item.id.toString().substring(1, 3)}`) ||
    types?.some((type) => {
      if (type === 'original') {
        return item.id.toString().charAt(3) === '1';
      } else if (type === 'covers') {
        return item.id.toString().charAt(3) === '2' || item.id.toString().charAt(3) === '3';
      }
    }) ||
    units?.includes(item.unit)
  );
};

export const isValidSongFilter = (filter?: SongFilterType | null): filter is SongFilterType => {
  if (!filter) return false;
  const { generations, types, units } = filter;
  if (!Array.isArray(generations) || !Array.isArray(types) || !Array.isArray(units)) return false;
  return true;
};
