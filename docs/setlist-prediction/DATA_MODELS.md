# Data Models

> TypeScript interfaces and data structures for setlist prediction

## Core Models

### Performance

A single predictable performance event (mapped from LLFans Concert + Performance).

```typescript
interface Performance {
  id: string;
  name: string;
  nameJa?: string;
  date: string;                        // ISO 8601
  venue?: string;
  venueJa?: string;
  seriesIds: string[];
  artistIds: string[];
  unitIds?: string[];

  // Data source
  source: 'llfans' | 'custom';
  llfansId?: string;
  createdBy?: string;                  // Phase 2
  isPublic?: boolean;

  // Actual setlist (if performance happened)
  actualSetlist?: PerformanceSetlist;

  // Metadata
  imageUrl?: string;
  description?: string;
  descriptionJa?: string;
  tags?: string[];

  // Status
  status: 'upcoming' | 'completed' | 'custom';

  // Timestamps
  createdAt: string;
  updatedAt: string;
}
```

### Setlist Item Types

```typescript
type SetlistItemType =
  | 'song'
  | 'mc'
  | 'encore'
  | 'special'
  | 'vtr'
  | 'opening'
  | 'custom';

interface BaseSetlistItem {
  id: string;
  type: SetlistItemType;
  position: number;
  section?: string;
  remarks?: string;
  remarksJa?: string;
}

interface SongSetlistItem extends BaseSetlistItem {
  type: 'song' | 'encore';
  songId: string;
  artistIds?: string[];
  isCustomSong?: boolean;
  customSongName?: string;
  customSongNameJa?: string;
}

interface NonSongSetlistItem extends BaseSetlistItem {
  type: Exclude<SetlistItemType, 'song' | 'encore'>;
  title: string;
  titleJa?: string;
  duration?: number;                   // seconds
}

type SetlistItem = SongSetlistItem | NonSongSetlistItem;
```

### Performance Setlist

```typescript
interface PerformanceSetlist {
  id: string;
  performanceId: string;
  items: SetlistItem[];

  sections: {
    name: string;
    nameJa?: string;
    startIndex: number;
    endIndex: number;
    type?: 'main' | 'encore' | 'special';
  }[];

  totalSongs: number;
  estimatedDuration?: number;          // minutes

  // For actual setlists
  isActual?: boolean;
  verifiedBy?: string;                 // Phase 2
  verifiedAt?: string;
  sourceUrl?: string;
}
```

### Setlist Prediction

```typescript
interface SetlistPrediction {
  id: string;
  userId?: string;                     // Phase 2
  performanceId: string;
  setlist: PerformanceSetlist;

  // Metadata
  name: string;
  nameJa?: string;
  description?: string;

  // Scoring
  score?: PredictionScore;

  // Status
  isLocked?: boolean;
  isPublic?: boolean;                  // Phase 2

  // Collaboration (Phase 2)
  collaborators?: string[];

  // Timestamps
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;

  // Local storage
  slot?: number;
  isFavorite?: boolean;
}
```

### Prediction Score

```typescript
interface PredictionScore {
  predictionId: string;

  totalScore: number;
  maxPossibleScore: number;
  accuracy: number;                    // 0-100

  breakdown: {
    exactMatches: number;
    exactMatchPoints: number;

    closeMatches: number;
    closeMatchPoints: number;

    presentMatches: number;
    presentMatchPoints: number;

    sectionMatches: number;
    sectionMatchPoints: number;

    missedSongs: number;
    extraSongs: number;

    bonusPoints: {
      openingSong?: number;
      closingSong?: number;
      encoreBreak?: number;
      doubleEncoreBreak?: number;
      specialPerformance?: number;
    };
  };

  itemScores: {
    itemId: string;
    matched: boolean;
    matchType?: 'exact' | 'close' | 'present' | 'section';
    positionDiff?: number;
    points: number;
    actualItemId?: string;
  }[];

  globalRank?: number;                 // Phase 2
  friendsRank?: number;                // Phase 2

  calculatedAt: string;
}
```

### Save Slot Management

```typescript
interface SaveSlot {
  slot: number;
  performanceId: string;
  predictions: string[];               // Prediction IDs
  activePredictionId?: string;
  lastModified: string;
}

interface SaveSlotManager {
  slots: SaveSlot[];
  maxSlots: number;                    // default: 10
  currentSlot?: number;
}
```

## Extended Models

### Song with Prediction Metadata

```typescript
interface SongWithPredictionMeta extends Song {
  performanceHistory?: {
    performanceId: string;
    position: number;
    section: string;
    date: string;
  }[];

  predictionStats?: {
    timesPerformed: number;
    averagePosition: number;
    mostCommonSection: string;
    popularityScore: number;
  };
}
```

### Performance History Cache

```typescript
interface PerformanceHistoryCache {
  songId: string;
  performances: {
    id: string;
    name: string;
    date: string;
    position: number;
    section: string;
    artistIds: string[];
  }[];
  lastUpdated: string;
}
```

## Scoring Configuration

```typescript
interface ScoringRules {
  exactMatch: number;
  closeMatch: {
    points: number;
    range: number;                     // ±N positions
  };
  presentMatch: number;
  sectionMatch: number;

  bonuses: {
    openingSong: number;
    closingSong: number;
    encoreBreak: number;
    doubleEncoreBreak: number;
    specialPerformance: number;
  };

  penalties?: {
    missedSong: number;
    extraSong: number;
  };

  sectionMultipliers?: {
    main: number;
    encore: number;
    doubleEncore: number;
  };
}

const DEFAULT_SCORING_RULES: ScoringRules = {
  exactMatch: 15,
  closeMatch: { points: 8, range: 2 },
  presentMatch: 3,
  sectionMatch: 5,
  bonuses: {
    openingSong: 5,
    closingSong: 5,
    encoreBreak: 5,
    doubleEncoreBreak: 5,
    specialPerformance: 3
  },
  sectionMultipliers: {
    main: 1.0,
    encore: 1.2,
    doubleEncore: 1.5
  }
};
```

