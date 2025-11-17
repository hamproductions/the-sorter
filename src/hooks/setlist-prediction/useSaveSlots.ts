/**
 * Hook for managing save slots
 */

import { useCallback, useEffect, useState } from 'react';
import type { SaveSlotManager, SaveSlot } from '~/types/setlist-prediction';
import { SaveSlotStorage } from '~/utils/setlist-prediction/storage';

export function useSaveSlots() {
  const [slotManager, setSlotManager] = useState<SaveSlotManager>(() => SaveSlotStorage.get());

  // Sync with localStorage
  useEffect(() => {
    const manager = SaveSlotStorage.get();
    setSlotManager(manager);
  }, []);

  const getSlot = useCallback(
    (slotNumber: number): SaveSlot | undefined => {
      return slotManager.slots.find((s) => s.slot === slotNumber);
    },
    [slotManager]
  );

  const getSlotForPerformance = useCallback(
    (performanceId: string): SaveSlot | undefined => {
      return slotManager.slots.find((s) => s.performanceId === performanceId);
    },
    [slotManager]
  );

  const createSlot = useCallback((performanceId: string, predictionId: string) => {
    SaveSlotStorage.addPrediction(performanceId, predictionId);
    setSlotManager(SaveSlotStorage.get());
  }, []);

  const deleteSlot = useCallback((slotNumber: number) => {
    const manager = SaveSlotStorage.get();
    manager.slots = manager.slots.filter((s) => s.slot !== slotNumber);
    SaveSlotStorage.save(manager);
    setSlotManager(manager);
  }, []);

  const setActiveSlot = useCallback((slotNumber: number) => {
    const manager = SaveSlotStorage.get();
    manager.currentSlot = slotNumber;
    SaveSlotStorage.save(manager);
    setSlotManager(manager);
  }, []);

  const clearAllSlots = useCallback(() => {
    SaveSlotStorage.clear();
    setSlotManager(SaveSlotStorage.get());
  }, []);

  return {
    slots: slotManager.slots,
    currentSlot: slotManager.currentSlot,
    maxSlots: slotManager.maxSlots,
    getSlot,
    getSlotForPerformance,
    createSlot,
    deleteSlot,
    setActiveSlot,
    clearAllSlots
  };
}
