// Core Models for Setlist Prediction Feature

// ==================== Performance ====================

export interface Performance {
  id: string;
  tourName: string;
  performanceName?: string;
  date: string; // ISO 8601
  venue?: string;
  venueJa?: string;
  seriesIds: string[];
  artistIds?: string[];
  unitIds?: string[];

  // Data source
  source?: 'llfans' | 'custom';
  llfansId?: string;
  createdBy?: string; // Phase 2
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
  hasSetlist?: boolean;

  // Timestamps
  createdAt?: string;
  updatedAt?: string;
}

// ==================== Setlist Items ====================

export type SetlistItemType = 'song' | 'mc' | 'other' | 'custom' | 'vtr' | 'opening' | 'encore';

export interface BaseSetlistItem {
  id: string;
  type: SetlistItemType;
  position: number;
  remarks?: string;
  remarksJa?: string;
}

export interface SongSetlistItem extends BaseSetlistItem {
  type: 'song';
  songId: string;
  artistIds?: string[];
  isCustomSong?: boolean;
  customSongName?: string;
  customSongNameJa?: string;
}

export interface NonSongSetlistItem extends BaseSetlistItem {
  type: Exclude<SetlistItemType, 'song'>;
  title: string;
  titleJa?: string;
  duration?: number; // seconds
}

export type SetlistItem = SongSetlistItem | NonSongSetlistItem;

// ==================== Setlist ====================

export interface PerformanceSetlist {
  id: string;
  performanceId?: string; // Optional for custom predictions
  items: SetlistItem[];

  sections: {
    name: string;
    nameJa?: string;
    startIndex: number;
    endIndex: number;
    type?: 'main' | 'encore' | 'special';
  }[];

  estimatedDuration?: number; // minutes

  // For actual setlists
  isActual?: boolean;
  verifiedBy?: string; // Phase 2
  verifiedAt?: string;
  sourceUrl?: string;
}

// ==================== Custom Performance ====================

export interface CustomPerformance {
  name: string;
  venue?: string;
  date?: string; // ISO 8601
}

// ==================== Prediction ====================

export interface SetlistPrediction {
  id: string;
  userId?: string; // Phase 2
  performanceId?: string; // Optional for custom predictions
  customPerformance?: CustomPerformance; // For custom predictions (when performanceId is undefined)
  setlist: PerformanceSetlist;

  // Metadata
  name: string;
  nameJa?: string;
  description?: string;

  // Scoring
  score?: PredictionScore;

  // Status
  isLocked?: boolean;
  isPublic?: boolean; // Phase 2

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

// ==================== Scoring ====================

export interface PredictionScore {
  predictionId: string;

  totalScore: number;
  maxPossibleScore: number;
  accuracy: number; // 0-100

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

  itemScores: Array<
    | {
        itemId: string;
        matched: true;
        matchType: 'exact' | 'close' | 'present' | 'section';
        positionDiff: number;
        points: number;
        actualItemId: string;
      }
    | {
        itemId: string;
        matched: false;
        points: number;
      }
  >;

  globalRank?: number; // Phase 2
  friendsRank?: number; // Phase 2

  calculatedAt: string;
}

export interface ScoringRules {
  exactMatch: number;
  closeMatch: {
    points: number;
    range: number; // ±N positions
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

export const DEFAULT_SCORING_RULES: ScoringRules = {
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

// ==================== Save Slots ====================

export interface SaveSlot {
  slot: number;
  performanceId: string;
  predictions: string[]; // Prediction IDs
  activePredictionId?: string;
  lastModified: string;
}

export interface SaveSlotManager {
  slots: SaveSlot[];
  maxSlots: number; // default: 10
  currentSlot?: number;
}

// ==================== Extended Models ====================

export interface SongWithPredictionMeta {
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

// ==================== LocalStorage Schema ====================

export const STORAGE_KEYS = {
  PREDICTIONS: 'setlist-predictions-v1',
  ACTIVE_PREDICTION: 'active-prediction-id',
  SAVE_SLOTS: 'setlist-save-slots-v1',
  PERFORMANCE_CACHE: 'performance-cache-v1',
  SETTINGS: 'setlist-prediction-settings-v1',
  DRAFTS: 'setlist-prediction-drafts-v1'
} as const;

export interface LocalStorageSchema {
  [STORAGE_KEYS.PREDICTIONS]: Record<string, SetlistPrediction>;
  [STORAGE_KEYS.ACTIVE_PREDICTION]: string | null;
  [STORAGE_KEYS.SAVE_SLOTS]: SaveSlotManager;
  [STORAGE_KEYS.PERFORMANCE_CACHE]: Performance[];
  [STORAGE_KEYS.SETTINGS]: UserSettings;
  [STORAGE_KEYS.DRAFTS]: Record<string, SetlistPrediction>;
}

export interface UserSettings {
  defaultScoringRules: Partial<ScoringRules>;
  autosave: boolean;
  language: 'en' | 'ja';
  theme: 'light' | 'dark';
}

// ==================== Share Data Format ====================

export interface ShareCustomPerformance {
  n: string; // name
  v?: string; // venue
  d?: string; // date
}

export interface ShareData {
  v: number; // version
  p?: string; // performanceId (optional for custom predictions)
  cp?: ShareCustomPerformance; // customPerformance (for custom predictions)
  n: string; // prediction name
  i: ShareItem[]; // items
  sec: ShareSection[]; // sections
}

export interface ShareItem {
  t: SetlistItemType; // type
  s?: string; // songId (if song)
  c?: string; // custom name (if not song)
  r?: string; // remarks
  cs?: boolean; // isCustomSong (for custom songs)
  cn?: string; // customSongName (for custom songs)
}

export interface ShareSection {
  n: string; // name
  s: number; // startIndex
  e: number; // endIndex
  t?: 'main' | 'encore' | 'special'; // type
}

// ==================== Type Guards ====================

export function isSongItem(item: SetlistItem): item is SongSetlistItem {
  return item.type === 'song';
}

export function isNonSongItem(item: SetlistItem): item is NonSongSetlistItem {
  return !isSongItem(item);
}

export function isCustomSong(item: SongSetlistItem): boolean {
  return item.isCustomSong === true;
}

export function hasScore(
  prediction: SetlistPrediction
): prediction is SetlistPrediction & { score: PredictionScore } {
  return prediction.score !== undefined;
}

// ==================== Performance Filters ====================

export interface PerformanceFilters {
  seriesIds: string[];
  status: ('upcoming' | 'completed' | 'custom')[];
  dateRange?: {
    start?: string;
    end?: string;
  };
  search?: string;
}
