# Technical Architecture

> Implementation details for the setlist prediction feature

## Directory Structure

```
src/
├── pages/
│   └── setlist-prediction/
│       ├── +Page.tsx                     # Performance list
│       ├── +Layout.tsx
│       ├── +config.ts
│       ├── builder/
│       │   └── +Page.tsx                 # Prediction builder
│       ├── marking/
│       │   └── [predictionId]/
│       │       └── +Page.tsx             # Marking mode
│       ├── view/
│       │   └── [shareId]/
│       │       └── +Page.tsx             # View shared prediction
│       └── bingo/
│           └── +Page.tsx                 # Bingo mode
│
├── components/
│   └── setlist-prediction/
│       ├── performance/
│       │   ├── PerformanceList.tsx
│       │   ├── PerformanceCard.tsx
│       │   └── PerformanceFilters.tsx
│       │
│       ├── builder/
│       │   ├── PredictionBuilder.tsx     # Main container
│       │   ├── SongSearchPanel.tsx
│       │   ├── SetlistEditorPanel.tsx
│       │   ├── ContextPanel.tsx
│       │   │
│       │   ├── song-search/
│       │   │   ├── SongSearchCard.tsx
│       │   │   └── CustomSongModal.tsx
│       │   │
│       │   ├── setlist-editor/
│       │   │   ├── SetlistItem.tsx
│       │   │   ├── SetlistEndDropZone.tsx
│       │   │   ├── SectionHeader.tsx
│       │   │   └── InsertItemMenu.tsx
│       │   │
│       │   └── context/
│       │       ├── SaveSlotManager.tsx
│       │       ├── SongHistoryModal.tsx
│       │       └── ExportShareTools.tsx
│       │
│       ├── marking/
│       │   ├── ComparisonView.tsx
│       │   ├── ScoreDisplay.tsx
│       │   └── ActualSetlistImporter.tsx
│       │
│       ├── bingo/
│       │   ├── BingoCard.tsx
│       │   └── BingoCell.tsx
│       │
│       └── shared/
│           ├── SetlistDisplay.tsx
│           └── DiffView.tsx
│
├── hooks/
│   └── setlist-prediction/
│       ├── usePerformanceData.ts
│       ├── usePredictionBuilder.ts
│       ├── useSongSearch.ts
│       ├── useSetlistDragDrop.ts
│       ├── usePredictionStorage.ts
│       ├── useSaveSlots.ts
│       ├── usePredictionScoring.ts
│       └── useSongHistory.ts
│
├── utils/
│   └── setlist-prediction/
│       ├── scoring.ts
│       ├── matching.ts
│       ├── validation.ts
│       ├── export.ts
│       ├── import.ts
│       ├── compression.ts
│       ├── diff.ts
│       └── trends.ts
│
├── types/
│   └── setlist-prediction.ts
│
└── i18n/
    └── locales/
        ├── en.json                       # Add setlistPrediction keys
        └── ja.json

data/
└── performances/
    ├── raw/
    │   ├── llfans-tours.json             # From your fetch scripts
    │   └── llfans-performances.json
    │
    ├── performances.json                 # Transformed
    └── performance-history.json          # Song history

scripts/
└── build-performances.ts                 # Transform LLFans → our models
```

## State Management

### Hook Pattern

Use custom hooks for state management (no Redux/Zustand needed):

```typescript
// Main builder state hook
function usePredictionBuilder(performanceId: string) {
  const [prediction, setPrediction] = useState<SetlistPrediction | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Auto-save to localStorage
  useEffect(() => {
    if (isDirty && prediction) {
      savePredictionToStorage(prediction);
      setIsDirty(false);
    }
  }, [isDirty, prediction]);

  const addSong = useCallback((songId: string, position?: number) => {
    setPrediction((prev) => {
      // ... mutation logic
    });
    setIsDirty(true);
  }, []);

  return {
    prediction,
    addSong,
    removeSong,
    reorderItems
    // ... more actions
  };
}
```

### LocalStorage Schema

