export const GLOBAL_RANKING_PROTOCOL = 1;
export const GLOBAL_RANKING_MIN_ITEMS = 5;
export const GLOBAL_RANKING_MAX_ITEMS = 2000;
export const TICKET_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export const RANKING_KINDS = ['character', 'song'] as const;
export type RankingKind = (typeof RANKING_KINDS)[number];

export const RANKING_MODES = {
  character: ['chara', 'seiyuu'],
  song: ['normal', 'heardle', 'performance']
} as const satisfies Record<RankingKind, readonly string[]>;
export type RankingMode = (typeof RANKING_MODES)[RankingKind][number];

export type SortChoice = 'L' | 'R' | 'T';

export type RankingFilter = Record<string, (string | number)[] | undefined>;

export interface SortSessionContext {
  kind: RankingKind;
  mode: RankingMode;
  filter: RankingFilter | null;
  performanceIds?: string[];
}

export interface SortLog {
  sessionId: string;
  initialOrder: (string | number)[];
  choices: string;
  context?: SortSessionContext;
  ticket?: { id: string; expiresAt: string };
  ticketRequested?: boolean;
  submission?: { id: string; deleteToken: string };
  submissionFailed?: boolean;
}

export interface TicketResponse {
  ticket: string;
  expiresAt: string;
}

export interface SubmissionPayload extends SortSessionContext {
  protocol: typeof GLOBAL_RANKING_PROTOCOL;
  ticket: string;
  initialOrder: string[];
  choices: string;
}

export type SubmissionResponse =
  | { status: 'accepted' | 'pending_review'; id: string; deleteToken: string }
  | { status: 'duplicate' };

export type LeaderboardView = 'global' | 'cohort' | 'subset';

export interface LeaderboardEntry {
  rank: number;
  itemId: string;
  score: number;
  meanPercentile: number;
  appearances: number;
  top1: number;
  top3: number;
  top10: number;
}

export interface LeaderboardResponse {
  kind: RankingKind;
  mode: RankingMode | null;
  period: string;
  view: LeaderboardView;
  submissions: number;
  items: LeaderboardEntry[];
}

export interface ItemHistoryPoint {
  month: string;
  rank: number;
  of: number;
  score: number;
  appearances: number;
}

export interface ItemHistoryResponse {
  itemId: string;
  points: ItemHistoryPoint[];
}

export interface AgreementResponse {
  agreement: number | null;
  percentile: number | null;
  sampleSize: number;
  compared: number;
  items: { itemId: string; yourRank: number; globalRank: number }[];
}

export interface CohortSummary {
  hash: string;
  kind: RankingKind;
  mode: RankingMode;
  filter: RankingFilter;
  performanceIds: string[];
  submissions: number;
}

export interface StatsResponse {
  totals: { kind: RankingKind; mode: RankingMode; submissions: number }[];
  months: { month: string; kind: RankingKind; mode: RankingMode; submissions: number }[];
  pendingReview: number;
}

export interface ReviewItem {
  id: string;
  kind: RankingKind;
  mode: RankingMode;
  filter: RankingFilter;
  ranking: string[][];
  reason: string;
  createdAt: string;
}
