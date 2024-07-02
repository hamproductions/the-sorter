# LoveLive! Sorter

Sort your favorite seiyuu, characters inspired by charasort and more...

## Features

- Groups/ Units Filter
- Ties
- Undo
- Photo Export
- Save-able
- Share pic / Links
- \*New\* Tier List

### Ideas

- No-Tie mode
  - 
- Timer

## Need Help (If anyone is kind enough...)

- [x] Localized Names
  - [x] Members
  - [x] Seiyuu
  - [x] Schools
  - [x] Units
  - [x] Series
- [ ] School/Unit Icons
  - [ ] LL
  - [ ] LLS
  - [ ] Nijigaku
  - [ ] LLSS
  - [ ] Hasunosora

## Data/ Assets Source

- Data: https://ll-fans.jp/
- Icons: https://idol.st/idols/
- Characters:
  - Muse/Aquours/Niji/Liella: https://lovelive-sif2.bushimo.jp/member/ (Rip SIF2)
  - Musical: https://www.lovelive-anime.jp/special/musical/member.php
  - Hasu: https://www.lovelive-anime.jp/hasunosora/member/
- Seiyuu:
  - Muse: https://love-live.fandom.com/wiki/Main_Page
  - Aqours: https://yohane.net/character/
  - Niji: https://www.lovelive-anime.jp/nijigasaki/about_nijigasaki.php
  - Liella: https://www.lovelive-anime.jp/yuigaoka/member/
  - Musical: https://www.lovelive-anime.jp/special/musical/caststaff.php
  - Hasu: https://www.lovelive-anime.jp/hasunosora/member/
  - Other Cast: Artist Picture/ random pic on Twitter

## The Sorting Algorithm

- The Sorting used Algorithm is based on Merge Sort, adapted to support manually doing the comparisons, support ties and undo-ing.
- Check out `src/utils/sort.ts` and `src/hooks/useSorter.ts` for details of the implementation.
- Technically, just using useSorter alone will suffice for implementing your own sorter.

### Deeper explanation

The sorting algorithm revolves around calling `initSort()` to create initial sort state, to start the sorting process then repeatedly calling `step()` with results of the comparisons ("left"/"right"/"tie") and current state to advance a step until status becomes "end".
Internally `mergeSort()` and `merge()` were used which mimics the actual merge sort algorithm.

The data is stored in 3D array because to support ties. When ties happen, the items in right array will be merged/transferred to the left array (which makes the array empty and skipped in subsequent comparisons). Ties helps reduce manual comparison, and it's safe to flatMap the results (`state.arr`) to get the resulting array

```ts
export interface SortState<I> {
  arr: I[][];
  currentSize: number;
  leftStart: number;
  status?: 'done' | 'waiting' | 'end';
  mergeState?: MergeState<I>;
  ties?: I[][];
}
interface MergeState<I> {
  start: number;
  mid: number;
  end: number;
  leftArr?: I[][];
  rightArr?: I[][];
  leftArrIdx?: number;
  rightArrIdx?: number;
  arrIdx?: number;
}
```
