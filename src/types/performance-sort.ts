export interface PerformanceGroup {
  kind: 'group';
  id: string;
  name: string;
}

export interface PerformanceMember {
  kind: 'member';
  characterId: string;
}

export type PerformancePerformer = PerformanceGroup | PerformanceMember;

export interface SetlistOrderEntry {
  songId: string;
  label: string;
  customSongName?: string;
  performanceId?: string;
  performanceName?: string;
  tourName?: string;
  venue?: string;
  date?: string;
  remarks?: string;
  performers?: PerformancePerformer[];
}

export interface PerformanceSortMeta {
  contextVersion?: 1;
  performanceId?: string;
  performanceIds?: string[];
  tourName: string;
  performanceName?: string;
  selectionLabel?: string;
  date?: string;
  venue?: string;
  setlistOrder: SetlistOrderEntry[];
}
