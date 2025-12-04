/**
 * Import utilities for setlist predictions
 */

import { generateId, generateSetlistId, generateItemId } from './id';
import { validatePrediction } from './validation';
import type { SetlistPrediction, SetlistItem, SetlistItemType } from '~/types/setlist-prediction';

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
        items:
          data.setlist?.items?.map((item: unknown) => ({
            ...(item as Record<string, unknown>),
            id: (item as { id?: string }).id || generateItemId()
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

    reader.addEventListener('load', (event) => {
      const content = event.target?.result as string;

      if (file.type === 'application/json' || file.name.endsWith('.json')) {
        resolve(importFromJSON(content));
        return;
      }

      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        resolve(importFromCSV(content));
        return;
      }

      // Default to text parsing
      try {
        const { items } = parseActualSetlist(content);

        if (items.length === 0) {
          resolve({
            success: false,
            errors: ['No items found in text file']
          });
          return;
        }

        // Convert ActualSetlistData items to SetlistItem[]
        const setlistItems: SetlistItem[] = items.map((item, index) => {
          const base = {
            id: generateItemId(),
            position: index,
            remarks: item.remarks
          };

          if (item.type === 'song') {
            return {
              ...base,
              type: 'song',
              songId: '',
              isCustomSong: true,
              customSongName: item.title || ''
            };
          }

          return {
            ...base,
            type: item.type as 'mc' | 'other',
            title: item.title || ''
          };
        });

        const prediction: SetlistPrediction = {
          id: generateId(),
          performanceId: 'imported',
          name: file.name.replace(/\.[^/.]+$/, ''),
          setlist: {
            id: generateSetlistId('imported'),
            performanceId: 'imported',
            items: setlistItems,
            sections: [],
            totalSongs: setlistItems.filter((i) => i.type === 'song').length
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        resolve({
          success: true,
          prediction,
          errors: []
        });
      } catch (error) {
        resolve({
          success: false,
          errors: [`Failed to parse file: ${(error as Error).message}`]
        });
      }
    });

    reader.addEventListener('error', () => {
      reject(new Error('Failed to read file'));
    });

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
          title: content.replace(/[[\]]/g, '')
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
        title: trimmed.replace(/[[\]]/g, '')
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
  return 'other';
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

    // Parse rows (skip header)
    const items: SetlistItem[] = [];
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(',').map((cell) => cell.trim().replace(/^"|"$/g, ''));

      const itemType = (row[1] || 'song') as SetlistItemType;
      const position = parseInt(row[0]) - 1;
      const id = generateItemId();

      if (itemType === 'song') {
        items.push({
          id,
          position,
          type: 'song' as const,
          songId: row[2] || '',
          remarks: row[5]
        });
      } else {
        items.push({
          id,
          position,
          type: itemType,
          title: row[3] || '',
          remarks: row[5]
        });
      }
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
