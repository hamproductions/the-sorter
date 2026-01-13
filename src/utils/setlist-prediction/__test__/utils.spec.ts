import { describe, expect, it } from 'vitest';
import { calculateScore, getAccuracyLevel, formatScore, formatAccuracy } from '../scoring';
import { validatePrediction, validateSetlist, validateSetlistItem } from '../validation';
import { generateId, generatePredictionId, generateSetlistId, generateItemId } from '../id';
import { DEFAULT_SCORING_RULES } from '~/types/setlist-prediction';
import type {
  PerformanceSetlist,
  SetlistPrediction,
  SetlistItem
} from '~/types/setlist-prediction';

describe('Setlist Prediction Utils', () => {
  describe('Scoring', () => {
    const mockSetlist: PerformanceSetlist = {
      id: 'setlist-1',
      performanceId: 'perf-1',
      items: [
        { id: '1', position: 0, songId: 'song-1', type: 'song' },
        { id: '2', position: 1, songId: 'song-2', type: 'song' },
        { id: '3', position: 2, songId: 'song-3', type: 'song' }
      ],
      sections: []
    };

    it('calculates perfect score for exact match', () => {
      const score = calculateScore(mockSetlist, mockSetlist);
      expect(score.accuracy).toBe(100);
      expect(score.totalScore).toBe(score.maxPossibleScore);
      expect(score.breakdown.exactMatches).toBe(3);
    });

    it('calculates 0 score for no match', () => {
      const prediction: PerformanceSetlist = {
        ...mockSetlist,
        items: [
          { id: '4', position: 0, songId: 'song-4', type: 'song' },
          { id: '5', position: 1, songId: 'song-5', type: 'song' },
          { id: '6', position: 2, songId: 'song-6', type: 'song' }
        ]
      };
      const score = calculateScore(prediction, mockSetlist);
      expect(score.accuracy).toBe(0);
      expect(score.totalScore).toBe(0);
    });

    it('calculates partial score for close match', () => {
      const prediction: PerformanceSetlist = {
        ...mockSetlist,
        items: [
          { id: '1', position: 1, songId: 'song-1', type: 'song' }, // Position off by 1
          { id: '2', position: 0, songId: 'song-2', type: 'song' }, // Position off by 1
          { id: '3', position: 2, songId: 'song-3', type: 'song' } // Exact
        ]
      };
      const score = calculateScore(prediction, mockSetlist);
      expect(score.breakdown.exactMatches).toBe(1);
      expect(score.breakdown.closeMatches).toBe(2);
      expect(score.totalScore).toBeGreaterThan(0);
      expect(score.totalScore).toBeLessThan(score.maxPossibleScore);
    });

    it('calculates bonuses correctly', () => {
      const prediction: PerformanceSetlist = {
        ...mockSetlist,
        sections: [{ name: 'Encore', type: 'encore', startIndex: 2, endIndex: 2 }]
      };
      const actual: PerformanceSetlist = {
        ...mockSetlist,
        sections: [{ name: 'Encore', type: 'encore', startIndex: 2, endIndex: 2 }]
      };

      const score = calculateScore(prediction, actual);
      // Opening song bonus + Closing song bonus + Encore bonus + Exact matches
      const expectedScore =
        3 * DEFAULT_SCORING_RULES.exactMatch +
        DEFAULT_SCORING_RULES.bonuses.openingSong +
        DEFAULT_SCORING_RULES.bonuses.closingSong +
        DEFAULT_SCORING_RULES.bonuses.encoreBreak;

      expect(score.totalScore).toBe(expectedScore);
      expect(score.breakdown.bonusPoints.openingSong).toBeDefined();
      expect(score.breakdown.bonusPoints.closingSong).toBeDefined();
      expect(score.breakdown.bonusPoints.encoreBreak).toBeDefined();
    });

    it('formats score and accuracy correctly', () => {
      expect(formatScore(1234)).toBe('1,234');
      expect(formatAccuracy(95.123)).toBe('95.1%');
    });

    it('determines accuracy level correctly', () => {
      expect(getAccuracyLevel(96)).toBe('perfect');
      expect(getAccuracyLevel(85)).toBe('excellent');
      expect(getAccuracyLevel(70)).toBe('good');
      expect(getAccuracyLevel(55)).toBe('fair');
      expect(getAccuracyLevel(40)).toBe('poor');
    });

    it('handles duplicate songs with exact and close matches', () => {
      // Scenario: Same song appears multiple times in both setlists
      // Actual: positions 0, 3, 6, 9 (4 occurrences)
      // Prediction: positions 0, 2, 4, 5, 6, 8 (6 occurrences)
      //
      // Expected matching (algorithm prioritizes exact matches first):
      // Pass 1 (exact): pred pos 0 → actual pos 0, pred pos 6 → actual pos 6
      // Pass 2 (close): pred pos 2 → actual pos 3 (diff=1), pred pos 8 → actual pos 9 (diff=1)
      // Pass 3 (present): none (no actuals left)
      // Unmatched: pred pos 4, pred pos 5

      const actual: PerformanceSetlist = {
        id: 'actual-1',
        performanceId: 'perf-1',
        items: [
          { id: 'a1', position: 0, songId: 'song-repeat', type: 'song' },
          { id: 'a2', position: 1, songId: 'song-filler-1', type: 'song' },
          { id: 'a3', position: 2, songId: 'song-filler-2', type: 'song' },
          { id: 'a4', position: 3, songId: 'song-repeat', type: 'song' },
          { id: 'a5', position: 4, songId: 'song-filler-3', type: 'song' },
          { id: 'a6', position: 5, songId: 'song-filler-4', type: 'song' },
          { id: 'a7', position: 6, songId: 'song-repeat', type: 'song' },
          { id: 'a8', position: 7, songId: 'song-filler-5', type: 'song' },
          { id: 'a9', position: 8, songId: 'song-filler-6', type: 'song' },
          { id: 'a10', position: 9, songId: 'song-repeat', type: 'song' }
        ],
        sections: []
      };

      const prediction: PerformanceSetlist = {
        id: 'pred-1',
        performanceId: 'perf-1',
        items: [
          { id: 'p1', position: 0, songId: 'song-repeat', type: 'song' },
          { id: 'p2', position: 1, songId: 'song-other-1', type: 'song' },
          { id: 'p3', position: 2, songId: 'song-repeat', type: 'song' },
          { id: 'p4', position: 3, songId: 'song-other-2', type: 'song' },
          { id: 'p5', position: 4, songId: 'song-repeat', type: 'song' },
          { id: 'p6', position: 5, songId: 'song-repeat', type: 'song' },
          { id: 'p7', position: 6, songId: 'song-repeat', type: 'song' },
          { id: 'p8', position: 7, songId: 'song-other-3', type: 'song' },
          { id: 'p9', position: 8, songId: 'song-repeat', type: 'song' }
        ],
        sections: []
      };

      const score = calculateScore(prediction, actual);

      // Verify match counts (with prioritized exact matching)
      expect(score.breakdown.exactMatches).toBe(2); // Positions 0→0 and 6→6
      expect(score.breakdown.closeMatches).toBe(2); // Positions 2→3 and 8→9
      expect(score.breakdown.presentMatches).toBe(0); // No actuals left for present matches

      // Verify points calculation
      // 2 exact (15*2=30) + 2 close (8*2=16) + opening bonus (5) + closing bonus (5) = 56
      const expectedPoints =
        2 * DEFAULT_SCORING_RULES.exactMatch +
        2 * DEFAULT_SCORING_RULES.closeMatch.points +
        DEFAULT_SCORING_RULES.bonuses.openingSong +
        DEFAULT_SCORING_RULES.bonuses.closingSong;
      expect(score.totalScore).toBe(expectedPoints);

      // Verify individual item match types for color coding
      const p1Score = score.itemScores.find((s) => s.itemId === 'p1');
      const p3Score = score.itemScores.find((s) => s.itemId === 'p3');
      const p5Score = score.itemScores.find((s) => s.itemId === 'p5');
      const p6Score = score.itemScores.find((s) => s.itemId === 'p6');
      const p7Score = score.itemScores.find((s) => s.itemId === 'p7');
      const p9Score = score.itemScores.find((s) => s.itemId === 'p9');

      // Exact match at position 0 (green)
      expect(p1Score?.matched).toBe(true);
      expect(p1Score && 'matchType' in p1Score ? p1Score.matchType : undefined).toBe('exact');
      expect(p1Score && 'positionDiff' in p1Score ? p1Score.positionDiff : undefined).toBe(0);
      expect(p1Score && 'actualItemId' in p1Score ? p1Score.actualItemId : undefined).toBe('a1');

      // Close match at position 2→3 (yellow)
      expect(p3Score?.matched).toBe(true);
      expect(p3Score && 'matchType' in p3Score ? p3Score.matchType : undefined).toBe('close');
      expect(p3Score && 'positionDiff' in p3Score ? p3Score.positionDiff : undefined).toBe(1);
      expect(p3Score && 'actualItemId' in p3Score ? p3Score.actualItemId : undefined).toBe('a4');

      // Exact match at position 6 (green) - prioritized over earlier predictions
      expect(p7Score?.matched).toBe(true);
      expect(p7Score && 'matchType' in p7Score ? p7Score.matchType : undefined).toBe('exact');
      expect(p7Score && 'positionDiff' in p7Score ? p7Score.positionDiff : undefined).toBe(0);
      expect(p7Score && 'actualItemId' in p7Score ? p7Score.actualItemId : undefined).toBe('a7');

      // Close match at position 8→9 (yellow)
      expect(p9Score?.matched).toBe(true);
      expect(p9Score && 'matchType' in p9Score ? p9Score.matchType : undefined).toBe('close');
      expect(p9Score && 'positionDiff' in p9Score ? p9Score.positionDiff : undefined).toBe(1);
      expect(p9Score && 'actualItemId' in p9Score ? p9Score.actualItemId : undefined).toBe('a10');

      // Unmatched predictions (no more actuals available after exact/close passes)
      expect(p5Score?.matched).toBe(false); // Position 4
      expect(p6Score?.matched).toBe(false); // Position 5

      // Verify unmatched "other" songs
      const p2Score = score.itemScores.find((s) => s.itemId === 'p2');
      const p4Score = score.itemScores.find((s) => s.itemId === 'p4');
      expect(p2Score?.matched).toBe(false);
      expect(p4Score?.matched).toBe(false);
    });
  });

  describe('Validation', () => {
    it('validates a valid prediction', () => {
      const prediction: SetlistPrediction = {
        id: 'pred-1',
        performanceId: 'perf-1',
        name: 'My Prediction',
        setlist: {
          id: 'setlist-1',
          performanceId: 'perf-1',
          items: [{ id: '1', position: 0, songId: 'song-1', type: 'song' }],
          sections: []
        },
        createdAt: '',
        updatedAt: '',
        userId: 'user-1'
      };
      const result = validatePrediction(prediction);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('validates missing required fields', () => {
      const prediction = {} as SetlistPrediction;
      const result = validatePrediction(prediction);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Prediction ID is required');
      expect(result.errors).toContain('Performance ID is required');
      expect(result.errors).toContain('Prediction name is required');
      expect(result.errors).toContain('Setlist is required');
    });

    it('validates setlist structure', () => {
      const setlist: PerformanceSetlist = {
        id: 's1',
        performanceId: 'p1',
        items: [],
        sections: []
      };
      const result = validateSetlist(setlist);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Setlist must have at least one item');
    });

    it('validates setlist item gaps', () => {
      const setlist: PerformanceSetlist = {
        id: 's1',
        performanceId: 'p1',
        items: [
          { id: '1', position: 0, songId: 's1', type: 'song' },
          { id: '2', position: 2, songId: 's2', type: 'song' } // Gap
        ],
        sections: []
      };
      const result = validateSetlist(setlist);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Setlist items have gaps in positions');
      // Let's check implementation: if (hasGaps) errors.push(...)
      // So it should be invalid.
      // Wait, validateSetlist returns valid: errors.length === 0.
      // So it should be false.
      // Re-checking implementation: yes, hasGaps adds error.
    });

    it('validates setlist item', () => {
      const item: SetlistItem = { id: '1', position: -1, type: 'song', songId: '' };
      const result = validateSetlistItem(item);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Position must be non-negative');
      expect(result.errors).toContain('Song item must have songId');
    });
  });

  describe('ID Generation', () => {
    it('generates unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
      expect(id1).toContain('-');
    });

    it('generates prediction IDs with prefix', () => {
      const id = generatePredictionId('perf-1');
      expect(id).toMatch(/^pred-perf-1-/);
    });

    it('generates setlist IDs with prefix', () => {
      const id = generateSetlistId('perf-1');
      expect(id).toMatch(/^setlist-perf-1-/);
    });

    it('generates item IDs with prefix', () => {
      const id = generateItemId();
      expect(id).toMatch(/^item-/);
    });
  });
});
