import { describe, expect, it } from 'vitest';
import {
  importFromJSON,
  importFromFile,
  importFromCSV,
  parseActualSetlist,
  toActualSetlistItems
} from '../import';

describe('import utilities', () => {
  describe('importFromJSON', () => {
    it('imports valid JSON', () => {
      const json = JSON.stringify({
        id: 'pred-1',
        performanceId: 'perf-1',
        name: 'Test',
        setlist: {
          items: [{ id: 'item-1', position: 0, type: 'song', songId: 'song-1' }],
          totalSongs: 1
        }
      });

      const result = importFromJSON(json);
      expect(result.success).toBe(true);
      expect(result.prediction?.name).toBe('Test');
    });

    it('handles invalid JSON', () => {
      const result = importFromJSON('invalid json');
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('validates required fields', () => {
      const json = JSON.stringify({ name: 'Test' });
      const result = importFromJSON(json);
      expect(result.success).toBe(false);
    });
  });

  describe('importFromCSV', () => {
    it('imports CSV data', () => {
      const csv = 'Position,Type,Song ID,Title,Remarks\n1,song,song-1,,""\n2,mc,,MC Talk,""';
      const result = importFromCSV(csv);
      expect(result.success).toBe(true);
      expect(result.prediction?.setlist.items.length).toBeGreaterThan(0);
    });

    it('handles empty CSV', () => {
      const result = importFromCSV('');
      expect(result.success).toBe(false);
    });
  });

  describe('parseActualSetlist', () => {
    it('parses simple setlist', () => {
      const text = '1. Song One\n2. Song Two';
      const result = parseActualSetlist(text);
      expect(result.items.length).toBe(2);
      expect(result.items[0].title).toBe('Song One');
    });

    it('parses MC items', () => {
      const text = '1. Song One\nMC①\n2. Song Two';
      const result = parseActualSetlist(text);
      expect(result.items.some((item) => item.type === 'mc')).toBe(true);
    });

    it('parses dividers', () => {
      const text = '1. Song One\n━━ ENCORE ━━\n2. Song Two';
      const result = parseActualSetlist(text);
      expect(result.items.length).toBe(3);
    });

    it('resolves known songs to song ids', () => {
      const text = '1. Snow halation';
      const result = parseActualSetlist(text);
      expect(result.items[0].songId).toBe('3');
    });

    it('handles empty input', () => {
      const result = parseActualSetlist('');
      expect(result.items.length).toBe(0);
    });
  });

  describe('toActualSetlistItems', () => {
    it('keeps unknown songs as custom songs', () => {
      const items = toActualSetlistItems([
        {
          type: 'song',
          title: 'Definitely Not A Real Song'
        }
      ]);

      expect(items[0]).toMatchObject({
        type: 'song',
        isCustomSong: true,
        customSongName: 'Definitely Not A Real Song'
      });
      if (items[0]?.type !== 'song') {
        throw new Error('Expected a song item');
      }
      expect(items[0].songId).not.toBe('Definitely Not A Real Song');
    });
  });

  describe('importFromFile', () => {
    it('imports JSON file', async () => {
      const file = new File(
        [
          JSON.stringify({
            id: 'pred-1',
            performanceId: 'perf-1',
            name: 'Test',
            setlist: {
              items: [{ id: 'item-1', position: 0, type: 'song', songId: 'song-1' }],
              totalSongs: 1
            }
          })
        ],
        'test.json',
        { type: 'application/json' }
      );

      const result = await importFromFile(file);
      expect(result.success).toBe(true);
    });

    it('imports text file', async () => {
      const file = new File(['1. Song One\n2. Song Two'], 'test.txt', { type: 'text/plain' });
      const result = await importFromFile(file);
      expect(result.success).toBe(true);
    });

    it('imports CSV file', async () => {
      const file = new File(
        ['Position,Type,Song ID,Title,Remarks\n1,song,song-1,,""'],
        'test.csv',
        { type: 'text/csv' }
      );
      const result = await importFromFile(file);
      expect(result.success).toBe(true);
    });
  });
});
