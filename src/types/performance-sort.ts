export interface SetlistOrderEntry {
  songId: string;
  label: string; // e.g. "M01", "EN01"
}

export interface PerformanceSortMeta {
  performanceId: string;
  tourName: string;
  performanceName?: string;
  date: string;
  venue?: string;
  setlistOrder: SetlistOrderEntry[]; // full ordered entries (with duplicates) for Performance Order view
}