## Type Guards

```typescript
function isSongItem(item: SetlistItem): item is SongSetlistItem {
  return item.type === 'song' || item.type === 'encore';
}

function isNonSongItem(item: SetlistItem): item is NonSongSetlistItem {
  return !isSongItem(item);
}

function isCustomSong(item: SongSetlistItem): boolean {
  return item.isCustomSong === true;
}

function hasScore(prediction: SetlistPrediction): prediction is SetlistPrediction & { score: PredictionScore } {
  return prediction.score !== undefined;
}
```

## LocalStorage Schema

```typescript
const STORAGE_KEYS = {
  PREDICTIONS: 'setlist-predictions-v1',
  ACTIVE_PREDICTION: 'active-prediction-id',
  SAVE_SLOTS: 'setlist-save-slots-v1',
  PERFORMANCE_CACHE: 'performance-cache-v1',
  HISTORY_CACHE: 'song-history-cache-v1',
  SETTINGS: 'setlist-prediction-settings-v1',
  DRAFTS: 'setlist-prediction-drafts-v1',
} as const;

interface LocalStorageSchema {
  [STORAGE_KEYS.PREDICTIONS]: Record<string, SetlistPrediction>;
  [STORAGE_KEYS.ACTIVE_PREDICTION]: string | null;
  [STORAGE_KEYS.SAVE_SLOTS]: SaveSlotManager;
  [STORAGE_KEYS.PERFORMANCE_CACHE]: Performance[];
  [STORAGE_KEYS.HISTORY_CACHE]: Record<string, PerformanceHistoryCache>;
  [STORAGE_KEYS.SETTINGS]: UserSettings;
  [STORAGE_KEYS.DRAFTS]: Record<string, SetlistPrediction>;
}

interface UserSettings {
  defaultScoringRules: Partial<ScoringRules>;
  autosave: boolean;
  language: 'en' | 'ja';
  theme: 'light' | 'dark';
}
```

## Share Data Format

```typescript
interface ShareData {
  v: number;                           // version
  p: string;                           // performanceId
  n: string;                           // prediction name
  i: ShareItem[];                      // items
  sec: ShareSection[];                 // sections
}

interface ShareItem {
  t: SetlistItemType;                  // type
  s?: string;                          // songId (if song)
  c?: string;                          // custom name (if not song)
  r?: string;                          // remarks
  sec?: string;                        // section
}

interface ShareSection {
  n: string;                           // name
  s: number;                           // startIndex
  e: number;                           // endIndex
  t?: 'main' | 'encore' | 'special';   // type
}
```

## Example Usage

### Creating a Prediction

```typescript
const prediction: SetlistPrediction = {
  id: generateId(),
  performanceId: '655',
  name: 'My Optimistic Prediction',
  setlist: {
    id: generateId(),
    performanceId: '655',
    items: [
      {
        id: generateId(),
        type: 'song',
        position: 0,
        songId: '502',
        section: 'Main'
      },
      {
        id: generateId(),
        type: 'mc',
        position: 1,
        title: 'MC①',
        section: 'Main'
      },
      // ... more items
    ],
    sections: [
      {
        name: 'Main',
        startIndex: 0,
        endIndex: 15,
        type: 'main'
      },
      {
        name: 'Encore',
        startIndex: 16,
        endIndex: 20,
        type: 'encore'
      }
    ],
    totalSongs: 18
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};
```

### Scoring a Prediction

```typescript
const score: PredictionScore = {
  predictionId: prediction.id,
  totalScore: 145,
  maxPossibleScore: 200,
  accuracy: 72.5,
  breakdown: {
    exactMatches: 5,
    exactMatchPoints: 75,
    closeMatches: 3,
    closeMatchPoints: 24,
    presentMatches: 4,
    presentMatchPoints: 12,
    sectionMatches: 2,
    sectionMatchPoints: 10,
    missedSongs: 2,
    extraSongs: 1,
    bonusPoints: {
      openingSong: 5,
      encoreBreak: 5
    }
  },
  itemScores: [/* ... */],
  calculatedAt: new Date().toISOString()
};
```

## Validation

```typescript
function validatePrediction(prediction: SetlistPrediction): boolean {
  // Check required fields
  if (!prediction.id || !prediction.performanceId) return false;
  if (!prediction.setlist || prediction.setlist.items.length === 0) return false;

  // Check item positions
  const positions = prediction.setlist.items.map(i => i.position);
  const hasGaps = positions.some((p, i) => i > 0 && p !== positions[i - 1] + 1);
  if (hasGaps) return false;

  // Check song IDs exist
  for (const item of prediction.setlist.items) {
    if (isSongItem(item) && !item.isCustomSong) {
      const song = getSong(item.songId);
      if (!song) return false;
    }
  }

  return true;
}
```

## Next Steps

- See [LLFans Integration](./LLFANS_INTEGRATION.md) for mapping from LLFans data
- See [Scoring System](./SCORING_SYSTEM.md) for scoring algorithm details
- See [Technical Architecture](./TECHNICAL_ARCHITECTURE.md) for implementation

---

**Key Takeaway**: Simple, flexible data models that work offline and can extend to multiplayer later. 🎯
