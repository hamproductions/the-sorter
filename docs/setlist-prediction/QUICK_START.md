# Quick Start Guide

> Get started building the setlist prediction feature in 15 minutes! ⚡

## Overview

**What we're building**: Fantasy football for Love Live! setlists
- Predict performances → Drag songs into order → Score accuracy → Share in group chats!
- 100% frontend, no backend needed for MVP
- Built on LLFans data

## Prerequisites

You already have:
- ✅ React 19 + TypeScript + Vike
- ✅ Panda CSS
- ✅ @dnd-kit (drag and drop)
- ✅ Scripts to fetch LLFans data
- ✅ Existing sorter components to reuse

## 5-Minute Setup

### 1. Get the Data

```bash
# Run your existing LLFans fetch scripts
npm run fetch:llfans  # or whatever your command is

# This should create:
# data/performances/raw/llfans-tours.json
# data/performances/raw/llfans-performances.json
```

### 2. Transform the Data

```bash
# Create build script
npm run build:performances

# Generates:
# data/performances/performances.json
# data/performances/performance-history.json
```

See [LLFANS_INTEGRATION.md](./LLFANS_INTEGRATION.md) for the transform logic.

### 3. Copy TypeScript Types

Copy interfaces from [DATA_MODELS.md](./DATA_MODELS.md) to:
```
src/types/setlist-prediction.ts
```

### 4. Create Routes

```bash
mkdir -p src/pages/setlist-prediction
```

Create basic page:
```typescript
// src/pages/setlist-prediction/+Page.tsx
export function Page() {
  return <div>Setlist Prediction - Coming Soon!</div>;
}
```

### 5. Test It

```bash
npm run dev
# Navigate to http://localhost:5173/setlist-prediction
```

You should see your new page! 🎉

---

## Development Flow

### Week 1: Core (Pick Performances)

**Goal**: User can browse and select performances

```typescript
// 1. Load performance data
import performancesData from '~/data/performances/performances.json';

// 2. Display list
function PerformanceList() {
  const performances = performancesData;

  return (
    <Stack gap={4}>
      {performances.map(perf => (
        <PerformanceCard key={perf.id} performance={perf} />
      ))}
    </Stack>
  );
}

// 3. Add filters (reuse from existing sorter!)
```

**Files to create**:
- `src/components/setlist-prediction/performance/PerformanceList.tsx`
- `src/components/setlist-prediction/performance/PerformanceCard.tsx`
- `src/hooks/setlist-prediction/usePerformanceData.ts`

### Week 2: Builder (Drag-and-Drop)

**Goal**: User can build predictions

```typescript
// 1. Setup drag-and-drop (reuse from existing sorter)
import { DndContext, DragOverlay } from '@dnd-kit/core';

// 2. Create setlist editor
function SetlistEditor({ items, onReorder }) {
  return (
    <DndContext onDragEnd={handleDragEnd}>
      <SortableContext items={items}>
        {items.map(item => (
          <SetlistItem key={item.id} item={item} />
        ))}
      </SortableContext>
    </DndContext>
  );
}

// 3. Save to localStorage
localStorage.setItem('predictions', JSON.stringify(predictions));
```

**Files to create**:
- `src/pages/setlist-prediction/builder/+Page.tsx`
- `src/components/setlist-prediction/builder/PredictionBuilder.tsx`
- `src/components/setlist-prediction/builder/SetlistEditorPanel.tsx`

### Week 3: Score & Share

**Goal**: Score predictions and share URLs

```typescript
// 1. Calculate score
const score = calculateScore(prediction, actualSetlist);

// 2. Generate shareable URL
import { compressToEncodedURIComponent } from 'lz-string';
const compressed = compressToEncodedURIComponent(JSON.stringify(prediction));
const shareUrl = `${origin}/setlist-prediction/view/${compressed}`;

// 3. Export as image (reuse from existing sorter)
import { domToBlob } from 'modern-screenshot';
const blob = await domToBlob(element);
saveAs(blob, 'prediction.png');
```

**Files to create**:
- `src/utils/setlist-prediction/scoring.ts`
- `src/utils/setlist-prediction/compression.ts`
- `src/components/setlist-prediction/marking/ScoreDisplay.tsx`

---

## Key Patterns to Reuse

### From Character/Song Sorter

