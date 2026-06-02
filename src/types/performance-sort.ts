export interface SetlistOrderEntry {
  songId: string;
  label: string;
  performanceId?: string;
  performanceName?: string;
  date?: string;
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
