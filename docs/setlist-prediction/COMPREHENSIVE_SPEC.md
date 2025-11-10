# Setlist Prediction Feature - Comprehensive Specification

## Table of Contents
1. [Feature Overview](#feature-overview)
2. [Data Models & Schema](#data-models--schema)
3. [User Flows & Interactions](#user-flows--interactions)
4. [UI Components & Layout](#ui-components--layout)
5. [Technical Architecture](#technical-architecture)
6. [Phased Implementation Plan](#phased-implementation-plan)
7. [Integration with Existing Codebase](#integration-with-existing-codebase)
8. [Localization Requirements](#localization-requirements)
9. [Storage & Persistence Strategy](#storage--persistence-strategy)
10. [Import/Export Specifications](#importexport-specifications)
11. [Scoring System Design](#scoring-system-design)
12. [Future-Proofing & Extensibility](#future-proofing--extensibility)
13. [Spicy Feature Ideas](#spicy-feature-ideas)

---

## Feature Overview

### Goal
Create a "fantasy football"-style setlist prediction system where users can predict song setlists for Love Live! performances and compete with others based on accuracy.

### Core Concept
- Users select an upcoming or past performance (live event)
- Build a predicted setlist by searching/selecting songs
- Optionally add non-song items (MC segments, special performances)
- Compare predictions with actual setlists for scoring
- Share predictions and compete on leaderboards

### Key Differentiators
- **Data-driven**: All sourced from LLFans (artists, performances, units)
- **Flexible**: Support custom performances and user-created events
- **Social**: Share predictions, compare with friends, leaderboards
- **Comprehensive**: Handle complex setlist structures (encores, special segments)
- **Iterative**: Built in phases with clear upgrade paths

---

## Data Models & Schema

### 1. Performance (Live Event)

```typescript
interface Performance {
  id: string;                          // Unique identifier
  name: string;                        // Performance name (e.g., "AZALEA 1st LoveLive!")
  nameJa?: string;                     // Japanese name
  date: string;                        // ISO 8601 date (e.g., "2017-08-05")
  venue?: string;                      // Venue name
  venueJa?: string;                    // Japanese venue name
  seriesIds: string[];                 // Related series IDs
  artistIds: string[];                 // Performing artist IDs
  unitIds?: string[];                  // Performing unit IDs

  // Data source tracking
  source: 'llfans' | 'custom';         // Where this performance came from
  llfansId?: string;                   // Original LLFans ID if applicable
  createdBy?: string;                  // User ID if custom (for Phase 2)
  isPublic?: boolean;                  // Can others use this custom performance?

  // Actual setlist (if performance has occurred)
  actualSetlist?: PerformanceSetlist;  // Actual setlist for scoring

  // Metadata
  imageUrl?: string;                   // Performance poster/image
  description?: string;                // Additional details
  descriptionJa?: string;
  tags?: string[];                     // Custom tags

  // Status
  status: 'upcoming' | 'completed' | 'custom';

  // Timestamps
  createdAt: string;                   // ISO 8601
  updatedAt: string;                   // ISO 8601
}
```

### 2. Setlist Item

```typescript
type SetlistItemType =
  | 'song'                             // Regular song performance
  | 'mc'                               // MC segment
  | 'encore'                           // Encore song
  | 'special'                          // Special performance
  | 'vtr'                              // Video/VTR
  | 'opening'                          // Opening act
  | 'custom';                          // Custom type

interface BaseSetlistItem {
  id: string;                          // Unique item ID
  type: SetlistItemType;
  position: number;                    // Order in setlist (0-indexed)
  section?: string;                    // Section name (e.g., "Main", "Encore", "Double Encore")
  remarks?: string;                    // User notes/remarks
  remarksJa?: string;
}

interface SongSetlistItem extends BaseSetlistItem {
  type: 'song' | 'encore';
  songId: string;                      // Reference to song in database
  artistIds?: string[];                // Override if different from song default
  isCustomSong?: boolean;              // True if song not in database
  customSongName?: string;             // For free-input songs
  customSongNameJa?: string;
}

interface NonSongSetlistItem extends BaseSetlistItem {
  type: Exclude<SetlistItemType, 'song' | 'encore'>;
  title: string;                       // Description of item
  titleJa?: string;
  duration?: number;                   // Optional duration in seconds
}

type SetlistItem = SongSetlistItem | NonSongSetlistItem;
```

### 3. Setlist (Prediction or Actual)

```typescript
interface PerformanceSetlist {
  id: string;                          // Unique setlist ID
  performanceId: string;               // Reference to Performance
  items: SetlistItem[];                // Ordered list of items

  // Sections for organization
  sections: {
    name: string;                      // Section name
    nameJa?: string;
    startIndex: number;                // Starting position in items array
    endIndex: number;                  // Ending position
    type?: 'main' | 'encore' | 'special'; // Section type for scoring
  }[];

  // Metadata
  totalSongs: number;                  // Calculated count of song items
  estimatedDuration?: number;          // In minutes

  // For actual setlists
  isActual?: boolean;                  // True if this is the actual setlist
  verifiedBy?: string;                 // User who verified (Phase 2)
  verifiedAt?: string;                 // ISO 8601
  sourceUrl?: string;                  // Reference URL
}
```

### 4. Prediction (User's Setlist Prediction)

```typescript
interface SetlistPrediction {
  id: string;                          // Unique prediction ID
  userId?: string;                     // User ID (Phase 2, optional for Phase 1)
  performanceId: string;               // Reference to Performance

  // Setlist data
  setlist: PerformanceSetlist;         // The predicted setlist

  // Metadata
  name: string;                        // Prediction name (e.g., "My Prediction #1")
  nameJa?: string;
  description?: string;                // Notes about this prediction

  // Scoring (calculated after actual setlist is known)
  score?: PredictionScore;             // Null until performance is completed

  // Status
  isLocked?: boolean;                  // Lock after performance starts?
  isPublic?: boolean;                  // Shareable (Phase 2)

  // Collaboration (Phase 2)
  collaborators?: string[];            // User IDs who can edit

  // Timestamps
  createdAt: string;                   // ISO 8601
  updatedAt: string;                   // ISO 8601
  submittedAt?: string;                // When user finalized prediction

  // Local storage slot management
  slot?: number;                       // Save slot number (1-n)
  isFavorite?: boolean;                // Pin this prediction
}
```

### 5. Prediction Score

```typescript
interface PredictionScore {
  predictionId: string;

  // Overall score
  totalScore: number;
  maxPossibleScore: number;
  accuracy: number;                    // Percentage (0-100)

  // Detailed breakdown
  breakdown: {
    exactMatches: number;              // Songs in exact position
    exactMatchPoints: number;

    closeMatches: number;              // Songs within ±2 positions
    closeMatchPoints: number;

    presentMatches: number;            // Songs present but wrong position
    presentMatchPoints: number;

    sectionMatches: number;            // Songs in correct section
    sectionMatchPoints: number;

    missedSongs: number;               // Predicted but not performed
    extraSongs: number;                // Performed but not predicted

    // Bonus points
    bonusPoints: {
      openingSong?: number;            // Correctly predicted opener
      closingSong?: number;            // Correctly predicted closer
      encoreBreak?: number;            // Correctly predicted encore start
      specialPerformance?: number;     // Predicted special items
    };
  };

  // Item-by-item comparison
  itemScores: {
    itemId: string;                    // Predicted item ID
    matched: boolean;
    matchType?: 'exact' | 'close' | 'present' | 'section';
    positionDiff?: number;             // Difference from actual position
    points: number;
    actualItemId?: string;             // Matched actual item ID
  }[];

  // Ranking (Phase 2)
  globalRank?: number;
  friendsRank?: number;

  // Calculated at
  calculatedAt: string;                // ISO 8601
}
```

### 6. Save Slot Management

```typescript
interface SaveSlot {
  slot: number;                        // Slot number (1-n)
  performanceId: string;               // Performance this slot is for
  predictions: string[];               // Array of prediction IDs
  activePredictionId?: string;         // Currently active/editing
  lastModified: string;                // ISO 8601
}

interface SaveSlotManager {
  slots: SaveSlot[];
  maxSlots: number;                    // Configurable, default 10
  currentSlot?: number;                // Active slot
}
```

### 7. Extended Song Model

Extend existing `Song` type with prediction-specific fields:

```typescript
interface SongWithPredictionMeta extends Song {
  // Past performance data
  performanceHistory?: {
    performanceId: string;
    position: number;
    section: string;
    date: string;
  }[];

  // Prediction metadata
  predictionStats?: {
    timesPerformed: number;            // Count across all performances
    averagePosition: number;           // Average setlist position
    mostCommonSection: string;         // Usually main/encore/etc
    popularityScore: number;           // For suggestion algorithms
  };
}
```

### 8. Performance History Cache

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

---

## User Flows & Interactions

### Flow 1: Create New Prediction

```
1. User navigates to /setlist-prediction
2. See list of available performances (upcoming + past + custom)
   - Filter by: series, artist, date range, status
   - Search by name
3. Select a performance OR create custom performance
4. Create new prediction (auto-saves to slot)
5. Taken to prediction builder interface
```

### Flow 2: Build Setlist Prediction

```
1. Prediction Builder Screen
   ├─ Left Panel: Song Search & Selection
   │  ├─ Search bar (by song name)
   │  ├─ Filters (series, artist, type)
   │  ├─ Song results list
   │  └─ "Add custom song" button
   │
   ├─ Center Panel: Current Setlist
   │  ├─ Drag-and-drop reorder
   │  ├─ Section markers (Main, Encore, etc.)
   │  ├─ Position numbers
   │  ├─ Item actions: Edit, Delete, Add Remarks
   │  └─ Insert non-song items (MC, VTR, etc.)
   │
   └─ Right Panel: Context & Tools
      ├─ Performance info
      ├─ View past performances (history)
      ├─ Quick stats (total songs, duration estimate)
      ├─ Save/Load slots
      └─ Export/Share options

2. Adding Songs
   - Click song from search results → adds to end of setlist
   - Drag song from results → insert at specific position
   - Click "Add custom song" → modal to enter name manually
   - Click "Add MC/Special" → modal to select type and add details

3. Organizing Setlist
   - Drag items to reorder
   - Click "Add Section" to create section breaks
   - Click item to edit remarks/notes
   - Multi-select mode: Select multiple → bulk move/delete

4. Viewing Past Performances
   - Click "View History" for selected song
   - Modal shows all past performances of that song
   - Can copy entire past setlist as starting point
   - Click "Copy" on historical setlist → loads into current

5. Saving
   - Auto-saves to localStorage every change
   - Manual save to specific slot
   - Name predictions for organization
   - Mark as "favorite" to pin
```

### Flow 3: Marking Mode (Post-Performance)

```
1. After performance happens, user can enter marking mode
2. Import actual setlist (if available)
   - Paste from URL (LLFans)
   - Manual entry
   - JSON import
3. System auto-matches predicted items to actual
4. Marking Interface
   ├─ Side-by-side comparison
   │  ├─ Left: Prediction
   │  └─ Right: Actual setlist
   ├─ Color coding
   │  ├─ Green: Exact match
   │  ├─ Yellow: Close match
   │  ├─ Blue: Present but wrong position
   │  └─ Red: Missed / Wrong
   └─ Manual adjustment tools
      ├─ Link predicted item to actual
      ├─ Mark false positive
      └─ Add annotation
5. Calculate and display score
6. Option to submit to leaderboard (Phase 2)
```

### Flow 4: Multiple Predictions for Same Performance

```
1. From performance page, click "New Prediction"
2. See list of existing predictions for this performance
3. Options:
   - Create new blank prediction
   - Duplicate existing prediction
   - Create variant (fork from existing)
4. Switch between predictions using slot selector
5. Compare predictions side-by-side
   - Differences highlighted
   - Can merge elements from multiple predictions
```

### Flow 5: Share & Compare (Phase 1 - URL based)

```
1. Click "Share" button on prediction
2. System generates shareable URL with compressed data
3. Options:
   - Copy link
   - Generate QR code
   - Export as image/PNG
   - Export as JSON
4. Recipient opens link
   - View read-only prediction
   - Option to "Copy to my predictions"
   - View score (if available)
   - Compare with their own prediction (overlay)
```

### Flow 6: Collaborative Predictions (Phase 2)

```
1. Create prediction
2. Click "Share for collaboration"
3. Set permissions: View / Edit
4. Share link with collaborators
5. Real-time updates via Firebase
6. Conflict resolution for simultaneous edits
7. Activity log showing who changed what
```

### Flow 7: Custom Performance Creation

```
1. Click "Create Custom Performance"
2. Form to fill out:
   - Name (required)
   - Date (required)
   - Series/Artists (select from existing)
   - Venue
   - Description
   - Upload image
3. Mark as public (shareable) or private
4. Save and immediately start creating prediction
5. (Phase 2) Submit to community for others to use
```

---

## UI Components & Layout

### Component Hierarchy

```
SetlistPrediction (Route: /setlist-prediction)
├─ PerformanceSelector
│  ├─ PerformanceList
│  │  ├─ PerformanceCard
│  │  └─ PerformanceFilters
│  └─ CreateCustomPerformance
│
├─ PredictionBuilder (Main Interface)
│  ├─ SongSearchPanel
│  │  ├─ SearchBar
│  │  ├─ SongFilters
│  │  ├─ SongResultsList
│  │  │  └─ SongSearchCard (draggable)
│  │  └─ AddCustomSongButton
│  │
│  ├─ SetlistEditorPanel
│  │  ├─ SetlistHeader
│  │  │  ├─ PerformanceInfo
│  │  │  └─ SetlistStats
│  │  ├─ SectionManager
│  │  │  └─ SectionHeader (draggable)
│  │  ├─ SetlistItemsList (DnD)
│  │  │  ├─ SetlistItemCard (draggable)
│  │  │  │  ├─ SongItem
│  │  │  │  ├─ MCItem
│  │  │  │  └─ SpecialItem
│  │  │  └─ InsertItemButton
│  │  └─ SetlistActions
│  │     ├─ AddSectionButton
│  │     ├─ BulkActionsMenu
│  │     └─ ClearAllButton
│  │
│  └─ ContextPanel
│     ├─ PerformanceDetails
│     ├─ SongHistoryViewer
│     │  └─ PastPerformancesList
│     ├─ SaveSlotManager
│     │  ├─ SlotSelector
│     │  ├─ PredictionList
│     │  └─ SlotActions
│     └─ ExportShareTools
│        ├─ ExportButtons
│        └─ ShareButton
│
├─ MarkingMode
│  ├─ ComparisonView
│  │  ├─ PredictionColumn
│  │  ├─ ActualSetlistColumn
│  │  └─ MatchingLines (SVG overlay)
│  ├─ MarkingTools
│  │  ├─ LinkItemsButton
│  │  ├─ UnlinkButton
│  │  └─ AnnotationInput
│  └─ ScoreDisplay
│     ├─ TotalScore
│     ├─ ScoreBreakdown
│     └─ ItemScoreList
│
└─ SharedViews
   ├─ ViewSharedPrediction
   ├─ CompareMode (overlay two predictions)
   └─ LeaderboardView (Phase 2)
```

### Detailed Component Specs

#### 1. PerformanceCard
```typescript
interface PerformanceCardProps {
  performance: Performance;
  onSelect: (id: string) => void;
  predictionCount?: number;          // # of predictions user has
  showStatus?: boolean;              // Show upcoming/completed badge
  compact?: boolean;                 // Compact mode for lists
}
```

Visual Layout:
```
┌────────────────────────────────────┐
│ [Image]  AZALEA 1st LoveLive!     │
│          2017-08-05                │
│          Pacifico Yokohama         │
│          [AZALEA] [Aqours]         │
│          ⭐ 3 predictions          │
│          [Status Badge]            │
└────────────────────────────────────┘
```

#### 2. SetlistItemCard
```typescript
interface SetlistItemCardProps {
  item: SetlistItem;
  position: number;
  isSelected?: boolean;
  isDragging?: boolean;
  inMarkingMode?: boolean;
  matchStatus?: 'exact' | 'close' | 'present' | 'none';
  onEdit?: () => void;
  onDelete?: () => void;
  onToggleSelect?: () => void;
}
```

Visual Layout (Song Item):
```
┌────────────────────────────────────┐
│ [Drag] 01. SELF CONTROL!!          │
│ Handle     AZALEA                   │
│            ♪ 3:45  [Encore]        │
│            "High energy opener!"   │
│            [Edit] [Delete] [✓]     │
└────────────────────────────────────┘
```

Marking Mode Layout:
```
┌────────────────────────────────────┐
│ ✓ 01. SELF CONTROL!!  [Exact Match]│
│      AZALEA            +15 pts     │
│      Predicted: #1 / Actual: #1    │
└────────────────────────────────────┘
```

#### 3. SongSearchCard
```typescript
interface SongSearchCardProps {
  song: SongWithPredictionMeta;
  onAdd: (songId: string) => void;
  onViewHistory?: (songId: string) => void;
  showStats?: boolean;
  draggable?: boolean;
}
```

Visual Layout:
```
┌────────────────────────────────────┐
│ SELF CONTROL!!                     │
│ AZALEA • Aqours                    │
│ Released: 2016-10-26               │
│ ⭐ Performed 5 times (avg pos: #3) │
│ [+ Add] [History]                  │
└────────────────────────────────────┘
```

#### 4. SaveSlotManager
```typescript
interface SaveSlotManagerProps {
  performanceId: string;
  currentPredictionId?: string;
  onSelectPrediction: (id: string) => void;
  onCreateNew: () => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}
```

Visual Layout:
```
┌────────────────────────────────────┐
│ My Predictions                     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ ⭐ Realistic Prediction    [Active]│
│    Last edited: 2h ago     [⋯]    │
│                                     │
│   Optimistic Prediction    [Load] │
│    Last edited: 1d ago     [⋯]    │
│                                     │
│   Dream Setlist            [Load] │
│    Last edited: 3d ago     [⋯]    │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ [+ New Prediction]                 │
└────────────────────────────────────┘
```

#### 5. ComparisonView (Marking Mode)
```typescript
interface ComparisonViewProps {
  prediction: PerformanceSetlist;
  actual: PerformanceSetlist;
  matches: Map<string, string>;      // predicted ID → actual ID
  onLinkItems: (predId: string, actualId: string) => void;
  onUnlink: (predId: string) => void;
}
```

Visual Layout (Side-by-side):
```
┌─────────────────┬─────────────────┐
│ Your Prediction │ Actual Setlist  │
├─────────────────┼─────────────────┤
│ 1. Song A  [✓]──┼──1. Song A      │
│ 2. Song B  [~]──┼──3. Song B      │
│ 3. Song C  [✗]  │  2. Song D      │
│ 4. Song D  [✓]──┼──4. Song D      │
│ 5. Song E  [~]──┼──6. Song E      │
│                 │  5. Song F      │
└─────────────────┴─────────────────┘
Score: 42/60 (70%)
```

#### 6. ScoreDisplay
```typescript
interface ScoreDisplayProps {
  score: PredictionScore;
  detailed?: boolean;
  showLeaderboard?: boolean;         // Phase 2
}
```

Visual Layout:
```
┌────────────────────────────────────┐
│        Your Score: 42/60           │
│          Accuracy: 70%             │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ ✓ Exact Matches:  2 songs (+30 pts)│
│ ~ Close Matches:  3 songs (+18 pts)│
│ ◦ Present:        2 songs (+8 pts) │
│ ✗ Missed:         2 songs          │
│ + Extra:          1 song           │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ 🎁 Bonus Points:                   │
│   Opening Song: +5                 │
│   Encore Break: +5                 │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ Global Rank: #42 / 156             │
│ [View Details] [Share Score]       │
└────────────────────────────────────┘
```

### Layout Modes

#### Desktop Layout (3-Panel)
```
┌──────────────────────────────────────────────────┐
│ Header: Performance Name | [Save] [Export] [?]   │
├────────┬─────────────────────────┬───────────────┤
│        │                         │               │
│ Song   │   Setlist Editor        │   Context     │
│ Search │   (Drag & Drop)         │   Panel       │
│ Panel  │                         │               │
│        │   1. Song A             │   Performance │
│ [?]    │   2. Song B             │   Details     │
│ Search │   3. MC                 │               │
│        │   ━━ Encore ━━          │   [History]   │
│ Filter │   4. Song C             │   [Slots]     │
│        │   5. Song D             │   [Export]    │
│        │                         │               │
│ Songs  │   [+ Add Item]          │               │
│        │                         │               │
│ [...]  │                         │               │
│        │                         │               │
└────────┴─────────────────────────┴───────────────┘
```

#### Mobile Layout (Stacked with Tabs)
```
┌──────────────────────────┐
│ Performance Name         │
│ [☰] [Save] [Share]       │
├──────────────────────────┤
│ [Search] [Setlist] [ⓘ]  │ ← Tabs
├──────────────────────────┤
│                          │
│   Current Tab Content    │
│                          │
│   (Full width)           │
│                          │
│                          │
│                          │
│                          │
│                          │
└──────────────────────────┘

Footer: [+ Add Song] [+ Add MC]
```

---

## Technical Architecture

### Directory Structure

```
src/
├── pages/
│   └── setlist-prediction/
│       ├── +Page.tsx                    # Main route
│       ├── +Layout.tsx                  # Layout wrapper
│       ├── +config.ts                   # Route config
│       ├── index/                       # Performance selector
│       │   └── +Page.tsx
│       ├── builder/                     # Prediction builder
│       │   ├── +Page.tsx
│       │   └── [predictionId]/
│       │       └── +Page.tsx
│       ├── marking/                     # Marking mode
│       │   └── [predictionId]/
│       │       └── +Page.tsx
│       └── view/                        # View shared prediction
│           └── [shareId]/
│               └── +Page.tsx
│
├── components/
│   └── setlist-prediction/
│       ├── performance/
│       │   ├── PerformanceCard.tsx
│       │   ├── PerformanceList.tsx
│       │   ├── PerformanceFilters.tsx
│       │   └── CreatePerformanceModal.tsx
│       │
│       ├── builder/
│       │   ├── PredictionBuilder.tsx     # Main container
│       │   ├── SongSearchPanel.tsx
│       │   ├── SetlistEditorPanel.tsx
│       │   ├── ContextPanel.tsx
│       │   │
│       │   ├── song-search/
│       │   │   ├── SongSearchCard.tsx
│       │   │   ├── SongFilters.tsx
│       │   │   └── CustomSongModal.tsx
│       │   │
│       │   ├── setlist-editor/
│       │   │   ├── SetlistItem.tsx
│       │   │   ├── SectionHeader.tsx
│       │   │   ├── InsertItemMenu.tsx
│       │   │   └── BulkActionsMenu.tsx
│       │   │
│       │   └── context/
│       │       ├── PerformanceDetails.tsx
│       │       ├── SongHistoryModal.tsx
│       │       ├── SaveSlotManager.tsx
│       │       └── ExportShareTools.tsx
│       │
│       ├── marking/
│       │   ├── MarkingMode.tsx
│       │   ├── ComparisonView.tsx
│       │   ├── ScoreDisplay.tsx
│       │   ├── ScoreBreakdown.tsx
│       │   └── ActualSetlistImporter.tsx
│       │
│       ├── shared/
│       │   ├── SetlistDisplay.tsx        # Read-only setlist view
│       │   ├── PredictionCard.tsx
│       │   └── CompareOverlay.tsx
│       │
│       └── common/
│           ├── ItemTypeSelector.tsx
│           ├── SectionManager.tsx
│           └── DurationEstimator.tsx
│
├── hooks/
│   └── setlist-prediction/
│       ├── usePredictionBuilder.ts       # Main builder state
│       ├── usePerformanceData.ts         # Fetch performances
│       ├── useSongSearch.ts              # Song search logic
│       ├── useSetlistDragDrop.ts         # DnD logic
│       ├── usePredictionStorage.ts       # LocalStorage management
│       ├── useSaveSlots.ts               # Save slot management
│       ├── usePredictionScoring.ts       # Scoring calculations
│       ├── useSongHistory.ts             # Past performances
│       ├── useSharePrediction.ts         # Share/export logic
│       └── usePerformanceHistory.ts      # Performance history cache
│
├── utils/
│   └── setlist-prediction/
│       ├── scoring.ts                    # Score calculation engine
│       ├── matching.ts                   # Match predicted to actual
│       ├── validation.ts                 # Validate setlist data
│       ├── export.ts                     # Export logic (PNG, JSON, etc.)
│       ├── import.ts                     # Import logic
│       ├── compression.ts                # URL compression (lz-string)
│       ├── duration.ts                   # Duration estimation
│       └── history-builder.ts            # Build song performance history
│
├── types/
│   └── setlist-prediction.ts            # All TypeScript interfaces
│
└── data/
    └── performances/
        ├── performances.json             # Performance database
        ├── performance-history.json      # Song performance history
        └── raw/
            └── llfans-performances.json  # Raw data from LLFans
```

### State Management Strategy

#### 1. Prediction Builder State

Use custom hook `usePredictionBuilder`:

```typescript
interface PredictionBuilderState {
  // Core data
  performance: Performance | null;
  prediction: SetlistPrediction;

  // UI state
  selectedItems: Set<string>;
  isMultiSelectMode: boolean;
  isDirty: boolean;

  // Actions
  addSong: (songId: string, position?: number) => void;
  addCustomSong: (name: string, position?: number) => void;
  addNonSongItem: (item: Omit<NonSongSetlistItem, 'id'>) => void;
  removeItem: (itemId: string) => void;
  reorderItems: (fromIndex: number, toIndex: number) => void;
  updateItem: (itemId: string, updates: Partial<SetlistItem>) => void;

  // Section management
  addSection: (name: string, position: number) => void;
  removeSection: (sectionName: string) => void;
  updateSection: (oldName: string, newName: string) => void;

  // Selection
  toggleSelect: (itemId: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  deleteSelected: () => void;

  // Persistence
  save: () => Promise<void>;
  load: (predictionId: string) => Promise<void>;
  autosave: boolean;
}
```

#### 2. localStorage Schema

```typescript
// Keys
const STORAGE_KEYS = {
  PREDICTIONS: 'setlist-predictions',             // All predictions
  ACTIVE_PREDICTION: 'active-prediction-id',     // Currently editing
  SAVE_SLOTS: 'setlist-save-slots',              // Slot management
  PERFORMANCE_CACHE: 'performance-cache',         // Cached performances
  HISTORY_CACHE: 'song-history-cache',           // Song performance history
  SETTINGS: 'setlist-prediction-settings',        // User preferences
  DRAFTS: 'setlist-prediction-drafts',           // Auto-save drafts
} as const;

// Storage structure
interface LocalStorageSchema {
  [STORAGE_KEYS.PREDICTIONS]: Record<string, SetlistPrediction>;
  [STORAGE_KEYS.ACTIVE_PREDICTION]: string | null;
  [STORAGE_KEYS.SAVE_SLOTS]: SaveSlotManager;
  [STORAGE_KEYS.PERFORMANCE_CACHE]: Performance[];
  [STORAGE_KEYS.HISTORY_CACHE]: Record<string, PerformanceHistoryCache>;
  [STORAGE_KEYS.SETTINGS]: UserSettings;
  [STORAGE_KEYS.DRAFTS]: Record<string, SetlistPrediction>;
}
```

#### 3. Drag and Drop Architecture

Use `@dnd-kit` (already in project):

```typescript
// Main DnD setup
function SetlistEditorPanel() {
  const [items, setItems] = useState<SetlistItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor),
    useSensor(TouchSensor)
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex(i => i.id === active.id);
        const newIndex = items.findIndex(i => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }

    setActiveId(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        {items.map(item => (
          <SortableSetlistItem key={item.id} item={item} />
        ))}
      </SortableContext>
      <DragOverlay>
        {activeId ? <SetlistItemCard item={findItem(activeId)} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
```

Support drag from search results:

```typescript
// Draggable song from search
function DraggableSongCard({ song }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `song-${song.id}`,
    data: { type: 'song', songId: song.id }
  });

  return (
    <div ref={setNodeRef} {...attributes} {...listeners}>
      <SongSearchCard song={song} />
    </div>
  );
}

// Drop zone in setlist editor
function SetlistDropZone({ onDrop, position }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `drop-${position}`,
    data: { type: 'position', position }
  });

  return (
    <div ref={setNodeRef} className={isOver ? 'drop-active' : ''}>
      {/* Drop indicator */}
    </div>
  );
}
```

---

## Phased Implementation Plan

### Phase 1: Core Functionality (MVP) - No Backend

**Goal**: Fully functional prediction system with local storage only

#### 1.1 Data Setup
- [ ] Create `performances.json` data file
  - Extract from LLFans or create initial dataset
  - Include past performances with actual setlists
- [ ] Create `performance-history.json`
  - Map songs to performances
  - Calculate statistics (avg position, frequency)
- [ ] Extend existing song/artist types with prediction metadata
- [ ] Create TypeScript interfaces for all new types

#### 1.2 Performance Selection
- [ ] Create performance list page
- [ ] Implement performance filters (series, artist, date, status)
- [ ] Create PerformanceCard component
- [ ] Implement custom performance creation modal
- [ ] Add performance image support

#### 1.3 Prediction Builder - Basic
- [ ] Create 3-panel layout (responsive)
- [ ] Implement song search with filters
- [ ] Create draggable song cards
- [ ] Build setlist editor with drag-and-drop
- [ ] Add song items to setlist
- [ ] Implement reordering
- [ ] Add delete functionality
- [ ] Implement auto-save to localStorage

#### 1.4 Custom Items & Sections
- [ ] Add non-song item types (MC, VTR, Special)
- [ ] Create add item modal/menu
- [ ] Implement section markers
- [ ] Section header component
- [ ] Assign items to sections
- [ ] Visual section dividers

#### 1.5 Remarks & Customization
- [ ] Add remarks field to setlist items
- [ ] Inline editing for remarks
- [ ] Custom song name input
- [ ] Japanese name support

#### 1.6 Save Slot Management
- [ ] Implement SaveSlotManager
- [ ] Multiple predictions per performance
- [ ] Save/load/delete predictions
- [ ] Naming predictions
- [ ] Favorite/pin predictions
- [ ] Slot selector UI
- [ ] Duplicate prediction feature

#### 1.7 Song History Viewer
- [ ] Build performance history cache
- [ ] "View History" modal for songs
- [ ] Display past performances in table
- [ ] "Copy setlist" feature
- [ ] Link to original performances

#### 1.8 Export & Share (Phase 1 - Local)
- [ ] Export as JSON
- [ ] Export as text (clipboard)
- [ ] Export as PNG image
  - Reuse existing `modern-screenshot` implementation
  - Custom rendering for setlist display
- [ ] Generate shareable URL
  - Compress prediction data with lz-string
  - Create `/setlist-prediction/view/:shareId` route
- [ ] QR code generation
- [ ] View shared prediction (read-only)

#### 1.9 Marking Mode & Scoring
- [ ] Import actual setlist
  - Manual entry form
  - JSON import
  - Copy from existing performance
- [ ] Implement matching algorithm
  - Auto-match songs by ID
  - Fuzzy match for custom songs
  - Manual linking UI
- [ ] Build scoring engine
  - Configurable scoring rules
  - Exact/close/present calculations
  - Section bonuses
  - Special bonuses (opener, closer, encore)
- [ ] Create ComparisonView component
  - Side-by-side layout
  - Visual matching lines
  - Color-coded matches
- [ ] ScoreDisplay component
  - Total score and accuracy
  - Detailed breakdown
  - Item-by-item scores
- [ ] Export score as image

#### 1.10 Localization
- [ ] Add translation keys to en.json
- [ ] Add translation keys to ja.json
- [ ] Ensure all UI text is localized
- [ ] Support Japanese names for performances, songs, items

#### 1.11 Polish & UX
- [ ] Loading states
- [ ] Error handling
- [ ] Toast notifications
- [ ] Confirmation dialogs
- [ ] Keyboard shortcuts
- [ ] Undo/redo support (reuse existing history pattern)
- [ ] Help/tutorial modal
- [ ] Empty states
- [ ] Responsive design testing
- [ ] Performance optimization

**Deliverable**: Fully functional setlist prediction with local storage, export, and scoring.

---

### Phase 2: Multiplayer & Social Features - Backend Integration

**Goal**: Add user accounts, collaboration, leaderboards

#### 2.1 Backend Setup
- [ ] Choose backend (Firebase, Supabase, or custom)
- [ ] Set up authentication
  - Email/password
  - Social logins (Google, Twitter)
  - Anonymous accounts (convert to full later)
- [ ] Design database schema
  - Users
  - Predictions (with ownership)
  - Performances (user-created)
  - Scores
  - Leaderboards

#### 2.2 User Accounts
- [ ] Login/signup flow
- [ ] User profile page
- [ ] Settings page
- [ ] Migration: Import local predictions to account

#### 2.3 Cloud Sync
- [ ] Sync predictions to cloud
- [ ] Conflict resolution (local vs cloud)
- [ ] Offline support with sync on reconnect
- [ ] Device sync

#### 2.4 Collaborative Predictions
- [ ] Share prediction with edit permissions
- [ ] Real-time collaboration (Firebase Realtime DB or Firestore)
- [ ] Show active collaborators
- [ ] Activity log
- [ ] Conflict resolution for simultaneous edits
- [ ] Comments/chat on predictions

#### 2.5 Leaderboards
- [ ] Global leaderboards per performance
- [ ] Friends leaderboards
- [ ] Filter by series/artist
- [ ] Historical leaderboards
- [ ] User rankings page
- [ ] Achievement badges

#### 2.6 Public Predictions
- [ ] Make predictions public
- [ ] Browse public predictions
- [ ] Copy others' predictions
- [ ] Like/upvote predictions
- [ ] Comments on predictions

#### 2.7 Custom Performance Sharing
- [ ] Submit custom performances to community
- [ ] Moderation system
- [ ] Approval workflow
- [ ] Community-created performance library
- [ ] Report inappropriate content

#### 2.8 Social Features
- [ ] Follow users
- [ ] Friend system
- [ ] Activity feed
- [ ] Notifications
  - Performance starting soon
  - Friend submitted prediction
  - New scores available

**Deliverable**: Full social platform with accounts, collaboration, leaderboards.

---

### Phase 3: Auto-Scoring & Smart Features

**Goal**: Automate scoring and add intelligence

#### 3.1 Actual Setlist Database
- [ ] Crowdsourced actual setlists
- [ ] LLFans scraper/integration
- [ ] User submission system
- [ ] Verification system (multiple confirmations)
- [ ] Edit history for setlists

#### 3.2 Auto-Scoring
- [ ] Automatic score calculation when actual setlist is available
- [ ] Bulk scoring for all predictions
- [ ] Real-time score updates
- [ ] Push notifications for new scores

#### 3.3 Fuzzy Matching for Custom Songs
- [ ] String similarity algorithms
- [ ] Suggest matches for custom songs
- [ ] Manual confirmation
- [ ] Learn from corrections (ML)

#### 3.4 Smart Suggestions
- [ ] "Similar performances" algorithm
- [ ] Suggest likely songs based on:
  - Artist
  - Recent releases
  - Past performance patterns
  - Anniversary dates
- [ ] AI-powered prediction assistant
- [ ] Analyze historical trends

#### 3.5 Statistics & Analytics
- [ ] User statistics page
  - Accuracy over time
  - Best performance
  - Most predicted songs
- [ ] Performance analytics
  - Average score for performance
  - Most common predictions
  - Surprise songs (rarely predicted)
- [ ] Song popularity trends
- [ ] Prediction difficulty rating

**Deliverable**: Intelligent, automated system with analytics.

---

### Phase 4: Outfit Predictions (Bonus)

**Goal**: Predict outfits/costumes for performances

#### 4.1 Outfit Database
- [ ] Outfit data model
  - Name, images, tags
  - Associated songs
  - Performance history
- [ ] Outfit library
- [ ] Upload outfit images

#### 4.2 Outfit Prediction UI
- [ ] Add outfit field to setlist items
- [ ] Outfit selector modal
- [ ] Visual outfit display
- [ ] Match outfit to song/section

#### 4.3 Outfit Scoring
- [ ] Scoring rules for outfits
- [ ] Partial credit for outfit category
  - Color scheme match
  - Formal vs casual
  - Series-specific costumes

#### 4.4 Outfit History
- [ ] Track outfit usage
- [ ] "Outfit rarity" stats
- [ ] Suggest likely outfits

**Deliverable**: Full outfit prediction system.

---

## Integration with Existing Codebase

### Reusable Components

#### From Character/Song Sorter:

1. **Filter System** (`src/components/sorter/*Filters.tsx`)
   - Reuse for performance/song filtering
   - Already has localization
   - Multi-select pattern established

2. **Card Components** (`src/components/sorter/*Card.tsx`)
   - Adapt for PerformanceCard
   - Similar styling and interaction

3. **Results Display** (`src/components/results/`)
   - Table/Grid/Tier views could be adapted
   - Edit mode with drag-and-drop already exists
   - Can reuse for displaying predictions

4. **Export Functions** (from `*ResultsView.tsx`)
   - `modern-screenshot` for PNG export
   - `file-saver` for downloads
   - Clipboard API for text/JSON

### Reusable Hooks

1. **useLocalStorage** (`src/hooks/useLocalStorage.ts`)
   - Perfect for prediction persistence
   - Already handles JSON serialization
   - Validation support

2. **useSorter** (`src/hooks/useSorter.ts`)
   - Merge sort algorithm could be adapted for prediction comparison
   - History/undo pattern reusable

### Reusable Utilities

1. **share.ts** (`src/utils/share.ts`)
   - URL compression with lz-string
   - Serialization patterns
   - Already working for results sharing

2. **assets.ts** (`src/utils/assets.ts`)
   - Pattern for performance images
   - Asset URL generation

### UI Components

Existing Park UI components to use:
- **Dialog**: Modals for adding songs, creating performances
- **Drawer**: Mobile slide-out panels
- **Select**: Dropdowns for filters
- **Checkbox**: Multi-select filters
- **Input**: Search bars, text inputs
- **Button**: Actions throughout
- **Card**: Container for items
- **Tabs**: Switch between views
- **Tooltip**: Help text
- **Progress**: Loading states
- **Toast**: Notifications (via ToasterContext)
- **Badge**: Status indicators
- **Avatar**: User profiles (Phase 2)
- **Table**: Display lists
- **Accordion**: Collapsible sections

### Styling Patterns

Follow existing Panda CSS patterns:

```typescript
import { Stack, HStack, Box } from 'styled-system/jsx';
import { button, card } from 'styled-system/recipes';

<Stack gap={4} p={4}>
  <HStack justifyContent="space-between">
    <Box bgColor="bg.default" borderRadius="lg">
      {/* Content */}
    </Box>
  </HStack>
</Stack>
```

Use existing theme colors:
- Accent: Pink (for primary actions)
- Gray: Mauve (for secondary elements)
- Semantic tokens: `bg.default`, `bg.muted`, `text.default`, etc.

### Data Patterns

Follow existing data file structure:

```typescript
// data/performances.json
export const performancesData = [
  {
    id: "1",
    name: "AZALEA 1st LoveLive!",
    // ...
  }
];

// In component
import performancesData from '~/data/performances.json';

// Or with hook
function usePerformanceData() {
  return performancesData;
}
```

### Routing

Follow vike conventions:

```
src/pages/setlist-prediction/
├── +Page.tsx          # List of performances
├── +Layout.tsx        # Shared layout
├── +config.ts         # Route config
└── builder/
    └── +Page.tsx      # Builder interface
```

Use route parameters:

```typescript
// +Page.tsx
export { Page };

function Page() {
  const params = usePageContext();
  const { performanceId, predictionId } = params.routeParams;
  // ...
}
```

---

## Localization Requirements

### Translation Keys Structure

Add to `src/i18n/locales/en.json` and `ja.json`:

```json
{
  "setlistPrediction": {
    "title": "Setlist Prediction",
    "subtitle": "Predict setlists and compete with friends!",

    "performances": {
      "title": "Select Performance",
      "upcoming": "Upcoming",
      "past": "Past",
      "custom": "Custom",
      "createCustom": "Create Custom Performance",
      "noPredictions": "No predictions yet",
      "predictionCount": "{{count}} prediction",
      "predictionCount_plural": "{{count}} predictions"
    },

    "builder": {
      "title": "Build Prediction",
      "searchSongs": "Search Songs",
      "addSong": "Add Song",
      "addCustomSong": "Add Custom Song",
      "addMC": "Add MC Segment",
      "addSpecial": "Add Special Item",
      "addSection": "Add Section",
      "insertHere": "Insert Here",
      "remarks": "Remarks",
      "position": "Position {{position}}",
      "estimatedDuration": "Estimated Duration: {{duration}} min",
      "totalSongs": "Total Songs: {{count}}",
      "emptySetlist": "Start building your setlist by adding songs!",
      "dragToReorder": "Drag to reorder",
      "multiSelectMode": "Multi-select Mode",
      "deleteSelected": "Delete Selected ({{count}})"
    },

    "sections": {
      "main": "Main",
      "encore": "Encore",
      "doubleEncore": "Double Encore",
      "opening": "Opening",
      "special": "Special",
      "custom": "Custom"
    },

    "itemTypes": {
      "song": "Song",
      "mc": "MC",
      "vtr": "VTR",
      "special": "Special",
      "opening": "Opening"
    },

    "saveSlots": {
      "title": "My Predictions",
      "newPrediction": "New Prediction",
      "duplicatePrediction": "Duplicate",
      "deletePrediction": "Delete",
      "renamePrediction": "Rename",
      "predictionName": "Prediction Name",
      "lastEdited": "Last edited {{time}}",
      "confirmDelete": "Are you sure you want to delete this prediction?"
    },

    "history": {
      "title": "Performance History",
      "viewHistory": "View History",
      "performedAt": "Performed at {{performance}}",
      "position": "Position {{position}}",
      "neverPerformed": "Never performed",
      "copySetlist": "Copy This Setlist",
      "stats": {
        "timesPerformed": "Performed {{count}} times",
        "averagePosition": "Average position: #{{position}}",
        "mostCommon": "Most common: {{section}}"
      }
    },

    "marking": {
      "title": "Marking Mode",
      "importActual": "Import Actual Setlist",
      "enterActual": "Enter Actual Setlist",
      "yourPrediction": "Your Prediction",
      "actualSetlist": "Actual Setlist",
      "matches": {
        "exact": "Exact Match",
        "close": "Close Match",
        "present": "Present",
        "missed": "Missed",
        "extra": "Not Predicted"
      },
      "linkItems": "Link Items",
      "unlinkItems": "Unlink",
      "autoMatch": "Auto-Match",
      "calculateScore": "Calculate Score"
    },

    "scoring": {
      "yourScore": "Your Score",
      "accuracy": "Accuracy",
      "breakdown": "Score Breakdown",
      "exactMatches": "Exact Matches",
      "closeMatches": "Close Matches (±{{range}})",
      "presentMatches": "Present in Setlist",
      "sectionMatches": "Correct Section",
      "missedSongs": "Missed Songs",
      "extraSongs": "Extra Songs",
      "bonusPoints": "Bonus Points",
      "bonuses": {
        "openingSong": "Opening Song",
        "closingSong": "Closing Song",
        "encoreBreak": "Encore Break",
        "specialPerformance": "Special Performance"
      },
      "points": "{{points}} pts",
      "rank": "Rank #{{rank}} / {{total}}"
    },

    "export": {
      "title": "Export & Share",
      "exportJSON": "Export as JSON",
      "exportText": "Copy as Text",
      "exportImage": "Download as Image",
      "shareLink": "Share Link",
      "shareQR": "Show QR Code",
      "copyLink": "Copy Link",
      "linkCopied": "Link copied to clipboard!",
      "generating": "Generating..."
    },

    "filters": {
      "series": "Series",
      "artist": "Artist",
      "status": "Status",
      "dateRange": "Date Range",
      "songType": "Song Type",
      "clear": "Clear Filters",
      "apply": "Apply"
    },

    "validation": {
      "emptySetlist": "Setlist cannot be empty",
      "duplicateSong": "Song already in setlist",
      "invalidSection": "Invalid section",
      "requiredField": "This field is required"
    },

    "messages": {
      "saved": "Prediction saved",
      "deleted": "Prediction deleted",
      "copied": "Copied to clipboard",
      "exported": "Exported successfully",
      "error": "An error occurred",
      "loading": "Loading...",
      "noResults": "No results found"
    }
  }
}
```

### Localization Best Practices

1. **Dynamic Content**: Use interpolation
   ```typescript
   t('setlistPrediction.performances.predictionCount', { count: 3 })
   ```

2. **Pluralization**: Use `_plural` suffix
   ```json
   "predictionCount": "{{count}} prediction",
   "predictionCount_plural": "{{count}} predictions"
   ```

3. **Date Formatting**: Use i18next date formatting
   ```typescript
   t('setlistPrediction.saveSlots.lastEdited', {
     time: formatRelative(date)
   })
   ```

4. **Fallbacks**: Always provide English as fallback
   ```typescript
   <Trans i18nKey="setlistPrediction.builder.title">
     Build Prediction
   </Trans>
   ```

5. **Rich Text**: Use `Trans` component for complex content
   ```typescript
   <Trans i18nKey="setlistPrediction.help.dragDrop">
     <strong>Drag and drop</strong> songs to reorder your setlist
   </Trans>
   ```

---

## Storage & Persistence Strategy

### Phase 1: LocalStorage Only

#### Storage Keys
```typescript
const STORAGE_KEYS = {
  // Core data
  PREDICTIONS: 'setlist-predictions-v1',
  ACTIVE_PREDICTION: 'active-prediction-id',
  SAVE_SLOTS: 'setlist-save-slots-v1',

  // Cache
  PERFORMANCE_CACHE: 'performance-cache-v1',
  HISTORY_CACHE: 'song-history-cache-v1',

  // Settings
  SETTINGS: 'setlist-prediction-settings-v1',

  // Auto-save
  DRAFTS: 'setlist-prediction-drafts-v1',
  AUTOSAVE_TIMESTAMP: 'last-autosave-timestamp',
} as const;
```

#### Data Size Management

LocalStorage has ~5-10MB limit. Strategies:

1. **Compression**: Use lz-string for large objects
   ```typescript
   import { compress, decompress } from 'lz-string';

   const compressedData = compress(JSON.stringify(predictions));
   localStorage.setItem(key, compressedData);

   const data = JSON.parse(decompress(localStorage.getItem(key)));
   ```

2. **Pagination**: Store predictions by performance
   ```typescript
   // Instead of single key with all predictions:
   // 'setlist-predictions': { pred1, pred2, ... }

   // Use performance-based keys:
   // 'setlist-predictions-perf-123': { pred1, pred2 }
   // 'setlist-predictions-perf-456': { pred3, pred4 }
   ```

3. **Pruning**: Remove old/completed predictions
   ```typescript
   function cleanupOldPredictions() {
     const predictions = getAllPredictions();
     const cutoffDate = subMonths(new Date(), 6);

     const recentPredictions = predictions.filter(p =>
       parseISO(p.updatedAt) > cutoffDate || p.isFavorite
     );

     savePredictions(recentPredictions);
   }
   ```

4. **Export to File**: For large datasets
   ```typescript
   function exportToFile() {
     const data = localStorage.getItem(STORAGE_KEYS.PREDICTIONS);
     const blob = new Blob([data], { type: 'application/json' });
     saveAs(blob, 'predictions-backup.json');
   }
   ```

#### Auto-Save Strategy

```typescript
function usePredictionAutoSave(prediction: SetlistPrediction) {
  const [isDirty, setIsDirty] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Debounced auto-save
  useEffect(() => {
    if (!isDirty) return;

    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Save after 2 seconds of inactivity
    timeoutRef.current = setTimeout(() => {
      savePrediction(prediction);
      setIsDirty(false);

      // Update timestamp
      localStorage.setItem(
        STORAGE_KEYS.AUTOSAVE_TIMESTAMP,
        new Date().toISOString()
      );
    }, 2000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [prediction, isDirty]);

  // Mark dirty on changes
  const markDirty = useCallback(() => {
    setIsDirty(true);
  }, []);

  return { isDirty, markDirty };
}
```

#### Migration Strategy

Handle schema changes gracefully:

```typescript
interface StorageVersion {
  version: number;
  data: any;
}

function migrateData(key: string): any {
  const raw = localStorage.getItem(key);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);

    // Check for version
    if (!parsed.version) {
      // v0 → v1 migration
      return migrateV0ToV1(parsed);
    }

    if (parsed.version === 1) {
      return parsed.data;
    }

    // Add more migrations as needed

  } catch (error) {
    console.error('Migration failed:', error);
    return null;
  }
}

function migrateV0ToV1(oldData: any): any {
  // Transform old schema to new schema
  return {
    version: 1,
    data: {
      ...oldData,
      // Add new fields, transform structures, etc.
    }
  };
}
```

### Phase 2: Cloud Sync

#### Hybrid Storage Strategy

Combine localStorage with backend:

```typescript
interface SyncStrategy {
  // Local-first: Always write to local, sync to cloud async
  saveLocal: (data: any) => void;
  syncToCloud: (data: any) => Promise<void>;

  // Conflict resolution
  resolveConflict: (local: any, remote: any) => any;

  // Sync status
  lastSyncTime: Date | null;
  pendingChanges: number;
}

function usePredictionSync() {
  const { user } = useAuth();

  const save = async (prediction: SetlistPrediction) => {
    // 1. Save to localStorage immediately
    savePredictionLocal(prediction);

    if (!user) return; // Guest mode

    // 2. Queue for cloud sync
    queueCloudSync(prediction);

    // 3. Sync when online
    if (navigator.onLine) {
      await syncToCloud();
    }
  };

  const syncToCloud = async () => {
    const pendingChanges = getPendingChanges();

    for (const change of pendingChanges) {
      try {
        await uploadPrediction(change);
        markSynced(change.id);
      } catch (error) {
        console.error('Sync failed:', error);
        // Retry later
      }
    }
  };

  const resolveConflict = (
    local: SetlistPrediction,
    remote: SetlistPrediction
  ): SetlistPrediction => {
    // Strategy: Most recent wins
    const localTime = parseISO(local.updatedAt);
    const remoteTime = parseISO(remote.updatedAt);

    if (localTime > remoteTime) {
      return local;
    } else if (remoteTime > localTime) {
      return remote;
    } else {
      // Same timestamp - should be rare
      // Could prompt user or use merge strategy
      return mergeChanges(local, remote);
    }
  };

  return { save, syncToCloud, resolveConflict };
}
```

#### Offline Support

```typescript
function useOfflineSupport() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingChanges, setPendingChanges] = useState(0);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Trigger sync
      syncPendingChanges();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, pendingChanges };
}
```

---

## Import/Export Specifications

### Export Formats

#### 1. JSON Export
```typescript
interface PredictionExportJSON {
  version: number;
  exportedAt: string;
  prediction: SetlistPrediction;
  performance: Performance;
  metadata: {
    appVersion: string;
    exportedBy?: string;
  };
}

function exportAsJSON(prediction: SetlistPrediction): string {
  const data: PredictionExportJSON = {
    version: 1,
    exportedAt: new Date().toISOString(),
    prediction,
    performance: getPerformance(prediction.performanceId),
    metadata: {
      appVersion: packageJson.version,
    }
  };

  return JSON.stringify(data, null, 2);
}
```

#### 2. Text Export
```typescript
function exportAsText(prediction: SetlistPrediction): string {
  const { setlist } = prediction;
  const performance = getPerformance(prediction.performanceId);

  let text = `${performance.name}\n`;
  text += `Predicted by: ${prediction.name}\n`;
  text += `Date: ${format(parseISO(performance.date), 'PP')}\n\n`;

  let currentSection = '';

  setlist.items.forEach((item, idx) => {
    // Section header
    if (item.section && item.section !== currentSection) {
      text += `\n━━━ ${item.section} ━━━\n`;
      currentSection = item.section;
    }

    // Item
    if (item.type === 'song' || item.type === 'encore') {
      const song = getSong(item.songId);
      const artist = getArtist(song.artists[0]);
      text += `${idx + 1}. ${song.name} - ${artist.name}\n`;
    } else {
      text += `${idx + 1}. [${item.type.toUpperCase()}] ${item.title}\n`;
    }

    // Remarks
    if (item.remarks) {
      text += `   ↳ ${item.remarks}\n`;
    }
  });

  return text;
}
```

#### 3. Image/PNG Export

Reuse existing `modern-screenshot` pattern:

```typescript
import { domToBlob } from 'modern-screenshot';

async function exportAsImage(
  prediction: SetlistPrediction
): Promise<Blob> {
  // Create hidden render div
  const renderDiv = document.createElement('div');
  renderDiv.style.position = 'absolute';
  renderDiv.style.left = '-9999px';
  renderDiv.style.width = '800px';
  document.body.appendChild(renderDiv);

  // Render prediction to div
  const root = createRoot(renderDiv);
  root.render(
    <SetlistImageExport prediction={prediction} />
  );

  // Wait for render
  await new Promise(resolve => setTimeout(resolve, 100));

  // Screenshot
  const blob = await domToBlob(renderDiv, {
    quality: 1,
    scale: 2,
    backgroundColor: '#ffffff'
  });

  // Cleanup
  root.unmount();
  document.body.removeChild(renderDiv);

  return blob;
}

// Component for image export
function SetlistImageExport({ prediction }: { prediction: SetlistPrediction }) {
  const performance = getPerformance(prediction.performanceId);
  const { setlist } = prediction;

  return (
    <Box p={8} bgColor="white">
      <Heading size="xl">{performance.name}</Heading>
      <Text>{format(parseISO(performance.date), 'PP')}</Text>
      <Divider my={4} />

      {setlist.items.map((item, idx) => (
        <Box key={item.id} my={2}>
          <HStack>
            <Text fontWeight="bold">{idx + 1}.</Text>
            {item.type === 'song' ? (
              <Text>{getSong(item.songId).name}</Text>
            ) : (
              <Text>[{item.type}] {item.title}</Text>
            )}
          </HStack>
        </Box>
      ))}

      <Divider my={4} />
      <Text fontSize="sm">Generated by LoveLive! Setlist Predictor</Text>
    </Box>
  );
}
```

#### 4. Share URL
```typescript
import { compressToEncodedURIComponent } from 'lz-string';

function generateShareURL(prediction: SetlistPrediction): string {
  const shareData = {
    v: 1, // version
    p: prediction.performanceId,
    n: prediction.name,
    i: prediction.setlist.items.map(item => ({
      t: item.type,
      s: item.type === 'song' ? item.songId : undefined,
      c: item.type !== 'song' ? item.title : undefined,
      r: item.remarks,
      sec: item.section
    })),
    sec: prediction.setlist.sections
  };

  const compressed = compressToEncodedURIComponent(JSON.stringify(shareData));

  return `${window.location.origin}/setlist-prediction/view/${compressed}`;
}
```

#### 5. QR Code
```typescript
import QRCode from 'qrcode';

async function generateQRCode(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    width: 512,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#ffffff'
    }
  });
}

// Component
function QRCodeModal({ url }: { url: string }) {
  const [qrDataURL, setQrDataURL] = useState('');

  useEffect(() => {
    generateQRCode(url).then(setQrDataURL);
  }, [url]);

  return (
    <Dialog>
      <DialogContent>
        <DialogHeader>Share QR Code</DialogHeader>
        <Box textAlign="center">
          {qrDataURL && <img src={qrDataURL} alt="QR Code" />}
          <Text mt={4} fontSize="sm">{url}</Text>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
```

### Import Formats

#### 1. JSON Import
```typescript
function importFromJSON(jsonString: string): SetlistPrediction {
  const data: PredictionExportJSON = JSON.parse(jsonString);

  // Validate version
  if (data.version !== 1) {
    throw new Error('Unsupported export version');
  }

  // Validate structure
  validatePrediction(data.prediction);

  // Generate new IDs to avoid conflicts
  const newPrediction = {
    ...data.prediction,
    id: generateId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    setlist: {
      ...data.prediction.setlist,
      id: generateId(),
      items: data.prediction.setlist.items.map(item => ({
        ...item,
        id: generateId()
      }))
    }
  };

  return newPrediction;
}
```

#### 2. LLFans Scraper (Future)
```typescript
async function importFromLLFans(url: string): Promise<PerformanceSetlist> {
  // Fetch page
  const response = await fetch(url);
  const html = await response.text();

  // Parse HTML (would need actual LLFans structure analysis)
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Extract setlist
  const songs = Array.from(doc.querySelectorAll('.song-item')).map(el => ({
    songName: el.querySelector('.song-name')?.textContent,
    position: parseInt(el.querySelector('.position')?.textContent || '0')
  }));

  // Match songs to database
  const items: SetlistItem[] = songs.map((song, idx) => {
    const matchedSong = findSongByName(song.songName);

    if (matchedSong) {
      return {
        id: generateId(),
        type: 'song',
        position: idx,
        songId: matchedSong.id
      };
    } else {
      // Custom song
      return {
        id: generateId(),
        type: 'song',
        position: idx,
        isCustomSong: true,
        customSongName: song.songName
      };
    }
  });

  return {
    id: generateId(),
    performanceId: '', // To be filled
    items,
    sections: inferSections(items),
    totalSongs: items.filter(i => i.type === 'song').length
  };
}
```

#### 3. Copy from Past Performance
```typescript
function copyPastPerformance(
  sourcePerformanceId: string,
  targetPerformanceId: string
): SetlistPrediction {
  const sourcePerformance = getPerformance(sourcePerformanceId);

  if (!sourcePerformance.actualSetlist) {
    throw new Error('Source performance has no setlist');
  }

  const newPrediction: SetlistPrediction = {
    id: generateId(),
    performanceId: targetPerformanceId,
    name: `Based on ${sourcePerformance.name}`,
    setlist: {
      ...sourcePerformance.actualSetlist,
      id: generateId(),
      isActual: false,
      items: sourcePerformance.actualSetlist.items.map(item => ({
        ...item,
        id: generateId()
      }))
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  return newPrediction;
}
```

---

## Scoring System Design

### Scoring Philosophy

Flexible, configurable system with multiple scoring strategies.

### Base Scoring Rules

```typescript
interface ScoringRules {
  // Position-based scoring
  exactMatch: number;           // Same position, same section
  closeMatch: {
    points: number;
    range: number;              // ±N positions
  };
  presentMatch: number;         // In setlist, wrong position
  sectionMatch: number;         // Correct section, wrong position

  // Bonus points
  bonuses: {
    openingSong: number;        // Correctly predicted first song
    closingSong: number;        // Correctly predicted last song
    encoreBreak: number;        // Correctly predicted encore start
    doublEncoreBreak: number;   // Double encore start
    specialPerformance: number; // Predicted special items
  };

  // Penalties (optional)
  penalties?: {
    missedSong: number;         // Predicted but not performed
    extraSong: number;          // Not predicted but performed
  };

  // Section modifiers
  sectionMultipliers?: {
    main: number;
    encore: number;
    doubleEncore: number;
  };
}

// Default rules (can be customized)
const DEFAULT_SCORING_RULES: ScoringRules = {
  exactMatch: 15,
  closeMatch: {
    points: 8,
    range: 2
  },
  presentMatch: 3,
  sectionMatch: 5,
  bonuses: {
    openingSong: 5,
    closingSong: 5,
    encoreBreak: 5,
    doubleEncoreBreak: 5,
    specialPerformance: 3
  },
  penalties: {
    missedSong: -1,
    extraSong: 0  // No penalty for not predicting extra songs
  },
  sectionMultipliers: {
    main: 1.0,
    encore: 1.2,      // Encore songs worth 20% more
    doubleEncore: 1.5  // Double encore worth 50% more
  }
};
```

### Scoring Algorithm

```typescript
function calculateScore(
  prediction: PerformanceSetlist,
  actual: PerformanceSetlist,
  rules: ScoringRules = DEFAULT_SCORING_RULES
): PredictionScore {

  // Step 1: Match predicted items to actual items
  const matches = matchSetlists(prediction, actual);

  // Step 2: Calculate item scores
  const itemScores: PredictionScore['itemScores'] = [];
  let totalScore = 0;
  let exactMatches = 0;
  let closeMatches = 0;
  let presentMatches = 0;
  let sectionMatches = 0;

  for (const predictedItem of prediction.items) {
    const match = matches.get(predictedItem.id);

    if (!match) {
      // No match - missed song
      itemScores.push({
        itemId: predictedItem.id,
        matched: false,
        points: rules.penalties?.missedSong || 0
      });
      continue;
    }

    const actualItem = actual.items.find(i => i.id === match.actualItemId);
    if (!actualItem) continue;

    const positionDiff = Math.abs(
      predictedItem.position - actualItem.position
    );

    let points = 0;
    let matchType: 'exact' | 'close' | 'present' | 'section';

    // Determine match type and base points
    if (positionDiff === 0 && predictedItem.section === actualItem.section) {
      // Exact match
      matchType = 'exact';
      points = rules.exactMatch;
      exactMatches++;
    } else if (positionDiff <= rules.closeMatch.range) {
      // Close match
      matchType = 'close';
      points = rules.closeMatch.points;
      closeMatches++;
    } else if (predictedItem.section === actualItem.section) {
      // Correct section
      matchType = 'section';
      points = rules.sectionMatch;
      sectionMatches++;
    } else {
      // Just present
      matchType = 'present';
      points = rules.presentMatch;
      presentMatches++;
    }

    // Apply section multiplier
    if (rules.sectionMultipliers && actualItem.section) {
      const sectionType = actual.sections.find(
        s => s.name === actualItem.section
      )?.type;

      if (sectionType && rules.sectionMultipliers[sectionType]) {
        points *= rules.sectionMultipliers[sectionType];
      }
    }

    itemScores.push({
      itemId: predictedItem.id,
      matched: true,
      matchType,
      positionDiff,
      points: Math.round(points),
      actualItemId: match.actualItemId
    });

    totalScore += Math.round(points);
  }

  // Step 3: Calculate bonus points
  const bonusPoints = calculateBonuses(prediction, actual, matches, rules);
  totalScore += Object.values(bonusPoints).reduce((sum, val) => sum + (val || 0), 0);

  // Step 4: Count extras (songs in actual but not predicted)
  const extraSongs = actual.items.filter(actualItem => {
    return !Array.from(matches.values()).some(
      m => m.actualItemId === actualItem.id
    );
  }).length;

  // Step 5: Calculate max possible score
  const maxPossibleScore = calculateMaxScore(actual, rules);

  // Step 6: Calculate accuracy
  const accuracy = (totalScore / maxPossibleScore) * 100;

  return {
    predictionId: '', // To be filled by caller
    totalScore,
    maxPossibleScore,
    accuracy: Math.round(accuracy * 100) / 100,
    breakdown: {
      exactMatches,
      exactMatchPoints: exactMatches * rules.exactMatch,
      closeMatches,
      closeMatchPoints: closeMatches * rules.closeMatch.points,
      presentMatches,
      presentMatchPoints: presentMatches * rules.presentMatch,
      sectionMatches,
      sectionMatchPoints: sectionMatches * rules.sectionMatch,
      missedSongs: prediction.items.length - (exactMatches + closeMatches + presentMatches + sectionMatches),
      extraSongs,
      bonusPoints
    },
    itemScores,
    calculatedAt: new Date().toISOString()
  };
}

function calculateBonuses(
  prediction: PerformanceSetlist,
  actual: PerformanceSetlist,
  matches: Map<string, { actualItemId: string }>,
  rules: ScoringRules
): PredictionScore['breakdown']['bonusPoints'] {
  const bonuses: PredictionScore['breakdown']['bonusPoints'] = {};

  // Opening song bonus
  if (prediction.items[0] && actual.items[0]) {
    const match = matches.get(prediction.items[0].id);
    if (match?.actualItemId === actual.items[0].id) {
      bonuses.openingSong = rules.bonuses.openingSong;
    }
  }

  // Closing song bonus
  const lastPred = prediction.items[prediction.items.length - 1];
  const lastActual = actual.items[actual.items.length - 1];
  if (lastPred && lastActual) {
    const match = matches.get(lastPred.id);
    if (match?.actualItemId === lastActual.id) {
      bonuses.closingSong = rules.bonuses.closingSong;
    }
  }

  // Encore break bonus
  const predEncoreStart = prediction.items.findIndex(
    item => item.section === 'Encore'
  );
  const actualEncoreStart = actual.items.findIndex(
    item => item.section === 'Encore'
  );
  if (predEncoreStart === actualEncoreStart && predEncoreStart !== -1) {
    bonuses.encoreBreak = rules.bonuses.encoreBreak;
  }

  // Special performance bonus
  const predSpecial = prediction.items.filter(
    item => item.type === 'special'
  ).length;
  const actualSpecial = actual.items.filter(
    item => item.type === 'special'
  ).length;
  if (predSpecial > 0 && actualSpecial > 0) {
    bonuses.specialPerformance =
      rules.bonuses.specialPerformance * Math.min(predSpecial, actualSpecial);
  }

  return bonuses;
}

function calculateMaxScore(
  actual: PerformanceSetlist,
  rules: ScoringRules
): number {
  // Max score = all exact matches + all bonuses
  let maxScore = 0;

  // Base points for all exact matches
  actual.items.forEach(item => {
    let itemScore = rules.exactMatch;

    // Apply section multiplier
    if (rules.sectionMultipliers && item.section) {
      const section = actual.sections.find(s => s.name === item.section);
      if (section?.type && rules.sectionMultipliers[section.type]) {
        itemScore *= rules.sectionMultipliers[section.type];
      }
    }

    maxScore += itemScore;
  });

  // Add all possible bonuses
  maxScore += rules.bonuses.openingSong;
  maxScore += rules.bonuses.closingSong;
  maxScore += rules.bonuses.encoreBreak;
  // Note: Don't add double encore if not present in actual

  return Math.round(maxScore);
}
```

### Matching Algorithm

```typescript
interface Match {
  predictedItemId: string;
  actualItemId: string;
  confidence: number;          // 0-1
  method: 'exact' | 'fuzzy' | 'manual';
}

function matchSetlists(
  prediction: PerformanceSetlist,
  actual: PerformanceSetlist
): Map<string, { actualItemId: string; confidence: number }> {

  const matches = new Map<string, { actualItemId: string; confidence: number }>();
  const usedActualIds = new Set<string>();

  // Phase 1: Exact matches (by song ID)
  for (const predItem of prediction.items) {
    if (predItem.type !== 'song' && predItem.type !== 'encore') continue;
    if (predItem.isCustomSong) continue;

    const exactMatch = actual.items.find(actualItem => {
      if (actualItem.type !== 'song' && actualItem.type !== 'encore') return false;
      if (usedActualIds.has(actualItem.id)) return false;
      return actualItem.songId === predItem.songId;
    });

    if (exactMatch) {
      matches.set(predItem.id, {
        actualItemId: exactMatch.id,
        confidence: 1.0
      });
      usedActualIds.add(exactMatch.id);
    }
  }

  // Phase 2: Fuzzy matching for custom songs
  for (const predItem of prediction.items) {
    if (!predItem.isCustomSong) continue;
    if (matches.has(predItem.id)) continue;

    const fuzzyMatch = findBestFuzzyMatch(
      predItem.customSongName || '',
      actual.items.filter(i => !usedActualIds.has(i.id)),
      0.8 // Confidence threshold
    );

    if (fuzzyMatch) {
      matches.set(predItem.id, {
        actualItemId: fuzzyMatch.id,
        confidence: fuzzyMatch.confidence
      });
      usedActualIds.add(fuzzyMatch.id);
    }
  }

  // Phase 3: Manual matches (loaded from user input)
  // This would be applied after user reviews auto-matches

  return matches;
}

function findBestFuzzyMatch(
  query: string,
  candidates: SetlistItem[],
  threshold: number
): { id: string; confidence: number } | null {

  let bestMatch: { id: string; confidence: number } | null = null;

  for (const candidate of candidates) {
    if (candidate.type !== 'song' && candidate.type !== 'encore') continue;

    const songName = candidate.isCustomSong
      ? candidate.customSongName
      : getSong(candidate.songId)?.name;

    if (!songName) continue;

    // Calculate similarity (using Levenshtein or similar)
    const similarity = calculateStringSimilarity(query, songName);

    if (similarity >= threshold) {
      if (!bestMatch || similarity > bestMatch.confidence) {
        bestMatch = {
          id: candidate.id,
          confidence: similarity
        };
      }
    }
  }

  return bestMatch;
}

function calculateStringSimilarity(s1: string, s2: string): number {
  // Normalize
  const normalize = (s: string) => s.toLowerCase().trim();
  s1 = normalize(s1);
  s2 = normalize(s2);

  // Exact match
  if (s1 === s2) return 1.0;

  // Levenshtein distance
  const distance = levenshteinDistance(s1, s2);
  const maxLength = Math.max(s1.length, s2.length);

  return 1 - (distance / maxLength);
}

function levenshteinDistance(s1: string, s2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= s1.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= s2.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= s1.length; i++) {
    for (let j = 1; j <= s2.length; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,      // deletion
          matrix[i][j - 1] + 1,      // insertion
          matrix[i - 1][j - 1] + 1   // substitution
        );
      }
    }
  }

  return matrix[s1.length][s2.length];
}
```

### Scoring Presets

```typescript
const SCORING_PRESETS: Record<string, ScoringRules> = {
  default: DEFAULT_SCORING_RULES,

  strict: {
    exactMatch: 20,
    closeMatch: { points: 5, range: 1 },
    presentMatch: 1,
    sectionMatch: 3,
    bonuses: {
      openingSong: 10,
      closingSong: 10,
      encoreBreak: 10,
      doubleEncoreBreak: 15,
      specialPerformance: 5
    },
    penalties: {
      missedSong: -2,
      extraSong: -1
    },
    sectionMultipliers: {
      main: 1.0,
      encore: 1.5,
      doubleEncore: 2.0
    }
  },

  casual: {
    exactMatch: 10,
    closeMatch: { points: 8, range: 3 },
    presentMatch: 5,
    sectionMatch: 7,
    bonuses: {
      openingSong: 3,
      closingSong: 3,
      encoreBreak: 3,
      doubleEncoreBreak: 3,
      specialPerformance: 2
    },
    // No penalties
    sectionMultipliers: {
      main: 1.0,
      encore: 1.0,
      doubleEncore: 1.0
    }
  }
};
```

---

## Future-Proofing & Extensibility

### Abstract Interfaces

Design with abstraction for easy extension:

```typescript
// Generic setlist item interface
interface ISetlistItem {
  id: string;
  type: string;
  position: number;
  section?: string;

  // Extension point
  metadata?: Record<string, any>;
}

// Scoring strategy pattern
interface IScoringStrategy {
  calculate(
    prediction: PerformanceSetlist,
    actual: PerformanceSetlist
  ): PredictionScore;

  getRules(): ScoringRules;
  setRules(rules: Partial<ScoringRules>): void;
}

// Export strategy pattern
interface IExportStrategy {
  export(prediction: SetlistPrediction): Promise<string | Blob>;
  getFormat(): string;
  getMimeType(): string;
}

// Matching strategy pattern
interface IMatchingStrategy {
  match(
    prediction: PerformanceSetlist,
    actual: PerformanceSetlist
  ): Map<string, { actualItemId: string; confidence: number }>;
}
```

### Plugin System (Phase 3+)

```typescript
interface SetlistPredictionPlugin {
  name: string;
  version: string;

  // Lifecycle hooks
  onInit?: () => void;
  onPredictionCreate?: (prediction: SetlistPrediction) => void;
  onPredictionUpdate?: (prediction: SetlistPrediction) => void;
  onScoreCalculate?: (score: PredictionScore) => void;

  // Extend types
  customItemTypes?: CustomItemType[];
  customScoringRules?: Partial<ScoringRules>;
  customExporters?: IExportStrategy[];

  // UI extensions
  builderPanelExtensions?: React.ComponentType[];
  settingsPageExtensions?: React.ComponentType[];
}

interface CustomItemType {
  type: string;
  label: string;
  labelJa?: string;
  icon?: React.ComponentType;
  component: React.ComponentType<{ item: ISetlistItem }>;
  defaultValues: Partial<ISetlistItem>;
}

// Plugin registry
class PluginRegistry {
  private plugins = new Map<string, SetlistPredictionPlugin>();

  register(plugin: SetlistPredictionPlugin) {
    this.plugins.set(plugin.name, plugin);
    plugin.onInit?.();
  }

  get(name: string): SetlistPredictionPlugin | undefined {
    return this.plugins.get(name);
  }

  getAllPlugins(): SetlistPredictionPlugin[] {
    return Array.from(this.plugins.values());
  }

  // Trigger hooks
  triggerPredictionCreate(prediction: SetlistPrediction) {
    this.plugins.forEach(plugin => {
      plugin.onPredictionCreate?.(prediction);
    });
  }
}
```

### Feature Flags

```typescript
interface FeatureFlags {
  // Phase 1 features
  customSongs: boolean;
  songHistory: boolean;
  multipleSlots: boolean;
  markingMode: boolean;

  // Phase 2 features
  authentication: boolean;
  cloudSync: boolean;
  collaboration: boolean;
  leaderboards: boolean;
  publicPredictions: boolean;

  // Phase 3 features
  autoScoring: boolean;
  fuzzyMatching: boolean;
  aiSuggestions: boolean;

  // Phase 4 features
  outfitPrediction: boolean;

  // Experimental
  experimental: {
    realTimeUpdates: boolean;
    voiceInput: boolean;
    videoPlayback: boolean;
  };
}

const FEATURE_FLAGS: FeatureFlags = {
  customSongs: true,
  songHistory: true,
  multipleSlots: true,
  markingMode: true,

  authentication: false,
  cloudSync: false,
  collaboration: false,
  leaderboards: false,
  publicPredictions: false,

  autoScoring: false,
  fuzzyMatching: false,
  aiSuggestions: false,

  outfitPrediction: false,

  experimental: {
    realTimeUpdates: false,
    voiceInput: false,
    videoPlayback: false
  }
};

// Hook to check features
function useFeatureFlag(flag: keyof FeatureFlags): boolean {
  return FEATURE_FLAGS[flag];
}

// Component guard
function FeatureGate({
  feature,
  children
}: {
  feature: keyof FeatureFlags;
  children: React.ReactNode;
}) {
  const enabled = useFeatureFlag(feature);
  return enabled ? <>{children}</> : null;
}
```

### Versioning Strategy

```typescript
interface DataVersion {
  predictions: number;
  performances: number;
  scoring: number;
}

const CURRENT_VERSION: DataVersion = {
  predictions: 1,
  performances: 1,
  scoring: 1
};

function migrateData<T>(
  data: T,
  fromVersion: number,
  toVersion: number,
  migrations: Record<string, (data: any) => any>
): T {
  let current = data;

  for (let v = fromVersion; v < toVersion; v++) {
    const migrationKey = `v${v}_to_v${v + 1}`;
    if (migrations[migrationKey]) {
      current = migrations[migrationKey](current);
    }
  }

  return current;
}
```

---

## Spicy Feature Ideas

### 1. **Live Prediction Mode** (Phase 3)
Real-time prediction updates during the actual performance:
- Users can update predictions as performance unfolds
- Live scoring updates
- "Called it!" reactions when prediction matches
- Live chat/comments with other predictors
- Timestamps for when predictions were made

### 2. **Prediction Challenges** (Phase 2)
Create themed challenges:
- "Predict the next concert with only pre-2020 songs"
- "Most unexpected setlist" challenge
- "Perfect opener prediction" mini-game
- Weekly/monthly challenges with prizes (badges)

### 3. **Song Combination Patterns** (Phase 3)
Analyze and suggest based on patterns:
- "These 3 songs are often performed together"
- "This artist usually starts with..."
- "Encore typically includes..."
- Visual graph of song relationships

### 4. **AI Prediction Assistant** (Phase 3)
AI-powered suggestions:
- "Based on past performances, we suggest..."
- Difficulty rating for predictions
- "Bold prediction" badge for unlikely setlists
- GPT-powered setlist generation

### 5. **Custom Scoring Challenges** (Phase 2)
Community creates custom scoring rules:
- "Only encore songs count"
- "Bonus for predicting rare songs"
- "Predict the vibe/energy, not just songs"
- Share and compete with custom rulesets

### 6. **Performance Bingo** (Phase 1)
Lighter game mode:
- 5x5 bingo card with songs
- Mark off as songs are performed
- First to complete row/column/diagonal wins
- Generate random or strategic cards

### 7. **Historical Prediction Replay** (Phase 2)
"What if" scenarios:
- "Predict past performances and see how you'd rank"
- Historical leaderboards
- Compare with actual predictors from that time
- Time-travel mode

### 8. **Prediction Templates** (Phase 1)
Pre-made templates:
- "Typical AZALEA setlist structure"
- "Anniversary live template"
- "Small venue setlist"
- "Festival appearance (short set)"
- Save and share your own templates

### 9. **Social Prediction Rooms** (Phase 2)
Group prediction sessions:
- Create a room with friends
- Discuss and collaborate in real-time
- Vote on songs to include
- Aggregate predictions
- Group score vs individual scores

### 10. **Prediction Heatmaps** (Phase 2)
Visualize community predictions:
- Heatmap showing most predicted songs
- Position frequency visualization
- "Consensus setlist" from all predictions
- Divergence scores (how unique your prediction is)

### 11. **Song Performance Trends** (Phase 3)
Analytics dashboard:
- "This song hasn't been performed in 2 years"
- "New releases are usually performed at position X"
- "This artist averages X songs per encore"
- Export trend reports

### 12. **Prediction Confidence Levels** (Phase 1)
Add confidence to predictions:
- Mark each song with confidence %
- Weighted scoring based on confidence
- "Safe" vs "Risky" prediction indicators
- Confidence leaderboards

### 13. **Performance Theme Predictor** (Phase 3)
Predict more than setlist:
- Stage setup/theme
- Special effects
- Guest appearances
- Surprise announcements
- Multi-category scoring

### 14. **Prediction Achievements/Badges** (Phase 2)
Gamification:
- "Perfect Prediction" - 100% accuracy
- "Oracle" - Correct opener 5 times in a row
- "Encore Expert" - Always predict encore correctly
- "Wildcard" - Predicted a rare song
- "Veteran" - 50+ predictions
- "Streak Master" - High scores 10 performances in a row

### 15. **Voice Memo Predictions** (Phase 3+)
Audio notes:
- Record voice predictions
- "I think they'll open with..."
- Playback after performance
- Share audio clips

### 16. **Setlist Diff Tool** (Phase 1)
Compare predictions:
- Side-by-side comparison of multiple predictions
- Highlight differences
- Show overlap
- Merge predictions
- "Community average" prediction

### 17. **Performance Countdown** (Phase 2)
Engagement before performance:
- Countdown timer to performance
- Lock predictions at showtime
- Last-minute changes tracker
- "Deadline rush" activity feed

### 18. **Prediction Marketplace** (Phase 2+)
Fun economy system:
- Virtual currency for correct predictions
- "Buy" songs to lock in (limited slots)
- "Sell" songs before performance
- Rarity-based pricing

### 19. **Setlist Roulette** (Phase 1)
Random generation modes:
- "Generate random setlist"
- "Generate realistic AI setlist"
- "Chaos mode" - completely random
- Use as starting point for editing

### 20. **Fan Report Integration** (Phase 3)
Post-performance features:
- Link to fan reports/blogs
- Photo gallery from performance
- Video clips
- Community post-show discussion
- "Moment of the night" voting

---

## Implementation Priority Matrix

### Must Have (Phase 1 - MVP)
| Feature | Priority | Complexity | Impact |
|---------|----------|------------|--------|
| Performance selection | P0 | Low | High |
| Song search & filters | P0 | Low | High |
| Drag-and-drop setlist builder | P0 | Medium | High |
| Multiple predictions (slots) | P0 | Medium | High |
| Custom songs | P0 | Low | High |
| Sections (main/encore) | P0 | Low | High |
| Export (JSON, Text, PNG) | P0 | Medium | Medium |
| Share URL | P0 | Medium | High |
| LocalStorage persistence | P0 | Low | High |
| Basic scoring | P1 | High | High |
| Marking mode | P1 | High | High |
| Song history viewer | P1 | Medium | Medium |
| Localization | P1 | Low | Medium |

### Should Have (Phase 2)
| Feature | Priority | Complexity | Impact |
|---------|----------|------------|--------|
| User authentication | P0 | Medium | High |
| Cloud sync | P0 | High | High |
| Leaderboards | P0 | Medium | High |
| Public predictions | P1 | Medium | Medium |
| Collaboration | P1 | High | Medium |
| Custom performances sharing | P1 | Medium | Medium |
| Achievements/badges | P2 | Low | Low |

### Could Have (Phase 3)
| Feature | Priority | Complexity | Impact |
|---------|----------|------------|--------|
| Auto-scoring | P0 | High | High |
| Fuzzy matching | P1 | High | Medium |
| AI suggestions | P1 | High | Low |
| Analytics dashboard | P1 | Medium | Medium |
| Prediction heatmaps | P2 | Medium | Low |
| Historical replay | P2 | Medium | Low |

### Nice to Have (Phase 4+)
| Feature | Priority | Complexity | Impact |
|---------|----------|------------|--------|
| Outfit prediction | P1 | Medium | Low |
| Live prediction mode | P1 | High | Medium |
| Voice predictions | P2 | High | Low |
| Prediction marketplace | P2 | High | Low |

---

## Technical Considerations

### Performance Optimization

1. **Virtual Scrolling**: For long song lists
   ```typescript
   import { useVirtualizer } from '@tanstack/react-virtual';
   ```

2. **Debounced Search**: For song search
   ```typescript
   import { useDeferredValue } from 'react';
   const deferredQuery = useDeferredValue(searchQuery);
   ```

3. **Lazy Loading**: For performance images
   ```typescript
   <img loading="lazy" src={imageUrl} />
   ```

4. **Code Splitting**: Route-based splitting (already supported by Vike)

5. **Memoization**: For expensive calculations
   ```typescript
   const filteredSongs = useMemo(() =>
     filterSongs(songs, filters),
     [songs, filters]
   );
   ```

### Accessibility

1. **Keyboard Navigation**:
   - Arrow keys for list navigation
   - Enter to add song
   - Escape to close modals
   - Tab order optimization

2. **Screen Reader Support**:
   - ARIA labels on all interactive elements
   - Live regions for dynamic content
   - Descriptive button text

3. **Drag-and-Drop Alternatives**:
   - Keyboard-based reordering
   - Move up/down buttons
   - Position input field

4. **Focus Management**:
   - Focus trap in modals
   - Return focus after actions
   - Skip links

### Error Handling

1. **Graceful Degradation**:
   - Offline mode
   - localStorage quota exceeded
   - Image loading failures

2. **User Feedback**:
   - Toast notifications
   - Inline validation
   - Error boundaries

3. **Data Validation**:
   - Validate before save
   - Sanitize user input
   - Check data integrity

### Testing Strategy

1. **Unit Tests**: Core logic
   - Scoring algorithm
   - Matching algorithm
   - Data validation
   - Utilities

2. **Integration Tests**: Components
   - Drag-and-drop
   - Form submission
   - Data persistence

3. **E2E Tests**: User flows
   - Create prediction
   - Export/share
   - Marking mode

---

## Documentation Requirements

### For Developers

1. **README.md**:
   - Feature overview
   - Setup instructions
   - Development guide
   - Contributing guidelines

2. **ARCHITECTURE.md**:
   - System design
   - Data flow
   - Component hierarchy
   - State management

3. **API.md** (Phase 2):
   - Endpoint documentation
   - Authentication
   - Data schemas
   - Rate limiting

4. **SCORING.md**:
   - Scoring rules explanation
   - Algorithm details
   - Customization guide
   - Examples

### For Users

1. **Help/Tutorial**:
   - Getting started guide
   - Feature walkthroughs
   - Tips and tricks
   - FAQ

2. **Scoring Explanation**:
   - How scoring works
   - Point values
   - Bonuses
   - Examples

3. **Changelog**:
   - Version history
   - New features
   - Bug fixes
   - Breaking changes

---

## Migration Path from Phase 1 to Phase 2

### Data Migration

```typescript
async function migrateToCloud(userId: string) {
  // 1. Get all local predictions
  const localPredictions = getAllLocalPredictions();

  // 2. Upload to cloud
  for (const prediction of localPredictions) {
    await uploadPrediction({
      ...prediction,
      userId,
      source: 'migration'
    });
  }

  // 3. Mark as migrated
  localStorage.setItem('migrated-to-cloud', 'true');

  // 4. Keep local copy as backup
  localStorage.setItem(
    'pre-migration-backup',
    JSON.stringify(localPredictions)
  );
}
```

### Account Linking

```typescript
// Guest predictions can be claimed after signup
async function linkGuestPredictions(userId: string, guestId: string) {
  const guestPredictions = await fetchPredictions(guestId);

  for (const prediction of guestPredictions) {
    await updatePredictionOwner(prediction.id, userId);
  }

  // Merge with any existing predictions
  await mergeUserData(userId, guestId);
}
```

---

## Security Considerations (Phase 2+)

### Authentication
- Secure token storage
- Session management
- Password requirements
- Rate limiting on login

### Authorization
- Row-level security
- Permission checks
- API authentication
- CORS configuration

### Data Protection
- Input sanitization
- XSS prevention
- SQL injection prevention (if using SQL)
- Data encryption at rest

### Privacy
- GDPR compliance
- Data export functionality
- Account deletion
- Privacy policy

---

## Conclusion

This specification provides a comprehensive roadmap for implementing the Setlist Prediction feature for the LoveLive! Sorter. The phased approach allows for:

1. **Quick MVP** (Phase 1): Fully functional local-first app
2. **Social Features** (Phase 2): Backend integration and community
3. **Intelligence** (Phase 3): AI and automation
4. **Expansion** (Phase 4+): Additional prediction categories

The design is:
- **Flexible**: Extensible architecture for future features
- **Scalable**: Grows from local-only to full social platform
- **User-friendly**: Intuitive UI following established patterns
- **Future-proof**: Plugin system and feature flags for easy iteration

Key strengths:
- Leverages existing codebase patterns
- Reuses components and utilities
- Follows established design system
- Maintains localization support
- Comprehensive scoring system
- Multiple export/share options

The specification is ready for implementation by another AI or development team. All major decisions are documented, with clear interfaces, data models, and user flows.
