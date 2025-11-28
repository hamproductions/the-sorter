/**
 * LocalStorage utilities for setlist predictions
 */

import type {
  SetlistPrediction,
  SaveSlotManager,
  UserSettings,
  Performance,
  LocalStorageSchema
} from '~/types/setlist-prediction';
import { STORAGE_KEYS } from '~/types/setlist-prediction';

// ==================== Generic Storage Helpers ====================

function getItem<K extends keyof LocalStorageSchema>(key: K): LocalStorageSchema[K] | null {
  if (typeof window === 'undefined') return null;

  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error(`Error reading from localStorage (${key}):`, error);
    return null;
  }
}

function setItem<K extends keyof LocalStorageSchema>(key: K, value: LocalStorageSchema[K]): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing to localStorage (${key}):`, error);
    // Handle quota exceeded error
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.warn('LocalStorage quota exceeded. Consider cleaning old data.');
    }
  }
}

function removeItem(key: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(key);
}

// ==================== Prediction Storage ====================

export class PredictionStorage {
  private static KEYS = STORAGE_KEYS;

  static save(prediction: SetlistPrediction): void {
    const predictions = this.getAll();
    predictions[prediction.id] = {
      ...prediction,
      updatedAt: new Date().toISOString()
    };
    setItem(this.KEYS.PREDICTIONS, predictions);
  }

  static get(id: string): SetlistPrediction | null {
    const predictions = this.getAll();
    return predictions[id] || null;
  }

  static getAll(): Record<string, SetlistPrediction> {
    return getItem(this.KEYS.PREDICTIONS) || {};
  }

  static getAllForPerformance(performanceId: string): SetlistPrediction[] {
    const predictions = this.getAll();
    return Object.values(predictions).filter((p) => p.performanceId === performanceId);
  }

  static delete(id: string): void {
    const predictions = this.getAll();
    delete predictions[id];
    setItem(this.KEYS.PREDICTIONS, predictions);
  }

  static clear(): void {
    setItem(this.KEYS.PREDICTIONS, {});
  }

  static getCount(): number {
    return Object.keys(this.getAll()).length;
  }
}

// ==================== Active Prediction ====================

export class ActivePredictionStorage {
  private static KEY = STORAGE_KEYS.ACTIVE_PREDICTION;

  static set(predictionId: string): void {
    setItem(this.KEY, predictionId);
  }

  static get(): string | null {
    return getItem(this.KEY);
  }

  static clear(): void {
    removeItem(this.KEY);
  }
}

// ==================== Save Slot Manager ====================

export class SaveSlotStorage {
  private static KEY = STORAGE_KEYS.SAVE_SLOTS;

  static get(): SaveSlotManager {
    return (
      getItem(this.KEY) || {
        slots: [],
        maxSlots: 10,
        currentSlot: undefined
      }
    );
  }

  static save(manager: SaveSlotManager): void {
    setItem(this.KEY, manager);
  }

  static addPrediction(performanceId: string, predictionId: string): void {
    const manager = this.get();

    // Find or create slot for this performance
    let slot = manager.slots.find((s) => s.performanceId === performanceId);

    if (!slot) {
      // Create new slot
      const slotNumber =
        manager.slots.length > 0 ? Math.max(...manager.slots.map((s) => s.slot)) + 1 : 1;

      slot = {
        slot: slotNumber,
        performanceId,
        predictions: [],
        lastModified: new Date().toISOString()
      };
      manager.slots.push(slot);
    }

    // Add prediction to slot
    if (!slot.predictions.includes(predictionId)) {
      slot.predictions.push(predictionId);
    }

    slot.activePredictionId = predictionId;
    slot.lastModified = new Date().toISOString();

    this.save(manager);
  }

  static removePrediction(predictionId: string): void {
    const manager = this.get();

    for (const slot of manager.slots) {
      const index = slot.predictions.indexOf(predictionId);
      if (index !== -1) {
        slot.predictions.splice(index, 1);
        slot.lastModified = new Date().toISOString();

        if (slot.activePredictionId === predictionId) {
          slot.activePredictionId = slot.predictions.length > 0 ? slot.predictions[0] : undefined;
        }

        // Remove empty slots
        if (slot.predictions.length === 0) {
          manager.slots = manager.slots.filter((s) => s.slot !== slot.slot);
        }
      }
    }

    this.save(manager);
  }

  static clear(): void {
    setItem(this.KEY, {
      slots: [],
      maxSlots: 10,
      currentSlot: undefined
    });
  }
}

// ==================== Performance Cache ====================

export class PerformanceCacheStorage {
  private static KEY = STORAGE_KEYS.PERFORMANCE_CACHE;

  static get(): Performance[] {
    return getItem(this.KEY) || [];
  }

  static save(performances: Performance[]): void {
    setItem(this.KEY, performances);
  }

  static add(performance: Performance): void {
    const performances = this.get();
    const index = performances.findIndex((p) => p.id === performance.id);

    if (index !== -1) {
      performances[index] = performance;
    } else {
      performances.push(performance);
    }

    this.save(performances);
  }

  static clear(): void {
    setItem(this.KEY, []);
  }
}

// ==================== Settings ====================

export class SettingsStorage {
  private static KEY = STORAGE_KEYS.SETTINGS;

  static get(): UserSettings {
    return (
      getItem(this.KEY) || {
        defaultScoringRules: {},
        autosave: true,
        language: 'en',
        theme: 'light'
      }
    );
  }

  static save(settings: UserSettings): void {
    setItem(this.KEY, settings);
  }

  static clear(): void {
    removeItem(this.KEY);
  }
}

// ==================== Storage Info ====================

export function getStorageInfo() {
  if (typeof window === 'undefined') {
    return { used: 0, limit: 0 };
  }

  try {
    const used = JSON.stringify(localStorage).length;
    const limit = 5 * 1024 * 1024; // 5MB typical limit

    return {
      used,
      limit,
      usedMB: (used / 1024 / 1024).toFixed(2),
      percentUsed: ((used / limit) * 100).toFixed(2)
    };
  } catch {
    return { used: 0, limit: 0 };
  }
}

export function clearAllPredictionData(): void {
  PredictionStorage.clear();
  ActivePredictionStorage.clear();
  SaveSlotStorage.clear();
  PerformanceCacheStorage.clear();
  // HistoryCacheStorage.clear(); // TODO: Implement HistoryCacheStorage
  SettingsStorage.clear();
}
