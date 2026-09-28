import type { IconType } from 'react-icons';
import {
  FaBarsStaggered,
  FaListOl,
  FaList,
  FaMusic,
  FaRankingStar,
  FaSpa,
  FaTable,
  FaTableCells,
  FaUsers
} from 'react-icons/fa6';
import type { SorterType } from '~/types/save-state';

export const CharactersIcon = FaUsers;
export const SongsIcon = FaMusic;
export const HasuSongsIcon = FaSpa;
export const SetlistPredictionIcon = FaListOl;
export const LeaderboardIcon = FaRankingStar;

export const SORTER_TYPE_ICONS: Record<SorterType, IconType> = {
  characters: CharactersIcon,
  songs: SongsIcon,
  'hasu-songs': HasuSongsIcon
};

export const RESULT_VIEW_ICONS: Record<string, IconType> = {
  default: FaList,
  table: FaTable,
  grid: FaTableCells,
  tier: FaBarsStaggered,
  'performance-order': FaListOl
};
