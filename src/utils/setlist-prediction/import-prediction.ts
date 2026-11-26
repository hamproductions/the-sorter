import { parseActualSetlist } from './import';
import type {
  Performance,
  PerformanceSetlist,
  SetlistPrediction,
  SetlistItem,
  SongSetlistItem,
  NonSongSetlistItem
} from '~/types/setlist-prediction';
import { getFullPerformanceName } from '~/utils/names';

export function createPredictionFromText(
  textInput: string,
  performanceId: string | undefined
): SetlistPrediction {
  const parsed = parseActualSetlist(textInput);

  // Convert to prediction - create proper SetlistItem objects
  return {
    id: `pred-${Date.now()}`,
    performanceId,
    name: 'Imported Prediction',
    setlist: {
      id: `setlist-${Date.now()}`,
      performanceId,
      items: parsed.items.map((item, idx) => {
        const id = `item-${Date.now()}-${idx}`;
        const position = idx;

        // Check if this is a divider (contains ━━, ---, or ===)
        const isDivider =
          item.title &&
          (item.title.includes('━━') || item.title.includes('---') || item.title.includes('==='));

        // For dividers: always create as other items
        if (isDivider) {
          return {
            id,
            position,
            type: 'other' as const,
            title: item.title || '',
            remarks: item.remarks
          };
        }

        // For songs: create custom songs with the title
        if (item.type === 'song') {
          return {
            id,
            position,
            type: 'song' as const,
            songId: '', // Will be set when user matches to actual song
            isCustomSong: true,
            customSongName: item.title || 'Unknown Song',
            remarks: item.remarks
          };
        }

        // For non-song items: map to 'mc' or 'other'
        const nonSongType = item.type === 'mc' ? 'mc' : 'other';
        return {
          id,
          position,
          type: nonSongType,
          title: item.title || '',
          remarks: item.remarks
        };
      }),
      sections: [],
      isActual: true
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

export function createPredictionFromSetlist(
  selectedSetlist: PerformanceSetlist,
  selectedPerformance: Performance | undefined,
  performanceId: string | undefined
): SetlistPrediction {
  // Find encore section from sections array
  const encoreSection = selectedSetlist.sections?.find(
    (s) => s.type === 'encore' || s.name.toLowerCase().includes('encore')
  );
  const encoreStartIndex = encoreSection?.startIndex ?? -1;

  // Find intermission/break sections from sections array
  const intermissionSection = selectedSetlist.sections?.find((s) => {
    const name = s.name.toLowerCase();
    return (
      name.includes('intermission') ||
      name.includes('break') ||
      name.includes('interval') ||
      s.type === 'special'
    );
  });
  const intermissionStartIndex = intermissionSection?.startIndex ?? -1;

  // Transform the actual setlist from the selected performance
  const transformedItems: SetlistItem[] = [];
  let encoreDividerInserted = false;
  let intermissionDividerInserted = false;

  selectedSetlist.items.forEach((item, index) => {
    // Insert intermission divider before first intermission item
    if (
      intermissionStartIndex >= 0 &&
      index === intermissionStartIndex &&
      !intermissionDividerInserted
    ) {
      transformedItems.push({
        id: `item-${Date.now()}-intermission-${transformedItems.length}`,
        type: 'other',
        title: '━━ INTERMISSION ━━',
        position: transformedItems.length
      });
      intermissionDividerInserted = true;
    }

    // Insert encore divider before first encore item
    if (encoreStartIndex >= 0 && index === encoreStartIndex && !encoreDividerInserted) {
      transformedItems.push({
        id: `item-${Date.now()}-encore-${transformedItems.length}`,
        type: 'other',
        title: '━━ ENCORE ━━',
        position: transformedItems.length
      });
      encoreDividerInserted = true;
    }

    // Map item types
    if (item.type === 'song') {
      const songItem = item as SongSetlistItem;
      // Songs: use songId to let the system look up the actual song name
      transformedItems.push({
        id: `item-${Date.now()}-${transformedItems.length}`,
        type: 'song' as const,
        songId: songItem.songId || '',
        customSongName: songItem.customSongName, // Preserve original name as fallback
        remarks: songItem.remarks,
        position: transformedItems.length
      });
    } else if (item.type === 'mc') {
      const mcItem = item as NonSongSetlistItem;
      // MC items stay as MC
      transformedItems.push({
        id: `item-${Date.now()}-${transformedItems.length}`,
        type: 'mc',
        title: mcItem.title || 'MC',
        remarks: mcItem.remarks,
        position: transformedItems.length
      });
    } else {
      const otherItem = item as NonSongSetlistItem;
      // Other types map to 'other'
      transformedItems.push({
        id: `item-${Date.now()}-${transformedItems.length}`,
        type: 'other',
        title: otherItem.title || 'Other',
        remarks: otherItem.remarks,
        position: transformedItems.length
      });
    }
  });

  return {
    id: `pred-${Date.now()}`,
    performanceId,
    name: `Imported from ${selectedPerformance ? getFullPerformanceName(selectedPerformance) : 'Unknown'}`,
    setlist: {
      id: `setlist-${Date.now()}`,
      performanceId,
      items: transformedItems,
      sections: []
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}