```typescript
// Storage keys
const KEYS = {
  PREDICTIONS: 'setlist-predictions-v1',
  ACTIVE: 'active-prediction-id',
  SLOTS: 'setlist-save-slots-v1',
  CACHE: 'performance-cache-v1'
} as const;

// Storage wrapper
class PredictionStorage {
  save(prediction: SetlistPrediction) {
    const predictions = this.getAll();
    predictions[prediction.id] = prediction;
    localStorage.setItem(KEYS.PREDICTIONS, JSON.stringify(predictions));
  }

  get(id: string): SetlistPrediction | null {
    const predictions = this.getAll();
    return predictions[id] || null;
  }

  getAll(): Record<string, SetlistPrediction> {
    const data = localStorage.getItem(KEYS.PREDICTIONS);
    return data ? JSON.parse(data) : {};
  }

  delete(id: string) {
    const predictions = this.getAll();
    delete predictions[id];
    localStorage.setItem(KEYS.PREDICTIONS, JSON.stringify(predictions));
  }
}
```

## Drag and Drop

Using `@dnd-kit` (already in project):

```typescript
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Main setlist editor
function SetlistEditor({ items, onReorder }) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor)
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex(i => i.id === active.id);
      const newIndex = items.findIndex(i => i.id === over.id);
      onReorder(arrayMove(items, oldIndex, newIndex));
    }

    setActiveId(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={(e) => setActiveId(e.active.id as string)}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        {items.map(item => (
          <SortableSetlistItem key={item.id} item={item} />
        ))}
      </SortableContext>

      <DragOverlay>
        {activeId ? (
          <SetlistItem item={items.find(i => i.id === activeId)!} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

// Sortable item
function SortableSetlistItem({ item }: { item: SetlistItem }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <SetlistItem item={item} />
    </div>
  );
}
```

### Drop Zones and Visual Feedback

The setlist editor supports multiple drop zones with visual feedback:

**Main Drop Zone** (`setlist-drop-zone`):

- Parent container for setlist items registered with `useDroppable`
- Detects drops from search results and quick-add items
- Items are inserted at position of nearest item or at end
- Renders empty state message when no items present

**End Drop Zone** (`SetlistEndDropZone`):

- Invisible droppable component that fills remaining vertical space below items
- Allows users to drag items to the end of setlist easily
- Uses `flex={1}` to expand and fill available height
- Registered with `useDroppable` hook for dnd-kit integration
- Returns position `'center'` when hovering, triggering drop indicator

```typescript
// SetlistEndDropZone.tsx - Invisible droppable for end-of-list drops
export function SetlistEndDropZone() {
  const { setNodeRef } = useDroppable({
    id: 'setlist-drop-zone-end'
  });

  return <Box ref={setNodeRef} data-dropzone="end" flex={1} w="full" />;
}
```

**Drop Indicator System**:

The drop indicator provides visual feedback showing where dragged items will be placed. It's implemented through a shared `DropPreview` component and rendered conditionally based on drag state.

_When Drop Indicators are Rendered_:

1. **Empty Setlist** (hovering over `setlist-drop-zone` with `items.length === 0`):

   - Shows centered drop preview with "Drop here to add to setlist" text
   - Rendered in `SetlistEditorPanel` when `dropIndicator?.draggedItem` exists and no items in list
   - Helps first-time users understand they can start dragging items

2. **Between Items** (hovering over existing setlist items):

   - Shows drop preview with dashed border above or below hovered item
   - Position determined by drag position relative to item center
   - Rendered in `SetlistItem` component when `dropIndicatorPosition === 'top' || 'bottom'`
   - Includes song color accent (left border) and artist name for songs

3. **End of List** (hovering over `SetlistEndDropZone` or general `setlist-drop-zone`):
   - Shows drop preview below the last setlist item
   - Appears when dragging over the invisible drop zone below last item
   - Rendered on the **last SetlistItem** component with `position: 'bottom'`
   - The `SetlistEndDropZone` itself remains invisible - it only detects the drop zone
   - Same styling as between-items preview

_Drop Indicator Components_:

