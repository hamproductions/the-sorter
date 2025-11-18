# Implementation Plan

> **Frontend-first approach**: Build a fully functional prediction game with no backend

## Phase 1: MVP - Frontend Only

**Goal**: Shareable setlist prediction game for group chats

**Timeline**: 2-3 weeks

**Tech Stack**:
- React + TypeScript + Vike
- Panda CSS
- @dnd-kit
- LocalStorage
- lz-string (compression)
- modern-screenshot

---

## Task Breakdown

### Week 1: Core Infrastructure

#### 1.1 Data Setup (2-3 days)
- [ ] Run existing LLFans fetch scripts
- [ ] Create `data/performances/` directory structure
- [ ] Build transform script (LLFans → Performance model)
- [ ] Generate `performances.json`
- [ ] Generate `performance-history.json`
- [ ] Add TypeScript types from DATA_MODELS.md

**Files to create**:
```
data/performances/
├── raw/
│   ├── llfans-tours.json
│   └── llfans-performances.json
├── performances.json
└── performance-history.json

src/types/setlist-prediction.ts
scripts/build-performances.ts
```

#### 1.2 Performance Selection (2 days)
- [ ] Create `/setlist-prediction` route
- [ ] Performance list page
- [ ] PerformanceCard component
- [ ] Performance filters (series, date, status)
- [ ] Search functionality
- [ ] "Create Custom Performance" modal

**Files to create**:
```
src/pages/setlist-prediction/
├── +Page.tsx
├── +Layout.tsx
└── +config.ts

src/components/setlist-prediction/performance/
├── PerformanceList.tsx
├── PerformanceCard.tsx
└── PerformanceFilters.tsx
```

#### 1.3 Basic Hooks & State (2 days)
- [ ] `usePerformanceData()` hook
- [ ] `usePredictionBuilder()` hook
- [ ] `usePredictionStorage()` hook
- [ ] LocalStorage utility functions
- [ ] ID generation utilities

**Files to create**:
```
src/hooks/setlist-prediction/
├── usePerformanceData.ts
├── usePredictionBuilder.ts
└── usePredictionStorage.ts

src/utils/setlist-prediction/
├── storage.ts
└── id.ts
```

---

### Week 2: Prediction Builder

#### 2.1 Builder Layout (2 days)
- [ ] 3-panel layout (desktop)
- [ ] Tabbed layout (mobile)
- [ ] Responsive breakpoints
- [ ] Panel toggling
- [ ] Builder header w/ actions

**Files to create**:
```
src/pages/setlist-prediction/builder/
└── +Page.tsx

src/components/setlist-prediction/builder/
├── PredictionBuilder.tsx
├── BuilderHeader.tsx
└── BuilderLayout.tsx
```

#### 2.2 Song Search Panel (1-2 days)
- [ ] Song search input
- [ ] Song filters (reuse from existing sorter)
- [ ] SongSearchCard component (draggable)
- [ ] Search results list
- [ ] "Add custom song" button
- [ ] Custom song modal

**Files to create**:
```
src/components/setlist-prediction/builder/
├── SongSearchPanel.tsx
└── song-search/
    ├── SongSearchCard.tsx
    ├── SongFilters.tsx
    └── CustomSongModal.tsx

src/hooks/setlist-prediction/
└── useSongSearch.ts
```

#### 2.3 Setlist Editor Panel (3 days)
- [ ] Drag-and-drop setup (@dnd-kit)
- [ ] SetlistItem component
- [ ] Song item rendering
- [ ] Non-song item rendering
- [ ] Reordering via drag
- [ ] Delete item
- [ ] Edit item (remarks)
- [ ] Insert item button
- [ ] Clear all confirmation

**Files to create**:
```
src/components/setlist-prediction/builder/
├── SetlistEditorPanel.tsx
└── setlist-editor/
    ├── SetlistItem.tsx
    ├── InsertItemMenu.tsx
    └── ItemActions.tsx

src/hooks/setlist-prediction/
└── useSetlistDragDrop.ts
```

#### 2.4 Section Management (1 day)
- [ ] Add section button
- [ ] Section header component
- [ ] Section dividers
- [ ] Assign items to sections
- [ ] Edit/delete sections

