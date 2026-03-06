export interface PerformanceSortMeta {
  performanceId: string;
  tourName: string;
  performanceName?: string;
  date: string;
  venue?: string;
  setlistOrder: string[]; // full ordered songIds (with duplicates) for Performance Order view
}
