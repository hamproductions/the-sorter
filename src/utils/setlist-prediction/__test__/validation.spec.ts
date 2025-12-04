import { describe, expect, it } from 'vitest';
import { validatePrediction, validateSetlistItem } from '../validation';
import type { SetlistPrediction } from '~/types/setlist-prediction';

describe('validation utilities', () => {
  const validPrediction: SetlistPrediction = {
    id: 'pred-1',
    performanceId: 'perf-1',
    name: 'Test Prediction',
    setlist: {
      id: 'setlist-1',
      performanceId: 'perf-1',
      items: [{ id: 'item-1', type: 'song', songId: 'song-1', position: 0 }],
      sections: [],
      totalSongs: 1
    },
    createdAt: '2023-01-01',
    updatedAt: '2023-01-01'
  };

  describe('validatePrediction', () => {
    it('validates correct prediction', () => {
      const result = validatePrediction(validPrediction);
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('detects missing id', () => {
      const invalid = { ...validPrediction, id: '' };
      const result = validatePrediction(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('ID'))).toBe(true);
    });

    it('detects missing setlist', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const invalid = { ...validPrediction, setlist: undefined as any };
      const result = validatePrediction(invalid);
      expect(result.valid).toBe(false);
    });

    it('detects invalid items', () => {
      const invalid = {
        ...validPrediction,
        setlist: {
          ...validPrediction.setlist,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          items: [{ id: 'item-1', type: 'invalid' } as any]
        }
      };
      const result = validatePrediction(invalid);
      expect(result.valid).toBe(false);
    });
  });

  describe('validateSetlistItem', () => {
    it('validates song item', () => {
      const item = { id: 'item-1', type: 'song' as const, songId: 'song-1', position: 0 };
      const result = validateSetlistItem(item);
      expect(result.valid).toBe(true);
    });

    it('validates MC item', () => {
      const item = { id: 'item-1', type: 'mc' as const, title: 'MC', position: 0 };
      const result = validateSetlistItem(item);
      expect(result.valid).toBe(true);
    });

    it('validates other item', () => {
      const item = { id: 'item-1', type: 'other' as const, title: 'Break', position: 0 };
      const result = validateSetlistItem(item);
      expect(result.valid).toBe(true);
    });

    it('detects missing id', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const item = { type: 'song', songId: 'song-1', position: 0 } as any;
      const result = validateSetlistItem(item);
      expect(result.valid).toBe(false);
    });

    it('detects missing songId for song items', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const item = { id: 'item-1', type: 'song', position: 0 } as any;
      const result = validateSetlistItem(item);
      expect(result.valid).toBe(false);
    });

    it('detects missing title for non-song items', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const item = { id: 'item-1', type: 'mc', position: 0 } as any;
      const result = validateSetlistItem(item);
      expect(result.valid).toBe(false);
    });
  });
});
