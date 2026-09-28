import type {
  AgreementResponse,
  CohortSummary,
  ItemHistoryResponse,
  LeaderboardResponse,
  LeaderboardView,
  RankingFilter,
  RankingKind,
  RankingMode,
  StatsResponse,
  SubmissionPayload,
  SubmissionResponse,
  TicketResponse
} from '~/types/global-ranking';

export const GLOBAL_RANKING_API_URL = (import.meta.env.PUBLIC_ENV__RANKING_API_URL ?? '').replace(
  /\/+$/,
  ''
);

export const isGlobalRankingEnabled = GLOBAL_RANKING_API_URL !== '';

const request = async <T>(path: string, init?: RequestInit): Promise<T | undefined> => {
  if (!isGlobalRankingEnabled) return undefined;
  try {
    const res = await fetch(`${GLOBAL_RANKING_API_URL}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers }
    });
    if (!res.ok) return undefined;
    return (await res.json()) as T;
  } catch {
    return undefined;
  }
};

export const requestTicket = (kind: RankingKind) =>
  request<TicketResponse>('/tickets', { method: 'POST', body: JSON.stringify({ kind }) });

export const submitResult = (payload: SubmissionPayload) =>
  request<SubmissionResponse>('/submissions', { method: 'POST', body: JSON.stringify(payload) });

export const withdrawResult = (id: string, deleteToken: string) =>
  request<{ status: 'deleted' }>(`/submissions/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    body: JSON.stringify({ deleteToken })
  });

export interface LeaderboardQuery {
  kind: RankingKind;
  mode?: RankingMode;
  period: string;
  view: LeaderboardView;
  filter?: RankingFilter | null;
  performanceIds?: string[];
}

const toSearchParams = (query: LeaderboardQuery) => {
  const params = new URLSearchParams({ kind: query.kind, period: query.period, view: query.view });
  if (query.mode) params.set('mode', query.mode);
  if (query.filter) params.set('filter', JSON.stringify(query.filter));
  if (query.performanceIds?.length) params.set('performanceIds', query.performanceIds.join(','));
  return params;
};

export const fetchLeaderboard = (query: LeaderboardQuery) =>
  request<LeaderboardResponse>(`/leaderboard?${toSearchParams(query).toString()}`);

export const fetchItemHistory = (itemId: string, query: LeaderboardQuery) =>
  request<ItemHistoryResponse>(
    `/items/${encodeURIComponent(itemId)}/history?${toSearchParams(query).toString()}`
  );

export const fetchCohorts = (kind: RankingKind, mode?: RankingMode) =>
  request<CohortSummary[]>(
    `/cohorts?${new URLSearchParams(mode ? { kind, mode } : { kind }).toString()}`
  );

export const fetchStats = () => request<StatsResponse>('/stats');

export const fetchAgreement = (
  kind: RankingKind,
  mode: RankingMode,
  ranking: string[][],
  submissionId?: string
) =>
  request<AgreementResponse>('/agreement', {
    method: 'POST',
    body: JSON.stringify({ kind, mode, ranking, submissionId })
  });
