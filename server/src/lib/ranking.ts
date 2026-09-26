import { sha256 } from './hash';
import type { LeaderboardEntry } from '~/types/global-ranking';

export const PRIOR_WEIGHT = 5;

export interface Contribution {
  itemId: string;
  percentile: number;
  top1: number;
  top3: number;
  top10: number;
}

export interface Rollup {
  itemId: string;
  appearances: number;
  percentileSum: number;
  top1: number;
  top3: number;
  top10: number;
}

export const countItems = (ranking: string[][]) =>
  ranking.reduce((total, group) => total + group.length, 0);

export const computeContributions = (ranking: string[][]): Contribution[] => {
  const n = countItems(ranking);
  const contributions: Contribution[] = [];
  let position = 0;
  for (const group of ranking) {
    const averagePosition = position + (group.length - 1) / 2;
    const percentile = n > 1 ? 1 - averagePosition / (n - 1) : 1;
    for (const itemId of group) {
      contributions.push({
        itemId,
        percentile,
        top1: position === 0 ? 1 : 0,
        top3: position < 3 ? 1 : 0,
        top10: position < 10 ? 1 : 0
      });
    }
    position += group.length;
  }
  return contributions;
};

export const restrictRanking = (ranking: string[][], subset: Set<string>) =>
  ranking.map((group) => group.filter((id) => subset.has(id))).filter((group) => group.length > 0);

export const accumulate = (target: Map<string, Rollup>, contributions: Contribution[]) => {
  for (const c of contributions) {
    const row = target.get(c.itemId) ?? {
      itemId: c.itemId,
      appearances: 0,
      percentileSum: 0,
      top1: 0,
      top3: 0,
      top10: 0
    };
    row.appearances += 1;
    row.percentileSum += c.percentile;
    row.top1 += c.top1;
    row.top3 += c.top3;
    row.top10 += c.top10;
    target.set(c.itemId, row);
  }
  return target;
};

export const mergeRollups = (rows: Rollup[]) => {
  const merged = new Map<string, Rollup>();
  for (const r of rows) {
    const row = merged.get(r.itemId);
    if (!row) {
      merged.set(r.itemId, { ...r });
      continue;
    }
    row.appearances += r.appearances;
    row.percentileSum += r.percentileSum;
    row.top1 += r.top1;
    row.top3 += r.top3;
    row.top10 += r.top10;
  }
  return [...merged.values()];
};

export const withoutRanking = (rows: Rollup[], ranking: string[][]) => {
  const own = new Map(computeContributions(ranking).map((c) => [c.itemId, c]));
  return rows.map((r) => {
    const c = own.get(r.itemId);
    if (!c) return r;
    return {
      ...r,
      appearances: r.appearances - 1,
      percentileSum: r.percentileSum - c.percentile,
      top1: r.top1 - c.top1,
      top3: r.top3 - c.top3,
      top10: r.top10 - c.top10
    };
  });
};

export const scoreOf = (appearances: number, percentileSum: number) =>
  (percentileSum + PRIOR_WEIGHT * 0.5) / (appearances + PRIOR_WEIGHT);

export const toLeaderboard = (rows: Rollup[]): LeaderboardEntry[] => {
  const entries = rows
    .filter((r) => r.appearances > 0)
    .map((r) => ({
      rank: 0,
      itemId: r.itemId,
      score: scoreOf(r.appearances, r.percentileSum),
      meanPercentile: r.percentileSum / r.appearances,
      appearances: r.appearances,
      top1: r.top1,
      top3: r.top3,
      top10: r.top10
    }))
    .sort(
      (a, b) =>
        b.score - a.score || b.appearances - a.appearances || a.itemId.localeCompare(b.itemId)
    );
  entries.forEach((entry, idx) => {
    entry.rank =
      idx > 0 && entry.score === entries[idx - 1].score ? entries[idx - 1].rank : idx + 1;
  });
  return entries;
};

export const rankingHash = (kind: string, mode: string, ranking: string[][]) =>
  sha256(JSON.stringify([kind, mode, ranking.map((group) => [...group].sort())]));

const groupRanks = (groups: string[][], average: boolean) => {
  const ranks = new Map<string, number>();
  let position = 1;
  for (const group of groups) {
    const rank = average ? position + (group.length - 1) / 2 : position;
    for (const id of group) ranks.set(id, rank);
    position += group.length;
  }
  return ranks;
};

export const groupByScore = (entries: LeaderboardEntry[]) => {
  const groups: string[][] = [];
  entries.forEach((entry, idx) => {
    if (idx > 0 && entry.score === entries[idx - 1].score)
      groups[groups.length - 1].push(entry.itemId);
    else groups.push([entry.itemId]);
  });
  return groups;
};

export interface AgreementResult {
  agreement: number | null;
  compared: number;
  items: { itemId: string; yourRank: number; globalRank: number }[];
}

export const computeAgreement = (
  ranking: string[][],
  consensus: LeaderboardEntry[]
): AgreementResult => {
  const known = new Set(consensus.map((e) => e.itemId));
  const mine = restrictRanking(ranking, known);
  const shared = new Set(mine.flat());
  const theirs = groupByScore(consensus.filter((e) => shared.has(e.itemId)));
  const myRanks = groupRanks(mine, true);
  const globalRanks = groupRanks(theirs, true);
  const myPlaces = groupRanks(mine, false);
  const globalPlaces = groupRanks(theirs, false);
  const ids = [...shared];
  const items = ids.map((itemId) => ({
    itemId,
    yourRank: myPlaces.get(itemId) as number,
    globalRank: globalPlaces.get(itemId) as number
  }));
  if (ids.length < 2) return { agreement: null, compared: ids.length, items };

  const mean = (ids.length + 1) / 2;
  let covariance = 0;
  let varianceMine = 0;
  let varianceGlobal = 0;
  for (const itemId of ids) {
    const a = (myRanks.get(itemId) as number) - mean;
    const b = (globalRanks.get(itemId) as number) - mean;
    covariance += a * b;
    varianceMine += a * a;
    varianceGlobal += b * b;
  }
  if (varianceMine === 0 || varianceGlobal === 0) {
    return { agreement: null, compared: ids.length, items };
  }
  const rho = covariance / Math.sqrt(varianceMine * varianceGlobal);
  return { agreement: Math.max(0, Math.min(1, (rho + 1) / 2)), compared: ids.length, items };
};
