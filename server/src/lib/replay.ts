import type { SortChoice } from '~/types/global-ranking';
import { initSort, step } from '~/utils/sort';

const STEPS: Record<SortChoice, 'left' | 'right' | 'tie'> = { L: 'left', R: 'right', T: 'tie' };

export type ReplayResult =
  | { ok: true; ranking: string[][] }
  | { ok: false; reason: 'extra_choices' | 'incomplete' };

export const replaySort = (initialOrder: string[], choices: string): ReplayResult => {
  let state = initSort(initialOrder);
  for (const choice of choices) {
    if (state.status === 'end' || !state.mergeState) return { ok: false, reason: 'extra_choices' };
    state = step(STEPS[choice as SortChoice], state);
  }
  if (state.status !== 'end') return { ok: false, reason: 'incomplete' };
  return { ok: true, ranking: state.arr.filter((group) => group.length > 0) };
};
