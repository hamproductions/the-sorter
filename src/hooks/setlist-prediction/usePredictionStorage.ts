/**
 * Hook for managing prediction storage in localStorage
 */

import { useCallback, useEffect, useState } from 'react';
import type { SetlistPrediction } from '~/types/setlist-prediction';
import {
  PredictionStorage,
  ActivePredictionStorage,
  SaveSlotStorage
} from '~/utils/setlist-prediction/storage';

export function usePredictionStorage() {
  const [predictions, setPredictions] = useState<Record<string, SetlistPrediction>>({});
  const [activePredictionId, setActivePredictionId] = useState<string | null>(null);

  // Load predictions from localStorage on mount
  useEffect(() => {
    const loadedPredictions = PredictionStorage.getAll();
    setPredictions(loadedPredictions);

    const activeId = ActivePredictionStorage.get();
    setActivePredictionId(activeId);
  }, []);

  const savePrediction = useCallback((prediction: SetlistPrediction) => {
    PredictionStorage.save(prediction);
    SaveSlotStorage.addPrediction(prediction.performanceId, prediction.id);

    setPredictions((prev) => ({
      ...prev,
      [prediction.id]: prediction
    }));
  }, []);

  const getPrediction = useCallback(
    (id: string): SetlistPrediction | null => {
      return predictions[id] || null;
    },
    [predictions]
  );

  const getPredictionsForPerformance = useCallback(
    (performanceId: string): SetlistPrediction[] => {
      return Object.values(predictions).filter((p) => p.performanceId === performanceId);
    },
    [predictions]
  );

  const deletePrediction = useCallback(
    (id: string) => {
      PredictionStorage.delete(id);
      SaveSlotStorage.removePrediction(id);

      setPredictions((prev) => {
        const { [id]: _, ...rest } = prev;
        return rest;
      });

      if (activePredictionId === id) {
        setActivePredictionId(null);
        ActivePredictionStorage.clear();
      }
    },
    [activePredictionId]
  );

  const setActivePrediction = useCallback((id: string | null) => {
    if (id) {
      ActivePredictionStorage.set(id);
    } else {
      ActivePredictionStorage.clear();
    }
    setActivePredictionId(id);
  }, []);

  const clearAll = useCallback(() => {
    PredictionStorage.clear();
    SaveSlotStorage.clear();
    ActivePredictionStorage.clear();
    setPredictions({});
    setActivePredictionId(null);
  }, []);

  return {
    predictions: Object.values(predictions),
    predictionsById: predictions,
    activePredictionId,
    activePrediction: activePredictionId ? predictions[activePredictionId] : null,
    savePrediction,
    getPrediction,
    getPredictionsForPerformance,
    deletePrediction,
    setActivePrediction,
    clearAll
  };
}