**Files to create**:
```
src/components/setlist-prediction/builder/setlist-editor/
├── SectionHeader.tsx
└── AddSectionModal.tsx
```

---

### Week 3: Scoring, Export & Polish

#### 3.1 Save Slot Manager (1-2 days)
- [ ] SaveSlotManager component
- [ ] List predictions for performance
- [ ] Create new prediction
- [ ] Duplicate prediction
- [ ] Delete prediction
- [ ] Rename prediction
- [ ] Mark favorite
- [ ] Switch between predictions

**Files to create**:
```
src/components/setlist-prediction/builder/context/
├── SaveSlotManager.tsx
├── PredictionList.tsx
└── PredictionCard.tsx

src/hooks/setlist-prediction/
└── useSaveSlots.ts
```

#### 3.2 Song History Viewer (1 day)
- [ ] "View History" button on songs
- [ ] SongHistoryModal component
- [ ] Past performances table
- [ ] "Copy setlist" feature
- [ ] Link to performance details

**Files to create**:
```
src/components/setlist-prediction/builder/context/
├── SongHistoryModal.tsx
└── PastPerformancesList.tsx

src/hooks/setlist-prediction/
└── useSongHistory.ts
```

#### 3.3 Scoring System (2 days)
- [ ] Matching algorithm
- [ ] Score calculation engine
- [ ] Configurable scoring rules
- [ ] Fuzzy matching for custom songs
- [ ] Bonus point calculation

**Files to create**:
```
src/utils/setlist-prediction/
├── scoring.ts
├── matching.ts
└── validation.ts

src/hooks/setlist-prediction/
└── usePredictionScoring.ts
```

#### 3.4 Marking Mode (2 days)
- [ ] Import actual setlist form
- [ ] ComparisonView component
- [ ] Side-by-side layout
- [ ] Visual matching lines
- [ ] Manual link/unlink items
- [ ] ScoreDisplay component
- [ ] Score breakdown
- [ ] Item-by-item scores

**Files to create**:
```
src/pages/setlist-prediction/marking/[predictionId]/
└── +Page.tsx

src/components/setlist-prediction/marking/
├── MarkingMode.tsx
├── ComparisonView.tsx
├── ActualSetlistImporter.tsx
├── ScoreDisplay.tsx
└── ScoreBreakdown.tsx
```

#### 3.5 Export & Share (2 days)
- [ ] Share URL generation (lz-string)
- [ ] View shared prediction route
- [ ] Export as JSON
- [ ] Export as Text (clipboard)
- [ ] Export as PNG (modern-screenshot)
- [ ] QR code generation
- [ ] Copy link button
- [ ] Share modal

**Files to create**:
```
src/pages/setlist-prediction/view/[shareId]/
└── +Page.tsx

src/components/setlist-prediction/builder/context/
└── ExportShareTools.tsx

src/utils/setlist-prediction/
├── compression.ts
├── export.ts
└── import.ts
```

#### 3.6 Localization (1 day)
- [ ] Add EN translation keys
- [ ] Add JA translation keys
- [ ] Ensure all UI text uses i18n
- [ ] Test language switching

**Files to update**:
```
src/i18n/locales/en.json
src/i18n/locales/ja.json
```

#### 3.7 Polish & Testing (1-2 days)
- [ ] Loading states
- [ ] Error handling
- [ ] Toast notifications
- [ ] Empty states
- [ ] Confirmation dialogs
- [ ] Keyboard shortcuts
- [ ] Mobile responsive testing
- [ ] Performance optimization
- [ ] Help/tutorial content

---

## Phase 1.5: Spicy Features (Optional)

### Bonus Features (1 week)

#### 4.1 Performance Bingo (2-3 days)
- [ ] BingoCard data model
- [ ] Card generation algorithm
- [ ] 5×5 grid component
- [ ] Mark cells during show
- [ ] Win detection
- [ ] Share bingo cards

**Files to create**:
```
src/pages/setlist-prediction/bingo/
└── +Page.tsx

src/components/setlist-prediction/bingo/
├── BingoCard.tsx
├── BingoCell.tsx
└── BingoGenerator.tsx
```

