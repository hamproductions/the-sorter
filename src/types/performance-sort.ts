export interface CollabGroupPerformer {
  kind: 'group';
  id: string;
  name: string;
  englishName?: string;
  color?: string;
}

export interface CollabMemberPerformer {
  kind: 'member';
  characterId: string;
}

export type CollabPerformer = CollabGroupPerformer | CollabMemberPerformer;

export interface SetlistOrderEntry {
  songId: string;
  label: string;
  performanceId?: string;
  performanceName?: string;
  date?: string;
  remarks?: string;
  performers?: CollabPerformer[];
}

export interface PerformanceSortMeta {
  performanceId?: string;
  performanceIds?: string[];
  tourName: string;
  performanceName?: string;
  selectionLabel?: string;
  date?: string;
  venue?: string;
  setlistOrder: SetlistOrderEntry[];
}