```typescript
// Shared DropPreview component (src/components/setlist-prediction/builder/setlist-editor/DropPreview.tsx)
interface DropPreviewProps {
  draggedItem: SetlistItem; // Item being dragged
  songDetails?: Song; // Song metadata (for database songs)
  position?: 'top' | 'bottom'; // Placement relative to target
  showDropHereText?: boolean; // Show "Drop here" helper text
}

export function DropPreview({
  draggedItem,
  songDetails,
  position,
  showDropHereText = false
}: DropPreviewProps) {
  // Renders:
  // - Dashed border box with 60% opacity
  // - Drag handle icon
  // - Song name or custom title
  // - Artist name (for songs)
  // - Colored left border (for songs, using series color)
  // - Optional "Drop here to add to setlist" text below
}
```

_Drop Indicator Logic Flow_:

```typescript
// In PredictionBuilder.tsx
const dropIndicator = useMemo(() => {
  if (!activeId || !overId || !activeData) return null;

  // Case 1: Empty setlist - show centered preview
  if (overId === 'setlist-drop-zone' && items.length === 0) {
    return {
      position: 'bottom',
      draggedItem: createTempItem(activeData),
      songDetails: getSongDetails(activeData)
    };
  }

  // Case 2: End of list - show preview on last item
  if ((overId === 'setlist-drop-zone-end' || overId === 'setlist-drop-zone') && items.length > 0) {
    const lastItemId = items[items.length - 1].id;
    return {
      itemId: lastItemId,
      position: 'bottom',
      draggedItem: createTempItem(activeData),
      songDetails: getSongDetails(activeData)
    };
  }

  // Case 3: Between items - show preview above/below hovered item
  if (overId in itemsById) {
    const position = calculateDropPosition(activeId, overId, items);
    return {
      itemId: overId,
      position,
      draggedItem: createTempItem(activeData),
      songDetails: getSongDetails(activeData)
    };
  }

  return null;
}, [activeId, overId, activeData, items]);
```

_Styling Details_:

- 60% opacity to indicate preview state
- Dashed border (2px) to differentiate from actual items
- Colored left border (4px solid) for songs, matching series color
- Drag handle icon (MdDragIndicator) for consistency
- Top/bottom margins (mt={1}/mb={1}) for spacing when between items
- "Drop here to add to setlist" text with muted color for empty state

**Performance Optimization**:

Measuring configuration ensures accurate drop detection across all zones:

```typescript
const measuring = useMemo(
  () => ({
    droppable: {
      strategy: MeasuringStrategy.WhileDragging // Continuously measure droppables while dragging
    },
    draggable: {
      measure: (element: HTMLElement) => element.getBoundingClientRect() // Precise element positioning
    }
  }),
  []
);
```

**Why this matters**:

- The `WhileDragging` strategy ensures the invisible `SetlistEndDropZone` bounds are recalculated continuously
- This fixes issues where quick-add items (MC, Encore, Intermission) would show drag preview at wrong position initially
- The `getBoundingClientRect()` measurement ensures draggable items get accurate positioning from the start of drag

## Data Flow

```
┌─────────────────────────────────────────────────────┐
│ LLFans API (via your scripts)                       │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ data/performances/raw/llfans-*.json                 │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼ (build script)
┌─────────────────────────────────────────────────────┐
│ data/performances/performances.json                 │
│ data/performances/performance-history.json          │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼ (import in app)
┌─────────────────────────────────────────────────────┐
│ usePerformanceData() hook                           │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ Performance Selection UI                            │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ Prediction Builder                                  │
│ (usePredictionBuilder hook)                         │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ LocalStorage                                        │
│ (auto-save every change)                            │
└────────────────┬────────────────────────────────────┘
                 │
                 ├──────────────────────┐
                 │                      │
                 ▼                      ▼
      ┌──────────────────┐   ┌──────────────────┐
      │ Share URL        │   │ Export PNG       │
      │ (lz-string)      │   │ (screenshot)     │
      └──────────────────┘   └──────────────────┘
```

## Scoring Algorithm

