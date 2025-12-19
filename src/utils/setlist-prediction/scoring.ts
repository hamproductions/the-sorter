/**
 * Scoring system for setlist predictions
 */

import type {
  SetlistPrediction,
  PerformanceSetlist,
  PredictionScore,
  ScoringRules,
  SetlistItem
} from '~/types/setlist-prediction';
import { DEFAULT_SCORING_RULES, isSongItem } from '~/types/setlist-prediction';

// ==================== Main Scoring Function ====================

export function calculateScore(
  prediction: PerformanceSetlist,
  actual: PerformanceSetlist,
  rules: ScoringRules = DEFAULT_SCORING_RULES
): PredictionScore {
  // Match songs between prediction and actual
  const matches = matchSongs(prediction.items, actual.items);

  // Calculate scores for each item
  let totalScore = 0;
  const itemScores: PredictionScore['itemScores'] = matches.map((match) => {
    const points = calculateItemScore(match, rules);
    totalScore += points;
    return {
      itemId: match.predItemId,
      matched: true,
      matchType: match.matchType,
      positionDiff: match.positionDiff,
      points,
      actualItemId: match.actualItemId
    };
  });

  // Add unmatched prediction items (score 0)
  const matchedPredIds = new Set(matches.map((m) => m.predItemId));
  prediction.items.forEach((item) => {
    if (isSongItem(item) && !matchedPredIds.has(item.id)) {
      // Unmatched items don't have a match type or actual item
      itemScores.push({
        itemId: item.id,
        matched: false,
        points: 0
      });
    }
  });

  // Calculate bonuses
  const bonuses = calculateBonuses(prediction, actual, matches, rules);
  const totalBonusPoints = Object.values(bonuses).reduce((sum, v) => sum + (v || 0), 0);
  totalScore += totalBonusPoints;

  // Calculate breakdown
  const breakdown = calculateBreakdown(matches, bonuses, rules);

  // Calculate max possible score
  const maxScore = calculateMaxScore(actual, rules);

  // Calculate accuracy
  const accuracy = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

  return {
    predictionId: '',
    totalScore,
    maxPossibleScore: maxScore,
    accuracy: Math.round(accuracy * 100) / 100,
    breakdown,
    itemScores,
    calculatedAt: new Date().toISOString()
  };
}

// ==================== Song Matching ====================

interface Match {
  predItemId: string;
  actualItemId: string;
  predPos: number;
  actualPos: number;
  positionDiff: number;
  matchType: 'exact' | 'close' | 'present' | 'section';
}

function matchSongs(predItems: SetlistItem[], actualItems: SetlistItem[]): Match[] {
  const matches: Match[] = [];
  const usedActual = new Set<string>();

  // Filter to only song items
  const predSongs = predItems.filter(isSongItem);
  const actualSongs = actualItems.filter(isSongItem);

  // Match by song ID
  for (const predItem of predSongs) {
    const actualItem = actualSongs.find(
      (a) => a.songId === predItem.songId && !usedActual.has(a.id)
    );

    if (actualItem) {
      const positionDiff = Math.abs(predItem.position - actualItem.position);

      let matchType: Match['matchType'] = 'present';
      if (positionDiff === 0) {
        matchType = 'exact';
      } else if (positionDiff <= DEFAULT_SCORING_RULES.closeMatch.range) {
        matchType = 'close';
      }

      matches.push({
        predItemId: predItem.id,
        actualItemId: actualItem.id,
        predPos: predItem.position,
        actualPos: actualItem.position,
        positionDiff,
        matchType
      });

      usedActual.add(actualItem.id);
    }
  }

  return matches;
}

// ==================== Item Scoring ====================

function calculateItemScore(match: Match, rules: ScoringRules): number {
  let basePoints = 0;

  switch (match.matchType) {
    case 'exact':
      basePoints = rules.exactMatch;
      break;
    case 'close':
      basePoints = rules.closeMatch.points;
      break;
    case 'section':
      basePoints = rules.sectionMatch;
      break;
    case 'present':
      basePoints = rules.presentMatch;
      break;
  }

  // Apply section multiplier if configured
  // (Would need section info from match for this)

  return basePoints;
}

