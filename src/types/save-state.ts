import type { SortLog } from './global-ranking';
import type { SortState } from '~/utils/sort';

export type SorterType = 'characters' | 'songs' | 'hasu-songs';

type SortItemId = string | number;

export interface SavedSortState {
  id: string;
  name: string;
  date: string;
  sorterType: SorterType;
  state: SortState<SortItemId>;
  history: SortState<SortItemId>[];
  comparisonsCount: number;
  isCompleted: boolean;
  itemCount: number;
  progress: number;
  filterSummary?: string;
  log?: SortLog;
  isSeiyuu?: boolean;
}