```typescript
function calculateScore(
  prediction: PerformanceSetlist,
  actual: PerformanceSetlist,
  rules: ScoringRules = DEFAULT_RULES
): PredictionScore {
  // 1. Match songs
  const matches = matchSongs(prediction.items, actual.items);

  // 2. Score each match
  let totalScore = 0;
  const itemScores = matches.map((match) => {
    let points = 0;
    const posDiff = Math.abs(match.predPos - match.actualPos);

    if (posDiff === 0 && match.sameSection) {
      points = rules.exactMatch;
    } else if (posDiff <= rules.closeMatch.range) {
      points = rules.closeMatch.points;
    } else if (match.sameSection) {
      points = rules.sectionMatch;
    } else {
      points = rules.presentMatch;
    }

    totalScore += points;
    return { ...match, points };
  });

  // 3. Add bonuses
  const bonuses = calculateBonuses(prediction, actual, matches, rules);
  totalScore += Object.values(bonuses).reduce((sum, v) => sum + (v || 0), 0);

  // 4. Calculate accuracy
  const maxScore = calculateMaxScore(actual, rules);
  const accuracy = (totalScore / maxScore) * 100;

  return {
    predictionId: '',
    totalScore,
    maxPossibleScore: maxScore,
    accuracy,
    breakdown: {
      /* ... */
    },
    itemScores,
    calculatedAt: new Date().toISOString()
  };
}

// Match songs between prediction and actual
function matchSongs(predItems: SetlistItem[], actualItems: SetlistItem[]): Match[] {
  const matches: Match[] = [];
  const usedActual = new Set<string>();

  // Exact matches first (by song ID)
  for (const predItem of predItems) {
    if (predItem.type !== 'song') continue;

    const actualItem = actualItems.find(
      (a) => a.type === 'song' && a.songId === predItem.songId && !usedActual.has(a.id)
    );

    if (actualItem) {
      matches.push({
        predItemId: predItem.id,
        actualItemId: actualItem.id,
        predPos: predItem.position,
        actualPos: actualItem.position,
        sameSection: predItem.section === actualItem.section
      });
      usedActual.add(actualItem.id);
    }
  }

  // TODO: Fuzzy matching for custom songs

  return matches;
}
```

## Share URL Format

```typescript
// Compress prediction for sharing
function generateShareUrl(prediction: SetlistPrediction): string {
  // 1. Minimize data
  const minified = {
    v: 1, // version
    p: prediction.performanceId,
    n: prediction.name,
    i: prediction.setlist.items.map((item) => ({
      t: item.type,
      s: item.type === 'song' ? item.songId : undefined,
      c: item.type !== 'song' ? item.title : undefined,
      r: item.remarks
    })),
    sec: prediction.setlist.sections.map((s) => ({
      n: s.name,
      s: s.startIndex,
      e: s.endIndex
    }))
  };

  // 2. Compress
  const json = JSON.stringify(minified);
  const compressed = compressToEncodedURIComponent(json);

  // 3. Build URL
  return `${window.location.origin}/setlist-prediction/view/${compressed}`;
}

// Decompress shared prediction
function parseShareUrl(compressed: string): SetlistPrediction {
  // 1. Decompress
  const json = decompressFromEncodedURIComponent(compressed);
  const data = JSON.parse(json);

  // 2. Validate version
  if (data.v !== 1) throw new Error('Unsupported version');

  // 3. Reconstruct prediction
  return {
    id: generateId(),
    performanceId: data.p,
    name: data.n,
    setlist: {
      id: generateId(),
      performanceId: data.p,
      items: data.i.map((item: any, idx: number) => ({
        id: generateId(),
        type: item.t,
        position: idx,
        songId: item.s,
        title: item.c,
        remarks: item.r
      })),
      sections: data.sec.map((s: any) => ({
        name: s.n,
        startIndex: s.s,
        endIndex: s.e
      })),
      totalSongs: data.i.filter((i: any) => i.t === 'song').length
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}
```

## Export PNG

Reuse existing screenshot pattern:

