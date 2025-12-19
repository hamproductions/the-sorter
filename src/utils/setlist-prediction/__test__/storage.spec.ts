import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  PredictionStorage,
  ActivePredictionStorage,
  SaveSlotStorage,
  PerformanceCacheStorage,
  SettingsStorage,
  getStorageInfo,
  clearAllPredictionData
} from '../storage';
import type { SetlistPrediction, Performance } from '~/types/setlist-prediction';

const mockPrediction: SetlistPrediction = {
  id: 'pred-1',
  performanceId: 'perf-1',
  name: 'Test Prediction',
  setlist: {
    id: 'setlist-1',
    performanceId: 'perf-1',
    totalSongs: 0,
    items: [],
    sections: []
  },
  createdAt: '2023-01-01T00:00:00.000Z',
  updatedAt: '2023-01-01T00:00:00.000Z'
};

describe('Storage Utilities', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.clearAllMocks();
  });

  describe('PredictionStorage', () => {
    it('saves and retrieves predictions', () => {
      PredictionStorage.save(mockPrediction);
      const retrieved = PredictionStorage.get('pred-1');
      expect(retrieved).toEqual(expect.objectContaining({ id: 'pred-1' }));
    });

    it('gets all predictions', () => {
      PredictionStorage.save(mockPrediction);
      const all = PredictionStorage.getAll();
      expect(Object.keys(all)).toHaveLength(1);
    });

    it('gets predictions for performance', () => {
      PredictionStorage.save(mockPrediction);
      const perfs = PredictionStorage.getAllForPerformance('perf-1');
      expect(perfs).toHaveLength(1);
    });

    it('deletes prediction', () => {
      PredictionStorage.save(mockPrediction);
      PredictionStorage.delete('pred-1');
      expect(PredictionStorage.get('pred-1')).toBeNull();
    });

    it('clears predictions', () => {
      PredictionStorage.save(mockPrediction);
      PredictionStorage.clear();
      expect(PredictionStorage.getCount()).toBe(0);
    });
  });

  describe('ActivePredictionStorage', () => {
    it('sets and gets active prediction', () => {
      ActivePredictionStorage.set('pred-1');
      expect(ActivePredictionStorage.get()).toBe('pred-1');
    });

    it('clears active prediction', () => {
      ActivePredictionStorage.set('pred-1');
      ActivePredictionStorage.clear();
      expect(ActivePredictionStorage.get()).toBeNull();
    });
  });

  describe('SaveSlotStorage', () => {
    it('adds prediction to slot', () => {
      SaveSlotStorage.addPrediction('perf-1', 'pred-1');
      const manager = SaveSlotStorage.get();
      expect(manager.slots).toHaveLength(1);
      expect(manager.slots[0].predictions).toContain('pred-1');
    });

    it('removes prediction from slot', () => {
      SaveSlotStorage.addPrediction('perf-1', 'pred-1');
      SaveSlotStorage.removePrediction('pred-1');
      const manager = SaveSlotStorage.get();
      expect(manager.slots).toHaveLength(0);
    });

    it('clears slots', () => {
      SaveSlotStorage.addPrediction('perf-1', 'pred-1');
      SaveSlotStorage.clear();
      expect(SaveSlotStorage.get().slots).toHaveLength(0);
    });
  });

  describe('PerformanceCacheStorage', () => {
    const mockPerformance: Performance = {
      id: 'p1',
      name: 'Test Performance',
      date: '2023-01-01',
      seriesIds: [],
      artistIds: [],
      source: 'custom',
      status: 'upcoming',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    it('adds and retrieves performances', () => {
      PerformanceCacheStorage.add(mockPerformance);
      const cached = PerformanceCacheStorage.get();
      expect(cached).toHaveLength(1);
      expect(cached[0].id).toBe('p1');
    });

    it('updates existing performance', () => {
      PerformanceCacheStorage.add(mockPerformance);
      const updated = { ...mockPerformance, name: 'Updated Name' };
      PerformanceCacheStorage.add(updated);
      const cached = PerformanceCacheStorage.get();
      expect(cached[0].name).toBe('Updated Name');
    });

    it('removes performance', () => {
      PerformanceCacheStorage.add(mockPerformance);
      PerformanceCacheStorage.remove('p1');
      expect(PerformanceCacheStorage.get()).toHaveLength(0);
    });

    it('clears cache', () => {
      PerformanceCacheStorage.add(mockPerformance);
      PerformanceCacheStorage.clear();
      expect(PerformanceCacheStorage.get()).toHaveLength(0);
    });
  });

  describe('SettingsStorage', () => {
    it('saves and retrieves settings', () => {
      SettingsStorage.save({
        language: 'ja',
        theme: 'dark',
        autosave: false,
        defaultScoringRules: {}
      });
      const settings = SettingsStorage.get();
      expect(settings.language).toBe('ja');
    });

    it('clears settings', () => {
      SettingsStorage.save({
        language: 'ja',
        theme: 'dark',
        autosave: false,
        defaultScoringRules: {}
      });
      SettingsStorage.clear();
      expect(SettingsStorage.get().language).toBe('en'); // Default
    });
  });

  describe('General', () => {
    it('gets storage info', () => {
      PredictionStorage.save(mockPrediction);
      const info = getStorageInfo();
      expect(info.used).toBeGreaterThan(0);
    });

    it('clears all data', () => {
      PredictionStorage.save(mockPrediction);
      ActivePredictionStorage.set('pred-1');
      clearAllPredictionData();
      expect(PredictionStorage.getCount()).toBe(0);
      expect(ActivePredictionStorage.get()).toBeNull();
    });
  });
});
