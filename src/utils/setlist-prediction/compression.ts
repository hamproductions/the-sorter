/**
 * URL compression and decompression for sharing predictions
 */

import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import { generateId, generateSetlistId } from './id';
import type {
  SetlistPrediction,
  ShareData,
  ShareItem,
  ShareSection,
  ShareCustomPerformance,
  SetlistItem,
  SongSetlistItem,
  NonSongSetlistItem
} from '~/types/setlist-prediction';
import { isSongItem } from '~/types/setlist-prediction';

// ==================== Compression ====================

function compressCustomPerformance(
  customPerformance: SetlistPrediction['customPerformance']
): ShareCustomPerformance | undefined {
  if (!customPerformance) return undefined;
  return {
    n: customPerformance.name,
    v: customPerformance.venue,
    d: customPerformance.date
  };
}

export function compressPrediction(prediction: SetlistPrediction): string {
  const minified: ShareData = {
    v: 1,
    p: prediction.performanceId,
    cp: compressCustomPerformance(prediction.customPerformance),
    n: prediction.name,
    i: prediction.setlist.items.map((item): ShareItem => {
      if (isSongItem(item)) {
        return {
          t: item.type,
          s: item.songId,
          r: item.remarks,
          cs: item.isCustomSong || undefined, // only include if true
          cn: item.customSongName || undefined // only include if present
        };
      } else {
        return {
          t: item.type,
          c: item.title,
          r: item.remarks
        };
      }
    }),
    sec: prediction.setlist.sections.map(
      (s): ShareSection => ({
        n: s.name,
        s: s.startIndex,
        e: s.endIndex,
        t: s.type
      })
    )
  };

  // Compress to URL-safe string
  const json = JSON.stringify(minified);
  return compressToEncodedURIComponent(json);
}

export function generateShareUrl(prediction: SetlistPrediction, origin?: string): string {
  const compressed = compressPrediction(prediction);
  const baseUrl = origin || (typeof window !== 'undefined' ? window.location.origin : '');
  return `${baseUrl}/setlist-prediction/view?data=${compressed}`;
}

// ==================== Decompression ====================

export function decompressPrediction(compressed: string): SetlistPrediction {
  try {
    // Decompress
    const json = decompressFromEncodedURIComponent(compressed);

    if (!json) {
      throw new Error('Failed to decompress data');
    }

    const data: ShareData = JSON.parse(json);

    // Validate version
    if (data.v !== 1) {
      throw new Error(`Unsupported version: ${data.v}`);
    }

    // Reconstruct prediction
    const predictionId = generateId();
    const setlistId = generateSetlistId(data.p);

    const items: SetlistItem[] = data.i.map((item, idx) => {
      const baseItem = {
        id: generateId(),
        position: idx,
        remarks: item.r
      };

      if (item.s) {
        // Song item
        return {
          ...baseItem,
          type: 'song',
          songId: item.s,
          isCustomSong: item.cs || false,
          customSongName: item.cn
        } as SongSetlistItem;
      } else {
        // Non-song item
        return {
          ...baseItem,
          type: item.t as 'mc' | 'other',
          title: item.c || ''
        } as NonSongSetlistItem;
      }
    });

    const sections = data.sec.map((s) => ({
      name: s.n,
      startIndex: s.s,
      endIndex: s.e,
      type: s.t
    }));

    const songCount = items.filter((item) => item.type === 'song').length;

    return {
      id: predictionId,
      performanceId: data.p,
      customPerformance: data.cp
        ? {
            name: data.cp.n,
            venue: data.cp.v,
            date: data.cp.d
          }
        : undefined,
      name: data.n,
      setlist: {
        id: setlistId,
        performanceId: data.p,
        items,
        sections,
        totalSongs: songCount
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error decompressing prediction:', error);
    throw new Error('Invalid or corrupted share URL', { cause: error });
  }
}

export function parseShareUrl(shareUrl: string): SetlistPrediction {
  const url = new URL(shareUrl);
  const compressed = url.searchParams.get('data');

  if (!compressed) {
    throw new Error('Invalid share URL format');
  }

  return decompressPrediction(compressed);
}

// ==================== Size Estimation ====================

export function estimateShareUrlSize(prediction: SetlistPrediction): {
  compressed: number;
  uncompressed: number;
  ratio: number;
} {
  const minified: ShareData = {
    v: 1,
    p: prediction.performanceId,
    cp: compressCustomPerformance(prediction.customPerformance),
    n: prediction.name,
    i: prediction.setlist.items.map((item): ShareItem => {
      if (isSongItem(item)) {
        return {
          t: item.type,
          s: item.songId,
          r: item.remarks,
          cs: item.isCustomSong || undefined,
          cn: item.customSongName || undefined
        };
      } else {
        return {
          t: item.type,
          c: item.title,
          r: item.remarks
        };
      }
    }),
    sec: prediction.setlist.sections.map(
      (s): ShareSection => ({
        n: s.name,
        s: s.startIndex,
        e: s.endIndex,
        t: s.type
      })
    )
  };

  const json = JSON.stringify(minified);
  const compressed = compressToEncodedURIComponent(json);

  return {
    uncompressed: json.length,
    compressed: compressed.length,
    ratio: compressed.length / json.length
  };
}

export function canShareUrl(prediction: SetlistPrediction, maxLength: number = 2000): boolean {
  const { compressed } = estimateShareUrlSize(prediction);
  // Account for base URL length (estimate 50 chars)
  return compressed + 50 < maxLength;
}
