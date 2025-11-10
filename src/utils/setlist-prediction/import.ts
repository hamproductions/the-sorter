/**
 * Import utilities for setlist predictions
 */

import { SetlistPrediction } from '~/types/setlist-prediction';
import { generateId, generateSetlistId, generateItemId } from './id';
import { validatePrediction } from './validation';

// ==================== JSON Import ====================

export interface ImportResult {
  success: boolean;
  prediction?: SetlistPrediction;
  errors: string[];
}

export function importFromJSON(json: string): ImportResult {
  try {
    const data = JSON.parse(json);

    // Validate basic structure
    if (!data.performanceId) {
      return {
        success: false,
        errors: ['Missing performanceId in imported data']
      };
    }

    // Ensure IDs are present (generate if missing)
    const prediction: SetlistPrediction = {
      ...data,
      id: data.id || generateId(),
      setlist: {
        ...data.setlist,
        id: data.setlist?.id || generateSetlistId(data.performanceId),
        items: data.setlist?.items?.map((item: any) => ({
          ...item,
          id: item.id || generateItemId()
        })) || []
      },
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Validate
    const validation = validatePrediction(prediction);
    if (!validation.valid) {
      return {
        success: false,
        errors: validation.errors
      };
    }

    return {
      success: true,
      prediction,
      errors: []
    };
  } catch (error) {
    return {
      success: false,
      errors: [`Invalid JSON: ${(error as Error).message}`]
    };
  }
}

export function importFromFile(file: File): Promise<ImportResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const json = event.target?.result as string;
      resolve(importFromJSON(json));
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
}

// ==================== Actual Setlist Import ====================

export interface ActualSetlistData {
  items: {
    type: string;
    songId?: string;
    title?: string;
    remarks?: string;
  }[];
}

export function parseActualSetlist(text: string): ActualSetlistData {
  const lines = text.split('\n').filter((line) => line.trim() !== '');
  const items: ActualSetlistData['items'] = [];

  for (const line of lines) {
    // Try to parse common formats:
    // "1. Song Name"
    // "M01 Song Name"
    // "EN01 Song Name"
    // "[MC①]"

    const trimmed = line.trim();

    // Match numbered items: "1. Song Name" or "M01 Song Name"
    const numberedMatch = trimmed.match(/^(?:\d+\.|[MEN]+\d+)\s+(.+)$/);
    if (numberedMatch) {
      const content = numberedMatch[1].trim();

      // Check if it's a special item (in brackets)
      if (content.startsWith('[') && content.endsWith(']')) {
        items.push({
          type: inferItemType(content),
          title: content.replace(/[\[\]]/g, '')
        });
      } else {
        items.push({
          type: 'song',
          title: content
        });
      }
      continue;
    }

    // Match special items: "[MC①]" or "MC①"
    if (trimmed.startsWith('[') || /^MC|VTR|幕間|Encore/i.test(trimmed)) {
      items.push({
        type: inferItemType(trimmed),
        title: trimmed.replace(/[\[\]]/g, '')
      });
      continue;
    }

    // Default: treat as song if non-empty
    if (trimmed.length > 0) {
      items.push({
        type: 'song',
        title: trimmed
      });
    }
  }

  return { items };
}

function inferItemType(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes('mc')) return 'mc';
  if (lower.includes('vtr') || lower.includes('映像')) return 'vtr';
  if (lower.includes('encore')) return 'encore';
  if (lower.includes('幕間')) return 'vtr';
  if (lower.includes('opening')) return 'opening';
  return 'custom';
}

// ==================== CSV Import ====================

export function importFromCSV(csv: string): ImportResult {
  try {
    const lines = csv.split('\n').filter((line) => line.trim() !== '');

    if (lines.length < 2) {
      return {
        success: false,
        errors: ['CSV file is empty or has no data rows']
      };
    }

    // Parse header
    const header = lines[0].split(',').map((h) => h.trim());

    // Parse rows
    const items = [];
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(',').map((cell) => cell.trim().replace(/^"|"$/g, ''));

      const item: any = {
        id: generateItemId(),
        position: parseInt(row[0]) - 1,
        type: row[1] || 'song'
      };

      if (row[2]) item.songId = row[2];
      if (row[3]) item.title = row[3];
      if (row[4]) item.section = row[4];
      if (row[5]) item.remarks = row[5];

      items.push(item);
    }

    const prediction: SetlistPrediction = {
      id: generateId(),
      performanceId: 'imported',
      name: 'Imported Prediction',
      setlist: {
        id: generateSetlistId('imported'),
        performanceId: 'imported',
        items,
        sections: [],
        totalSongs: items.filter((i) => i.type === 'song').length
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return {
      success: true,
      prediction,
      errors: []
    };
  } catch (error) {
    return {
      success: false,
      errors: [`Failed to parse CSV: ${(error as Error).message}`]
    };
  }
}
