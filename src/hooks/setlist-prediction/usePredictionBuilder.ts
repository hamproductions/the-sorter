/**
 * Main hook for building and editing predictions
 */

import { useCallback, useEffect, useState } from 'react';
import type {
  SetlistPrediction,
  SetlistItem,
  SongSetlistItem,
  NonSongSetlistItem
} from '~/types/setlist-prediction';
import {
  generatePredictionId,
  generateSetlistId,
  generateItemId
} from '~/utils/setlist-prediction/id';
import { validatePrediction } from '~/utils/setlist-prediction/validation';

export interface UsePredictionBuilderOptions {
  performanceId: string;
  initialPrediction?: SetlistPrediction;
  autosave?: boolean;
  onSave?: (prediction: SetlistPrediction) => void;
}

export function usePredictionBuilder({
  performanceId,
  initialPrediction,
  autosave = true,
  onSave
}: UsePredictionBuilderOptions) {
  const [prediction, setPrediction] = useState<SetlistPrediction>(() => {
    if (initialPrediction) {
      return initialPrediction;
    }

    // Create new prediction
    return {
      id: generatePredictionId(performanceId),
      performanceId,
      name: 'New Prediction',
      setlist: {
        id: generateSetlistId(performanceId),
        performanceId,
        items: [],
        sections: [],
        totalSongs: 0
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  });

  const [isDirty, setIsDirty] = useState(false);
  const [validationResult, setValidationResult] = useState(
    validatePrediction(prediction)
  );

  // Auto-save when prediction changes
  useEffect(() => {
    if (isDirty && autosave && onSave) {
      onSave(prediction);
      setIsDirty(false);
    }
  }, [isDirty, autosave, prediction, onSave]);

  // Revalidate when prediction changes
  useEffect(() => {
    setValidationResult(validatePrediction(prediction));
  }, [prediction]);

  // ==================== Setlist Items ====================

  const addSong = useCallback(
    (songId: string, position?: number, options?: Partial<SongSetlistItem>) => {
      setPrediction((prev) => {
        const items = [...prev.setlist.items];
        const newItem: SongSetlistItem = {
          id: generateItemId(),
          type: 'song',
          songId,
          position: position ?? items.length,
          ...options
        };

        if (position !== undefined && position < items.length) {
          // Insert at position
          items.splice(position, 0, newItem);
          // Update positions
          items.forEach((item, idx) => {
            item.position = idx;
          });
        } else {
          // Add to end
          newItem.position = items.length;
          items.push(newItem);
        }

        const totalSongs = items.filter(
          (item) => item.type === 'song' || item.type === 'encore'
        ).length;

        return {
          ...prev,
          setlist: {
            ...prev.setlist,
            items,
            totalSongs
          },
          updatedAt: new Date().toISOString()
        };
      });

      setIsDirty(true);
    },
    []
  );

  const addNonSongItem = useCallback(
    (
      title: string,
      type: NonSongSetlistItem['type'],
      position?: number,
      options?: Partial<NonSongSetlistItem>
    ) => {
      setPrediction((prev) => {
        const items = [...prev.setlist.items];
        const newItem: NonSongSetlistItem = {
          id: generateItemId(),
          type,
          title,
          position: position ?? items.length,
          ...options
        };

        if (position !== undefined && position < items.length) {
          items.splice(position, 0, newItem);
          items.forEach((item, idx) => {
            item.position = idx;
          });
        } else {
          newItem.position = items.length;
          items.push(newItem);
        }

        return {
          ...prev,
          setlist: {
            ...prev.setlist,
            items
          },
          updatedAt: new Date().toISOString()
        };
      });

      setIsDirty(true);
    },
    []
  );

  const removeItem = useCallback((itemId: string) => {
    setPrediction((prev) => {
      const items = prev.setlist.items
        .filter((item) => item.id !== itemId)
        .map((item, idx) => ({
          ...item,
          position: idx
        }));

      const totalSongs = items.filter(
        (item) => item.type === 'song' || item.type === 'encore'
      ).length;

      return {
        ...prev,
        setlist: {
          ...prev.setlist,
          items,
          totalSongs
        },
        updatedAt: new Date().toISOString()
      };
    });

    setIsDirty(true);
  }, []);

  const updateItem = useCallback(
    (itemId: string, updates: Partial<SetlistItem>) => {
      setPrediction((prev) => {
        const items = prev.setlist.items.map((item) =>
          item.id === itemId ? { ...item, ...updates } : item
        );

        return {
          ...prev,
          setlist: {
            ...prev.setlist,
            items
          },
          updatedAt: new Date().toISOString()
        };
      });

      setIsDirty(true);
    },
    []
  );

  const reorderItems = useCallback((newItems: SetlistItem[]) => {
    setPrediction((prev) => {
      const items = newItems.map((item, idx) => ({
        ...item,
        position: idx
      }));

      return {
        ...prev,
        setlist: {
          ...prev.setlist,
          items
        },
        updatedAt: new Date().toISOString()
      };
    });

    setIsDirty(true);
  }, []);

  const clearItems = useCallback(() => {
    setPrediction((prev) => ({
      ...prev,
      setlist: {
        ...prev.setlist,
        items: [],
        totalSongs: 0
      },
      updatedAt: new Date().toISOString()
    }));

    setIsDirty(true);
  }, []);

  // ==================== Sections ====================

  const addSection = useCallback(
    (
      name: string,
      startIndex: number,
      endIndex: number,
      type?: 'main' | 'encore' | 'special'
    ) => {
      setPrediction((prev) => {
        const sections = [
          ...prev.setlist.sections,
          {
            name,
            startIndex,
            endIndex,
            type
          }
        ];

        return {
          ...prev,
          setlist: {
            ...prev.setlist,
            sections
          },
          updatedAt: new Date().toISOString()
        };
      });

      setIsDirty(true);
    },
    []
  );

  const removeSection = useCallback((sectionName: string) => {
    setPrediction((prev) => {
      const sections = prev.setlist.sections.filter((s) => s.name !== sectionName);

      return {
        ...prev,
        setlist: {
          ...prev.setlist,
          sections
        },
        updatedAt: new Date().toISOString()
      };
    });

    setIsDirty(true);
  }, []);

  // ==================== Prediction Metadata ====================

  const updateMetadata = useCallback(
    (updates: Partial<Pick<SetlistPrediction, 'name' | 'description' | 'isFavorite'>>) => {
      setPrediction((prev) => ({
        ...prev,
        ...updates,
        updatedAt: new Date().toISOString()
      }));

      setIsDirty(true);
    },
    []
  );

  // ==================== Save / Reset ====================

  const save = useCallback(() => {
    if (onSave) {
      onSave(prediction);
      setIsDirty(false);
    }
  }, [prediction, onSave]);

  const reset = useCallback(() => {
    if (initialPrediction) {
      setPrediction(initialPrediction);
    } else {
      clearItems();
    }
    setIsDirty(false);
  }, [initialPrediction, clearItems]);

  return {
    prediction,
    isDirty,
    isValid: validationResult.valid,
    validation: validationResult,

    // Item operations
    addSong,
    addNonSongItem,
    removeItem,
    updateItem,
    reorderItems,
    clearItems,

    // Section operations
    addSection,
    removeSection,

    // Metadata
    updateMetadata,

    // Save/reset
    save,
    reset
  };
}
