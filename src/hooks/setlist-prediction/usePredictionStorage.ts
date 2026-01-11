/**
 * Hook for managing prediction storage in localStorage
 */

import { useCallback, useEffect, useState, useMemo } from 'react';
import type { SetlistPrediction } from '~/types/setlist-prediction';
import {
  PredictionStorage,
  ActivePredictionStorage,
  SaveSlotStorage
} from '~/utils/setlist-prediction/storage';

export function usePredictionStorage() {
  const [predictions, setPredictions] = useState<Record<string, SetlistPrediction>>({});
  const [activePredictionId, setActivePredictionId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  // Load predictions from localStorage on mount
  useEffect(() => {
    const loadedPredictions = PredictionStorage.getAll();
    setPredictions(loadedPredictions);

    const activeId = ActivePredictionStorage.get();
    setActivePredictionId(activeId);
    setReady(true);
  }, []);

  const savePrediction = useCallback((prediction: SetlistPrediction) => {
    PredictionStorage.save(prediction);
    if (prediction.performanceId) {
      SaveSlotStorage.addPrediction(prediction.performanceId, prediction.id);
    }

    setPredictions((prev) => ({
      ...prev,
      [prediction.id]: prediction
    }));
  }, []);

  const getPrediction = useCallback(
    (id: string): SetlistPrediction | null => {
      console.log('Getting prediction with id:', predictions);
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

  const predictionsArray = useMemo(() => Object.values(predictions), [predictions]);

  return {
    predictions: predictionsArray,
    predictionsById: predictions,
    ready,
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
