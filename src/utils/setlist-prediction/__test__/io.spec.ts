import { describe, expect, it } from 'vitest';
import {
  compressPrediction,
  decompressPrediction,
  generateShareUrl,
  parseShareUrl,
  canShareUrl
} from '../compression';
import { importFromJSON, importFromCSV, parseActualSetlist } from '../import';
import {
  exportAsJSON,
  exportAsText,
  exportAsMarkdown,
  exportAsCSV,
  generateFilename
} from '../export';
import type {
  SetlistPrediction,
  SongSetlistItem,
  NonSongSetlistItem
} from '~/types/setlist-prediction';

const mockPrediction: SetlistPrediction = {
  id: 'pred-1',
  performanceId: 'perf-1',
  name: 'Test Prediction',
  setlist: {
    id: 'setlist-1',
    performanceId: 'perf-1',
    totalSongs: 2,
    items: [
      {
        id: 'item-1',
        position: 0,
        type: 'song',
        songId: 'song-1',
        isCustomSong: false,
        remarks: 'Opener'
      } as SongSetlistItem,
      {
        id: 'item-2',
        position: 1,
        type: 'mc',
        title: 'MC 1'
      } as NonSongSetlistItem,
      {
        id: 'item-3',
        position: 2,
        type: 'song',
        songId: 'custom-1',
        isCustomSong: true,
        customSongName: 'My Song'
      } as SongSetlistItem
    ],
    sections: []
  },
  createdAt: '2023-01-01T00:00:00.000Z',
  updatedAt: '2023-01-01T00:00:00.000Z'
};

describe('Compression', () => {
  it('compresses and decompresses correctly', () => {
    const compressed = compressPrediction(mockPrediction);
    const decompressed = decompressPrediction(compressed);

    expect(decompressed.performanceId).toBe(mockPrediction.performanceId);
    expect(decompressed.name).toBe(mockPrediction.name);
    expect(decompressed.setlist.items).toHaveLength(3);
    expect((decompressed.setlist.items[0] as SongSetlistItem).songId).toBe('song-1');
    expect((decompressed.setlist.items[0] as SongSetlistItem).remarks).toBe('Opener');
    expect((decompressed.setlist.items[2] as SongSetlistItem).isCustomSong).toBe(true);
    expect((decompressed.setlist.items[2] as SongSetlistItem).customSongName).toBe('My Song');
  });

  it('generates share URL', () => {
    const url = generateShareUrl(mockPrediction, 'https://example.com');
    expect(url).toContain('https://example.com/setlist-prediction/view?data=');
  });

  it('parses share URL', () => {
    const url = generateShareUrl(mockPrediction, 'https://example.com');
    const parsed = parseShareUrl(url);
    expect(parsed.name).toBe(mockPrediction.name);
  });

  it('checks if shareable', () => {
    expect(canShareUrl(mockPrediction)).toBe(true);
  });

  it('handles invalid compressed data', () => {
    expect(() => decompressPrediction('invalid-data')).toThrow();
  });
});

describe('Import', () => {
  it('imports from JSON', () => {
    const json = JSON.stringify(mockPrediction);
    const result = importFromJSON(json);

    expect(result.success).toBe(true);
    expect(result.prediction?.name).toBe(mockPrediction.name);
  });

  it('handles invalid JSON', () => {
    const result = importFromJSON('{ invalid json }');
    expect(result.success).toBe(false);
  });

  it('imports from CSV', () => {
    const csv = `Position,Type,Song ID,Title,Remarks
1,"song","song-1","","Opener"
2,"mc","","MC 1",""
3,"song","custom-1","My Song",""`;

    const result = importFromCSV(csv);
    expect(result.success).toBe(true);
    expect(result.prediction?.setlist.items).toHaveLength(3);
    if (result.prediction?.setlist.items[0]) {
      expect((result.prediction.setlist.items[0] as SongSetlistItem).songId).toBe('song-1');
    }
  });

  it('parses actual setlist text', () => {
    const text = `
    1. Song A
    2. Song B
    [MC]
    3. Song C
    EN01 Encore Song
    `;
    const result = parseActualSetlist(text);
    expect(result.items).toHaveLength(5);
    expect(result.items[0].title).toBe('Song A');
    expect(result.items[2].type).toBe('mc');
    expect(result.items[4].title).toBe('Encore Song');
  });
});

describe('Export', () => {
  it('exports as JSON', async () => {
    const blob = exportAsJSON(mockPrediction);
    const text = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.addEventListener('load', () => resolve(reader.result as string));
      reader.readAsText(blob);
    });
    const parsed = JSON.parse(text);
    expect(parsed.name).toBe(mockPrediction.name);
  });

  it('exports as Text', () => {
    const text = exportAsText(mockPrediction);
    expect(text).toContain('SETLIST PREDICTION');
    expect(text).toContain('Test Prediction');
    expect(text).toContain('song-1');
    expect(text).toContain('My Song');
  });

  it('exports as Markdown', () => {
    const md = exportAsMarkdown(mockPrediction);
    expect(md).toContain('# Setlist Prediction');
    expect(md).toContain('### Test Prediction');
    expect(md).toContain('song-1');
  });

  it('exports as CSV', () => {
    const csv = exportAsCSV(mockPrediction);
    expect(csv).toContain('Position,Type,Song ID,Title,Remarks');
    expect(csv).toContain('"song","song-1"');
  });

  it('generates filename', () => {
    const filename = generateFilename(mockPrediction, 'json');
    expect(filename).toMatch(/test_prediction_\d{4}-\d{2}-\d{2}\.json/);
  });
});
