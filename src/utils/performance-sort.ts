import type { SetlistOrderEntry } from '~/types/performance-sort';
import type { PerformanceSetlist } from '~/types/setlist-prediction';
import { isSongItem } from '~/types/setlist-prediction';

export function computeSetlistLabels(setlist: PerformanceSetlist): SetlistOrderEntry[] {
  const { items, sections } = setlist;
  const entries: SetlistOrderEntry[] = [];

  const getSectionType = (index: number): string => {
    for (const section of sections) {
      if (index >= section.startIndex && index <= section.endIndex) {
        return section.type ?? 'main';
      }
    }
    return 'main';
  };

  const songCountBySection: Record<string, number> = {};

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!isSongItem(item)) continue;

    const sectionType = getSectionType(i);
    songCountBySection[sectionType] = (songCountBySection[sectionType] ?? 0) + 1;

    let label: string;
    if (sectionType === 'encore') {
      label = `EN${songCountBySection[sectionType].toString().padStart(2, '0')}`;
    } else {
      label = `M${songCountBySection[sectionType].toString().padStart(2, '0')}`;
    }
    entries.push({ songId: item.songId, label });
  }

  return entries;
}
