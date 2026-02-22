import { describe, expect, it, vi, beforeAll } from 'vitest';
import {
  exportAsJSON,
  exportAsText,
  exportAsMarkdown,
  exportAsCSV,
  downloadJSON,
  downloadCSV,
  copyTextToClipboard,
  generateFilename
} from '../export';
import type { SetlistPrediction, Performance } from '~/types/setlist-prediction';

describe('export utilities', () => {
  beforeAll(() => {
    global.URL.createObjectURL = vi.fn(() => 'blob:test');
    global.URL.revokeObjectURL = vi.fn();
  });

  const mockPrediction: SetlistPrediction = {
    id: 'pred-1',
    performanceId: 'perf-1',
    name: 'Test Prediction',
    setlist: {
      id: 'setlist-1',
      performanceId: 'perf-1',
      items: [
        { id: 'item-1', type: 'song', songId: 'song-1', position: 0 },
        { id: 'item-2', type: 'mc', title: 'MC Talk', position: 1 }
      ],
      sections: []
    },
    createdAt: '2023-01-01',
    updatedAt: '2023-01-01'
  };

  const mockPerformance: Performance = {
    id: 'perf-1',
    tourName: 'Test Performance',
    date: '2023-01-01',
    venue: 'Test Venue',
    seriesIds: [],
    artistIds: [],
    source: 'custom',
    status: 'upcoming',
    createdAt: '2023-01-01',
    updatedAt: '2023-01-01'
  };

  describe('exportAsJSON', () => {
    it('exports prediction as JSON blob', () => {
      const blob = exportAsJSON(mockPrediction);
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('application/json');
    });
  });

  describe('exportAsText', () => {
    it('exports prediction as plain text', () => {
      const text = exportAsText(mockPrediction, mockPerformance);
      expect(text).toContain('Test Performance');
      expect(text).toContain('Test Venue');
    });

    it('includes author name when provided', () => {
      const text = exportAsText(mockPrediction, mockPerformance, 'Test Author');
      expect(text).toContain('Test Author');
    });
  });

  describe('exportAsMarkdown', () => {
    it('exports prediction as markdown', () => {
      const markdown = exportAsMarkdown(mockPrediction, mockPerformance);
      expect(markdown).toContain('# Setlist Prediction');
      expect(markdown).toContain('Test Venue');
    });

    it('includes description in markdown', () => {
      const predictionWithDesc = { ...mockPrediction, description: 'Test Description' };
      const markdown = exportAsMarkdown(predictionWithDesc, mockPerformance);
      expect(markdown).toContain('Test Description');
    });
  });

  describe('exportAsCSV', () => {
    it('exports prediction as CSV', () => {
      const csv = exportAsCSV(mockPrediction);
      expect(csv).toContain('Position,Type,Song ID');
    });

    it('includes all items in CSV', () => {
      const csv = exportAsCSV(mockPrediction);
      expect(csv).toContain('song-1');
      expect(csv).toContain('MC Talk');
    });
  });

  describe('generateFilename', () => {
    it('generates filename from prediction name', () => {
      const filename = generateFilename(mockPrediction, 'json');
      expect(filename).toContain('test_prediction');
      expect(filename).toContain('.json');
    });

    it('sanitizes filename', () => {
      const prediction = { ...mockPrediction, name: 'Test/Prediction!' };
      const filename = generateFilename(prediction, 'txt');
      expect(filename).toContain('test_prediction_');
      expect(filename).toContain('.txt');
    });
  });

  describe('downloadJSON', () => {
    it('creates download link', () => {
      const createElementSpy = vi.spyOn(document, 'createElement');
      downloadJSON(mockPrediction);
      expect(createElementSpy).toHaveBeenCalledWith('a');
    });
  });

  describe('downloadCSV', () => {
    it('creates CSV download link', () => {
      const createElementSpy = vi.spyOn(document, 'createElement');
      downloadCSV(mockPrediction);
      expect(createElementSpy).toHaveBeenCalledWith('a');
    });
  });

  describe('copyTextToClipboard', () => {
    it('copies text to clipboard', async () => {
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: writeTextMock },
        writable: true
      });

      await copyTextToClipboard(mockPrediction, mockPerformance);
      expect(writeTextMock).toHaveBeenCalled();
    });
  });
});