#### 4.2 Setlist Diff Tool (1-2 days)
- [ ] Compare mode
- [ ] Side-by-side diff view
- [ ] Diff calculation
- [ ] Highlight differences
- [ ] Similarity scoring
- [ ] Export comparison

**Files to create**:
```
src/components/setlist-prediction/shared/
├── CompareMode.tsx
└── DiffView.tsx

src/utils/setlist-prediction/
└── diff.ts
```

#### 4.3 Song Performance Trends (1-2 days)
- [ ] Trend calculation from history
- [ ] Trend badges on songs
- [ ] Smart suggestions
- [ ] Trend charts (optional)
- [ ] "Overdue" indicator
- [ ] "New release" badge

**Files to create**:
```
src/components/setlist-prediction/builder/song-search/
├── TrendBadges.tsx
└── SmartSuggestions.tsx

src/utils/setlist-prediction/
└── trends.ts
```

---

## Phase 2: Backend Integration (Optional)

**Not priority!** These can wait until Phase 1 is successful.

### Backend Setup
- Choose platform (Firebase/Supabase)
- User authentication
- Database schema
- API setup

### Cloud Features
- User accounts
- Cloud sync
- Leaderboards
- Public predictions
- Real-time collaboration
- Community heatmaps

---

## Priority Matrix

### Must Have (Week 1-2)
| Feature | Priority | Complexity | Days |
|---------|----------|------------|------|
| Data setup & LLFans transform | P0 | Medium | 2-3 |
| Performance selection | P0 | Low | 2 |
| Song search & filters | P0 | Low | 1-2 |
| Drag-and-drop builder | P0 | Medium | 3 |
| Section management | P0 | Low | 1 |
| Basic storage | P0 | Low | 1 |

### Should Have (Week 3)
| Feature | Priority | Complexity | Days |
|---------|----------|------------|------|
| Save slot manager | P0 | Medium | 1-2 |
| Scoring system | P0 | High | 2 |
| Marking mode | P0 | Medium | 2 |
| Share URLs | P0 | Medium | 1 |
| Export PNG/JSON | P1 | Medium | 1 |
| Song history | P1 | Low | 1 |
| Localization | P1 | Low | 1 |

### Nice to Have (Bonus Week)
| Feature | Priority | Complexity | Days |
|---------|----------|------------|------|
| Performance Bingo | P1 | Low | 2-3 |
| Setlist Diff Tool | P1 | Low | 1-2 |
| Song Trends | P1 | Medium | 1-2 |

---

## Development Workflow

### Daily Workflow
1. Pick task from current week
2. Create branch: `feat/task-name`
3. Implement with tests
4. Test on mobile
5. PR & review
6. Merge to main

### Testing Checklist
- [ ] Desktop Chrome
- [ ] Desktop Safari
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)
- [ ] Drag-and-drop works
- [ ] LocalStorage persists
- [ ] Share URLs work
- [ ] Export PNG works
- [ ] Language switching works

### Performance Targets
- [ ] Initial load < 3s
- [ ] Interaction < 100ms
- [ ] Drag smoothness 60fps
- [ ] Bundle size < 500KB (gzipped)

---

## Milestones

### Milestone 1: Can Create Predictions ✓
- Performance selection works
- Can add songs
- Can reorder via drag-and-drop
- Saves to LocalStorage

### Milestone 2: Can Score Predictions ✓
- Import actual setlist
- Matching algorithm works
- Scoring calculation
- View score breakdown

### Milestone 3: Can Share Predictions ✓
- Generate share URL
- Others can view
- Export as image
- QR codes

### Milestone 4: Ready to Share! 🎉
- Localization complete
- Mobile responsive
- All polish done
- Docs written

---

## Next Steps

1. **Start with data setup**: Run LLFans fetch scripts
2. **Create types**: Copy from DATA_MODELS.md
3. **Build performance list**: First user-facing feature
4. **Iterate weekly**: Review progress, adjust priorities

See [Technical Architecture](./TECHNICAL_ARCHITECTURE.md) for implementation details!

---

**Remember**: Phase 1 is 100% frontend. No backend needed. Perfect for sharing in group chats! 🚀
