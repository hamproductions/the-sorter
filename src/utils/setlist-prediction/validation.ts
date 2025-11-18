/**
 * Validation utilities for setlist predictions
 */

import type {
  SetlistPrediction,
  PerformanceSetlist,
  SetlistItem
} from '~/types/setlist-prediction';
import { isSongItem, isCustomSong } from '~/types/setlist-prediction';

// ==================== Prediction Validation ====================

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validatePrediction(prediction: SetlistPrediction): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required fields
  if (!prediction.id) {
    errors.push('Prediction ID is required');
  }

  if (!prediction.performanceId) {
    errors.push('Performance ID is required');
  }

  if (!prediction.name || prediction.name.trim() === '') {
    errors.push('Prediction name is required');
  }

  if (!prediction.setlist) {
    errors.push('Setlist is required');
  } else {
    const setlistValidation = validateSetlist(prediction.setlist);
    errors.push(...setlistValidation.errors);
    warnings.push(...setlistValidation.warnings);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

export function validateSetlist(setlist: PerformanceSetlist): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!setlist.items || setlist.items.length === 0) {
    errors.push('Setlist must have at least one item');
    return { valid: false, errors, warnings };
  }

  // Check item positions are sequential
  const positions = setlist.items.map((i) => i.position).sort((a, b) => a - b);
  const hasGaps = positions.some((p, i) => i > 0 && p !== positions[i - 1] + 1);
  const startsAtZero = positions[0] === 0;

  if (!startsAtZero) {
    errors.push('Setlist items must start at position 0');
  }

  if (hasGaps) {
    errors.push('Setlist items have gaps in positions');
  }

  // Check for duplicate positions
  const positionSet = new Set(positions);
  if (positionSet.size !== positions.length) {
    errors.push('Setlist items have duplicate positions');
  }

  // Check song items
  let songCount = 0;
  for (const item of setlist.items) {
    if (isSongItem(item)) {
      songCount++;

      if (!isCustomSong(item) && !item.songId) {
        errors.push(`Song item at position ${item.position} is missing songId`);
      }

      if (isCustomSong(item) && !item.customSongName) {
        errors.push(`Custom song at position ${item.position} is missing customSongName`);
      }
    } else {
      // Non-song item
      if (!item.title || item.title.trim() === '') {
        errors.push(`Non-song item at position ${item.position} is missing title`);
      }
    }
  }

  if (songCount === 0) {
    warnings.push('Setlist has no songs');
  }

  // Validate totalSongs matches actual count
  if (setlist.totalSongs !== songCount) {
    warnings.push(
      `totalSongs (${setlist.totalSongs}) doesn't match actual song count (${songCount})`
    );
  }

  // Validate sections
  if (setlist.sections && setlist.sections.length > 0) {
    for (const section of setlist.sections) {
      if (section.startIndex < 0 || section.startIndex >= setlist.items.length) {
        errors.push(`Section "${section.name}" has invalid startIndex`);
      }

      if (section.endIndex < 0 || section.endIndex >= setlist.items.length) {
        errors.push(`Section "${section.name}" has invalid endIndex`);
      }

      if (section.startIndex > section.endIndex) {
        errors.push(`Section "${section.name}" startIndex is greater than endIndex`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

// ==================== Item Validation ====================

export function validateSetlistItem(item: SetlistItem): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!item.id) {
    errors.push('Item ID is required');
  }

  if (item.position < 0) {
    errors.push('Position must be non-negative');
  }

  if (isSongItem(item)) {
    if (!isCustomSong(item)) {
      if (!item.songId) {
        errors.push('Song item must have songId');
      }
    } else {
      if (!item.customSongName) {
        errors.push('Custom song must have customSongName');
      }
    }
  } else {
    if (!item.title) {
      errors.push('Non-song item must have title');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

// ==================== Helper Functions ====================

export function checkForDuplicateSongs(items: SetlistItem[]): string[] {
  const duplicates: string[] = [];
  const songIds = new Map<string, number[]>();

  items.forEach((item, index) => {
    if (isSongItem(item) && !isCustomSong(item)) {
      const positions = songIds.get(item.songId) || [];
      positions.push(index);
      songIds.set(item.songId, positions);
    }
  });

  songIds.forEach((positions, songId) => {
    if (positions.length > 1) {
      duplicates.push(`Song ${songId} appears at positions: ${positions.join(', ')}`);
    }
  });

  return duplicates;
}

export function checkMinimumSongCount(items: SetlistItem[], minimum: number = 1): boolean {
  const songCount = items.filter((item) => isSongItem(item)).length;
  return songCount >= minimum;
}

export function checkMaximumSongCount(items: SetlistItem[], maximum: number = 50): boolean {
  const songCount = items.filter((item) => isSongItem(item)).length;
  return songCount <= maximum;
}
