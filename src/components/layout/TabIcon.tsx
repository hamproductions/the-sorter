import { RESULT_VIEW_ICONS, SORTER_TYPE_ICONS } from './section-icons';
import type { SorterType } from '~/types/save-state';

export function TabIcon({ id }: { id: string }) {
  const Icon = RESULT_VIEW_ICONS[id];
  return Icon ? <Icon /> : null;
}

export function SorterTypeIcon({ type }: { type: SorterType }) {
  const Icon = SORTER_TYPE_ICONS[type];
  return <Icon />;
}