1. **Filters**:
```typescript
// Reuse FilterCheckbox pattern
<FilterCheckbox
  items={series}
  selected={selectedSeries}
  onChange={setSelectedSeries}
/>
```

2. **Cards**:
```typescript
// Similar to CharacterCard/SongCard
<Card>
  <CardHeader>
    <Image src={imageUrl} />
    <Heading>{name}</Heading>
  </CardHeader>
  <CardBody>{/* content */}</CardBody>
</Card>
```

3. **Export**:
```typescript
// Same pattern as results export
const exportImage = async () => {
  const blob = await domToBlob(ref.current);
  saveAs(blob, 'prediction.png');
};
```

### Park UI Components

Already in project, use these:
- `Dialog` - Modals
- `Drawer` - Mobile panels
- `Button`, `Input`, `Select` - Forms
- `Tabs` - Switch views
- `Toast` - Notifications
- `Badge` - Status indicators

### Panda CSS Patterns

```typescript
import { Stack, HStack, Box } from 'styled-system/jsx';

<Stack gap={4} p={4}>
  <HStack justifyContent="space-between">
    <Box bgColor="bg.default" borderRadius="lg">
      {/* content */}
    </Box>
  </HStack>
</Stack>
```

---

## Common Tasks

### Add a New Performance

1. Fetch from LLFans via your script
2. Run build script to transform
3. Reload app - it appears automatically!

### Add a New Setlist Item Type

1. Add to `SetlistItemType` union in types
2. Create component in `setlist-editor/`
3. Handle in rendering logic

### Add a New Export Format

1. Create export function in `utils/setlist-prediction/export.ts`
2. Add button in `ExportShareTools.tsx`
3. Test file download

### Add Localization

```json
// src/i18n/locales/en.json
{
  "setlistPrediction": {
    "title": "Setlist Prediction",
    // ... more keys
  }
}
```

```typescript
// In components
import { useTranslation } from 'react-i18next';

const { t } = useTranslation();
return <Heading>{t('setlistPrediction.title')}</Heading>;
```

---

## Debugging Tips

### LocalStorage Full?

```typescript
// Check usage
const used = JSON.stringify(localStorage).length;
console.log(`Using ${used / 1024}KB`);

// Clear old data
localStorage.removeItem('setlist-predictions-v1');
```

### Drag-and-drop Not Working?

```typescript
// Check sensors
const sensors = useSensors(
  useSensor(PointerSensor),
  useSensor(TouchSensor)  // Don't forget touch!
);

// Check mobile viewport
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
```

### Share URL Too Long?

```typescript
// Use compression
import { compressToEncodedURIComponent } from 'lz-string';

// Reduce data
const minified = {
  v: 1,
  p: prediction.performanceId,
  i: prediction.setlist.items.map(i => ({
    t: i.type,
    s: i.songId  // Only essential fields
  }))
};
```

---

## Testing Checklist

Before sharing:
- [ ] Can create prediction
- [ ] Can drag to reorder
- [ ] Saves to localStorage
- [ ] Can score prediction
- [ ] Share URL works
- [ ] Export PNG works
- [ ] Works on mobile
- [ ] Language toggle works

---

## Next Steps

1. **Start simple**: Just performance list first
2. **Iterate**: Add builder, then scoring, then export
3. **Test early**: Share with friends for feedback
4. **Add spicy features**: Bingo mode, diff tool, trends

## Documentation Index

- [README](./README.md) - Main index
- [LLFANS_INTEGRATION](./LLFANS_INTEGRATION.md) - Data structure ⭐ Start here!
- [DATA_MODELS](./DATA_MODELS.md) - TypeScript types
- [IMPLEMENTATION_PLAN](./IMPLEMENTATION_PLAN.md) - Week-by-week tasks
- [SPICY_FEATURES](./SPICY_FEATURES.md) - Fun extras 🌶️

---

## Help & Resources

**Stuck?** Check:
1. Comprehensive spec: `/SETLIST_PREDICTION_SPEC.md`
2. Existing sorter code: `/src/pages/songs/`
3. Park UI docs: https://park-ui.com
4. @dnd-kit docs: https://docs.dndkit.com

**Questions?** Reference docs above or ask! 🚀

---

**Remember**: Start small, iterate fast, share often! This is meant to be fun for group chats, not a perfect enterprise app. Ship it! 🎉
