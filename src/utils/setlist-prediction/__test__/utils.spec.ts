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