```typescript
import { domToBlob } from 'modern-screenshot';

async function exportAsPng(prediction: SetlistPrediction): Promise<Blob> {
  // 1. Create hidden render div
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.width = '800px';
  container.style.background = 'white';
  container.style.padding = '2rem';
  document.body.appendChild(container);

  // 2. Render prediction
  const root = createRoot(container);
  root.render(<SetlistImageExport prediction={prediction} />);

  // Wait for render
  await new Promise(resolve => setTimeout(resolve, 100));

  // 3. Screenshot
  const blob = await domToBlob(container, {
    quality: 1,
    scale: 2,
    backgroundColor: '#ffffff'
  });

  // 4. Cleanup
  root.unmount();
  document.body.removeChild(container);

  return blob;
}

// Styled component for export
function SetlistImageExport({ prediction }: { prediction: SetlistPrediction }) {
  const performance = usePerformance(prediction.performanceId);

  return (
    <Box p={8} bgColor="white" fontFamily="sans-serif">
      <Heading size="2xl" mb={2}>{performance.name}</Heading>
      <Text color="gray.600" mb={4}>
        {format(parseISO(performance.date), 'PPP')}
      </Text>

      <Divider my={6} />

      {prediction.setlist.items.map((item, idx) => (
        <HStack key={item.id} my={3}>
          <Text fontWeight="bold" w="40px">{idx + 1}.</Text>
          {item.type === 'song' ? (
            <Text>{getSong(item.songId)?.name}</Text>
          ) : (
            <Text fontStyle="italic">[{item.title}]</Text>
          )}
        </HStack>
      ))}

      <Divider my={6} />

      <Text fontSize="sm" color="gray.500">
        Generated by LoveLive! Setlist Predictor
      </Text>
    </Box>
  );
}
```

## Performance Optimization

### Virtual Scrolling

For long song lists:

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

function SongList({ songs }: { songs: Song[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: songs.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
    overscan: 5
  });

  return (
    <Box ref={parentRef} h="600px" overflow="auto">
      <Box h={`${virtualizer.getTotalSize()}px`} position="relative">
        {virtualizer.getVirtualItems().map(virtualRow => {
          const song = songs[virtualRow.index];
          return (
            <Box
              key={virtualRow.key}
              position="absolute"
              top={0}
              left={0}
              w="100%"
              h={`${virtualRow.size}px`}
              transform={`translateY(${virtualRow.start}px)`}
            >
              <SongCard song={song} />
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
```

### Lazy Loading Images

```typescript
<img
  loading="lazy"
  src={imageUrl}
  alt={name}
/>
```

### Debounced Search

```typescript
import { useDeferredValue } from 'react';

function SongSearch() {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);

  const results = useMemo(
    () => searchSongs(deferredQuery),
    [deferredQuery]
  );

  return (
    <>
      <Input value={query} onChange={(e) => setQuery(e.target.value)} />
      <SongList songs={results} />
    </>
  );
}
```

## Testing

### Unit Tests

```typescript
// scoring.test.ts
describe('calculateScore', () => {
  it('gives full points for exact match', () => {
    const prediction = createPrediction([song1, song2]);
    const actual = createPrediction([song1, song2]);

    const score = calculateScore(prediction, actual);

    expect(score.breakdown.exactMatches).toBe(2);
    expect(score.accuracy).toBe(100);
  });

  it('gives partial points for close match', () => {
    const prediction = createPrediction([song1, song2, song3]);
    const actual = createPrediction([song1, song3, song2]); // swapped

    const score = calculateScore(prediction, actual);

    expect(score.breakdown.closeMatches).toBeGreaterThan(0);
    expect(score.accuracy).toBeLessThan(100);
  });
});
```

### Integration Tests

```typescript
// PredictionBuilder.test.tsx
describe('PredictionBuilder', () => {
  it('adds song to setlist', async () => {
    render(<PredictionBuilder performanceId="1" />);

    const song = screen.getByText('Dream Believers');
    const addButton = within(song).getByRole('button', { name: 'Add' });

    fireEvent.click(addButton);

    expect(await screen.findByText('1. Dream Believers')).toBeInTheDocument();
  });

  it('reorders via drag and drop', async () => {
    // ... test DnD
  });
});
```

## Next Steps

1. Set up directory structure
2. Copy TypeScript types
3. Create hooks
4. Build components
5. Wire up data flow

See [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) for task breakdown!
