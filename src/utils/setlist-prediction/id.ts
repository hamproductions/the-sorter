/**
 * Generate unique IDs for setlist prediction entities
 */

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function generatePredictionId(performanceId: string): string {
  return `pred-${performanceId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function generateSetlistId(performanceId: string): string {
  return `setlist-${performanceId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function generateItemId(): string {
  return `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