// ==================== Bonus Calculation ====================

function calculateBonuses(
  prediction: PerformanceSetlist,
  actual: PerformanceSetlist,
  _matches: Match[],
  rules: ScoringRules
): PredictionScore['breakdown']['bonusPoints'] {
  const bonuses: PredictionScore['breakdown']['bonusPoints'] = {};

  // Opening song bonus
  const predFirstSong = prediction.items.find(isSongItem);
  const actualFirstSong = actual.items.find(isSongItem);

  if (predFirstSong && actualFirstSong && predFirstSong.songId === actualFirstSong.songId) {
    bonuses.openingSong = rules.bonuses.openingSong;
  }

  // Closing song bonus
  const predLastSong = [...prediction.items].toReversed().find(isSongItem);
  const actualLastSong = [...actual.items].toReversed().find(isSongItem);

  if (predLastSong && actualLastSong && predLastSong.songId === actualLastSong.songId) {
    bonuses.closingSong = rules.bonuses.closingSong;
  }

  // Encore break bonus
  const predHasEncore = prediction.sections.some((s) => s.type === 'encore');
  const actualHasEncore = actual.sections.some((s) => s.type === 'encore');

  if (predHasEncore && actualHasEncore) {
    bonuses.encoreBreak = rules.bonuses.encoreBreak;
  }

  return bonuses;
}

// ==================== Breakdown Calculation ====================

function calculateBreakdown(
  matches: Match[],
  bonuses: PredictionScore['breakdown']['bonusPoints'],
  rules: ScoringRules
): PredictionScore['breakdown'] {
  const exactMatches = matches.filter((m) => m.matchType === 'exact').length;
  const closeMatches = matches.filter((m) => m.matchType === 'close').length;
  const presentMatches = matches.filter((m) => m.matchType === 'present').length;

  return {
    exactMatches,
    exactMatchPoints: exactMatches * rules.exactMatch,

    closeMatches,
    closeMatchPoints: closeMatches * rules.closeMatch.points,

    presentMatches,
    presentMatchPoints: presentMatches * rules.presentMatch,

    sectionMatches: 0,
    sectionMatchPoints: 0,

    missedSongs: 0, // Would need to calculate from actual - matches
    extraSongs: 0, // Would need to calculate from prediction - matches

    bonusPoints: bonuses
  };
}

// ==================== Max Score Calculation ====================

function calculateMaxScore(actual: PerformanceSetlist, rules: ScoringRules): number {
  const songCount = actual.items.filter(isSongItem).length;

  // All songs matched exactly
  let maxScore = songCount * rules.exactMatch;

  // Add all possible bonuses
  maxScore += rules.bonuses.openingSong;
  maxScore += rules.bonuses.closingSong;

  // Add encore bonus if applicable
  if (actual.sections.some((s) => s.type === 'encore')) {
    maxScore += rules.bonuses.encoreBreak;
  }

  return maxScore;
}

// ==================== Helper Functions ====================

export function scorePrediction(
  prediction: SetlistPrediction,
  actualSetlist: PerformanceSetlist
): SetlistPrediction {
  const score = calculateScore(prediction.setlist, actualSetlist);

  return {
    ...prediction,
    score: {
      ...score,
      predictionId: prediction.id
    },
    updatedAt: new Date().toISOString()
  };
}

export function getAccuracyLevel(
  accuracy: number
): 'perfect' | 'excellent' | 'good' | 'fair' | 'poor' {
  if (accuracy >= 95) return 'perfect';
  if (accuracy >= 80) return 'excellent';
  if (accuracy >= 65) return 'good';
  if (accuracy >= 50) return 'fair';
  return 'poor';
}

export function formatScore(score: number): string {
  return score.toLocaleString();
}

export function formatAccuracy(accuracy: number): string {
  return `${accuracy.toFixed(1)}%`;
}
