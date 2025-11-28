/**
 * Generate unique IDs for setlist prediction entities
 */

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function generatePredictionId(performanceId?: string): string {
  const idBase = performanceId || 'custom';
  return `pred-${idBase}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function generateSetlistId(performanceId?: string): string {
  const idBase = performanceId || 'custom';
  return `setlist-${idBase}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function generateItemId(): string {
  return `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
