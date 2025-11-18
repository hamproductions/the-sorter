# Spicy Features 🌶️

> Fun, engaging features that make setlist prediction addictive

These are the selected special features to make the prediction experience more engaging and shareable.

---

## 1. Performance Bingo 🎲

**Goal**: Lighter, casual game mode for group fun

### Concept
Instead of predicting exact setlist order, users get a randomized 5×5 bingo card with songs. Mark them off as they're performed during the show. First to complete a line wins!

### Features

**Card Generation**:
```typescript
interface BingoCard {
  id: string;
  performanceId: string;
  userId?: string;
  grid: (BingoCell | null)[][];        // 5×5, center can be "FREE"
  completedLines: BingoLine[];
  createdAt: string;
}

interface BingoCell {
  songId: string;
  marked: boolean;
  markedAt?: string;
}

interface BingoLine {
  type: 'row' | 'column' | 'diagonal';
  index: number;
  completedAt: string;
}
```

**Generation Strategy**:
- **Random**: Completely random songs from series
- **Weighted**: Based on song popularity/likelihood
- **Strategic**: User picks some songs, others are random
- **Challenge**: Only rare/unlikely songs

**Gameplay**:
1. Create or join bingo game before performance
2. Get randomized card (or multiple cards!)
3. During performance, mark songs as played
4. First to complete row/column/diagonal wins
5. Track "Blackout" (all cells) for bonus

**Social Aspect**:
- Share cards with friends (same songs, different positions)
- Group bingo rooms
- Live leaderboard during performance
- "Near miss" tracking (how close you were)

**UI Components**:
```typescript
// Bingo card display
function BingoCard({ card, onMarkCell }: BingoCardProps) {
  return (
    <Grid templateColumns="repeat(5, 1fr)" gap={2}>
      {card.grid.flat().map((cell, idx) => (
        <BingoCell
          key={idx}
          cell={cell}
          isFree={idx === 12} // Center cell
          onClick={() => cell && onMarkCell(cell.songId)}
        />
      ))}
    </Grid>
  );
}
```

**Implementation Priority**: Phase 1 - Easy win! 🎯

---

## 2. Prediction Heatmaps 🗺️

**Goal**: Visualize community prediction patterns

### Concept
Aggregate all predictions for a performance and show:
- Which songs are most/least predicted
- Position frequency (song X is predicted at position Y most often)
- Consensus vs divergent predictions
- Your prediction vs community average

### Visualizations

**Song Popularity Heatmap**:
```
Song A ████████████████ 89% predicted
Song B ███████████░░░░░ 67% predicted
Song C ██████░░░░░░░░░░ 34% predicted
Song D ███░░░░░░░░░░░░░ 12% predicted
```

**Position Heatmap**:
```
       Pos 1  Pos 2  Pos 3  Pos 4  Pos 5
Song A   45%    23%    12%     8%     6%
Song B    8%    34%    28%    15%     9%
Song C    2%     5%    18%    31%    24%
```

**Divergence Score**:
```typescript
interface DivergenceScore {
  predictionId: string;
  divergenceScore: number;           // 0-100, higher = more unique
  uniqueSongs: string[];             // Songs only you predicted
  missedCommonSongs: string[];       // Popular songs you missed
  boldPredictions: {
    songId: string;
    yourPosition: number;
    averagePosition: number;
    difference: number;
  }[];
}
```

**Data Structure**:
```typescript
interface CommunityHeatmap {
  performanceId: string;
  totalPredictions: number;

  songFrequency: {
    songId: string;
    count: number;
    percentage: number;
  }[];

  positionFrequency: {
    songId: string;
    positions: Record<number, number>; // position → count
    mostCommonPosition: number;
  }[];

  consensusSetlist: SetlistItem[];    // Average prediction

  updatedAt: string;
}
```

**UI Features**:
- Toggle between your prediction and community view
- Highlight where you differ from consensus
- "Spicy prediction" badge for divergent choices
- Compare mode: Your prediction vs community vs actual

**Phase 2 Feature** (needs backend to aggregate)

**Workaround for Phase 1**:
- Share predictions via URL
- Manually collect from friends
- Local heatmap from imported predictions

---

## 3. Setlist Diff Tool 📊

**Goal**: Compare multiple predictions side-by-side

### Concept
Visual comparison of 2+ predictions to see differences, similarities, and variations.

### Features

**Side-by-Side View**:
```
┌─────────────────┬─────────────────┬─────────────────┐
│ Prediction A    │ Prediction B    │ Prediction C    │
├─────────────────┼─────────────────┼─────────────────┤
│ 1. Song A       │ 1. Song A   [✓] │ 1. Song B       │
│ 2. Song B   [✓] │ 2. Song C       │ 2. Song A   [✓] │
│ 3. Song C   [✓] │ 3. Song B   [✓] │ 3. Song D       │
│ 4. Song D   [~] │ 4. Song E       │ 4. Song C   [✓] │
│ 5. Song E   [✓] │ 5. Song D   [~] │ 5. Song E   [✓] │
└─────────────────┴─────────────────┴─────────────────┘

Legend:
[✓] All predictions agree
[~] Some predictions agree
[ ] Unique to this prediction
```

**Diff Statistics**:
```typescript
interface SetlistDiff {
  predictions: string[];               // Prediction IDs being compared

  commonSongs: {
    songId: string;
    inAll: boolean;
    inCount: number;
    positions: Record<string, number>; // predictionId → position
    positionVariance: number;          // How much positions differ
  }[];

  uniqueSongs: Record<string, string[]>; // predictionId → unique songs

  similarityMatrix: number[][];        // Similarity scores between predictions

  consensusSongs: string[];            // Songs in majority of predictions
  divergentSongs: string[];            // Songs in minority
}
```

**Visual Diff Types**:
1. **Unified**: Single merged view with color coding
2. **Split**: Side-by-side columns
3. **Matrix**: Grid showing all combinations
4. **Venn Diagram**: Song overlap visualization

**Actions**:
- **Merge predictions**: Create new prediction combining elements
- **Copy from**: Pull songs from one prediction to another
- **Highlight differences**: Focus on unique choices
- **Export comparison**: Save diff as image/text

**Implementation**:
```typescript
function DiffView({ predictions }: { predictions: SetlistPrediction[] }) {
  const diff = useMemo(
    () => calculateDiff(predictions),
    [predictions]
  );

  return (
    <HStack align="start" gap={4}>
      {predictions.map((pred, idx) => (
        <Box key={pred.id} flex={1}>
          <Heading size="sm">{pred.name}</Heading>
          <Stack gap={2} mt={4}>
            {pred.setlist.items.map(item => {
              const commonality = getCommonality(item, diff);
              return (
                <DiffItem
                  key={item.id}
                  item={item}
                  commonality={commonality}
                  otherPositions={getOtherPositions(item, predictions)}
                />
              );
            })}
          </Stack>
        </Box>
      ))}
    </HStack>
  );
}
```

**Implementation Priority**: Phase 1 - Frontend only! 🎯

---

## 4. Song Performance Trends 📈

**Goal**: Analytics on song performance patterns

### Concept
Analyze historical data to show trends and help users make informed predictions.

### Trend Types

**1. Recency Trends**:
```typescript
interface RecencyTrend {
  songId: string;
  daysSinceLastPerformed: number;
  isOverdue: boolean;                  // Haven't been performed in a while
  averageGapDays: number;
  nextLikelyDate?: string;
}
```

**2. Position Trends**:
```typescript
interface PositionTrend {
  songId: string;
  averagePosition: number;
  positionStdDev: number;              // How consistent is position?
  mostCommonSection: string;
  positionTrend: 'rising' | 'falling' | 'stable';
  recentPositions: { date: string; position: number }[];
}
```

**3. Release Trends**:
```typescript
interface ReleaseTrend {
  newRelease: boolean;
  daysSinceRelease: number;
  typicalDebutTiming: number;          // When new songs usually debut
  likelyToDebut: boolean;
}
```

**4. Artist/Unit Trends**:
```typescript
interface ArtistTrend {
  artistId: string;
  averageSongsPerShow: number;
  preferredSections: string[];
  openingFrequency: number;            // % of times opens show
  encoreFrequency: number;
}
```

**5. Anniversary/Special Event Trends**:
```typescript
interface EventTrend {
  songId: string;
  anniversaryDate?: string;
  isAnniversary: boolean;
  specialEventLikelihood: number;      // Higher for milestone performances
  historicalSignificance: string;
}
```

### UI Components

**Trend Badge**:
```typescript
<SongCard song={song}>
  <TrendBadges>
    {song.trends.isOverdue && (
      <Badge colorScheme="orange">
        ⏰ Overdue ({song.trends.daysSinceLastPerformed}d)
      </Badge>
    )}
    {song.trends.newRelease && (
      <Badge colorScheme="green">
        ✨ New Release
      </Badge>
    )}
    {song.trends.positionTrend === 'rising' && (
      <Badge colorScheme="blue">
        📈 Rising
      </Badge>
    )}
  </TrendBadges>
</SongCard>
```

**Trend Chart**:
```typescript
function SongTrendChart({ songId }: { songId: string }) {
  const history = useSongHistory(songId);

  return (
    <LineChart
      data={history.performances.map(p => ({
        date: p.date,
        position: p.position
      }))}
      xAxis="date"
      yAxis="position"
      yReverse={true} // Position 1 at top
    />
  );
}
```

**Smart Suggestions**:
```typescript
function SmartSuggestions({ performanceId }: { performanceId: string }) {
  const suggestions = useSmartSuggestions(performanceId);

  return (
    <Stack gap={2}>
      <Heading size="sm">📊 Trend-based Suggestions</Heading>

      {suggestions.likelyOpeners.map(song => (
        <SuggestionCard
          key={song.id}
          song={song}
          reason="Often opens this artist's shows"
          confidence={0.85}
        />
      ))}

      {suggestions.overdueHits.map(song => (
        <SuggestionCard
          key={song.id}
          song={song}
          reason={`Not performed in ${song.daysSince} days`}
          confidence={0.72}
        />
      ))}

      {suggestions.newReleases.map(song => (
        <SuggestionCard
          key={song.id}
          song={song}
          reason="Recent release, likely debut"
          confidence={0.68}
        />
      ))}
    </Stack>
  );
}
```

**Implementation Priority**: Phase 1 - Build from performance-history.json! 🎯

---

## 5. Social Prediction Rooms 👥

**Goal**: Create prediction parties with friends

### Concept
Create a "room" where multiple people can:
- Discuss and make predictions together
- Share insights and strategies
- Compete in real-time
- React to each other's choices

### Phase 1 (URL-based, No Backend)

**Room Creation**:
```typescript
interface PredictionRoom {
  id: string;
  name: string;
  performanceId: string;
  host: string;                        // Name, not user ID

  // URL-shareable room code
  shareCode: string;                   // Compressed room data

  // Participants (P2P style)
  participants: {
    name: string;
    predictionUrl: string;             // Their shared prediction URL
    joinedAt: string;
  }[];

  createdAt: string;
}
```

**How It Works** (Phase 1):
1. User creates room, gets shareable URL
2. Friends join via URL, add their names
3. Each creates prediction, shares URL back to room
4. Room page displays everyone's predictions
5. Real-time updates via `BroadcastChannel` API (same origin only)

```typescript
// P2P sync using BroadcastChannel
const channel = new BroadcastChannel('prediction-room-${roomId}');

// Send updates
channel.postMessage({
  type: 'PREDICTION_UPDATE',
  user: userName,
  predictionUrl: shareUrl
});

// Receive updates
channel.onmessage = (event) => {
  if (event.data.type === 'PREDICTION_UPDATE') {
    updateRoomState(event.data);
  }
};
```

**Room Features**:
- **Leaderboard**: Compare scores after show
- **Live reactions**: Emoji reactions to predictions
- **Room chat**: Simple P2P message passing
- **Voting**: Vote on "boldest prediction", "safest pick", etc.

**UI Layout**:
```
┌────────────────────────────────────────────────┐
│ 🎉 Pre-Show Prediction Party                  │
│ 5 participants • AZALEA 1st Live             │
├────────────────────────────────────────────────┤
│ [Share Room Code: abc123]                     │
├────────────────────────────────────────────────┤
│ 👤 Alice - [View Prediction] 👍 5             │
│ 👤 Bob - [View Prediction] 🔥 3               │
│ 👤 Carol - [View Prediction] 👍 8             │
│ 👤 You - [Edit Prediction]                    │
├────────────────────────────────────────────────┤
│ 💬 Room Chat:                                 │
│ Alice: I'm going all in on rare songs!       │
│ Bob: Playing it safe this time 😅            │
│ You: [Type message...]                        │
└────────────────────────────────────────────────┘
```

**Implementation Priority**:
- Phase 1 basics (share & compare) ✅
- Phase 2 real-time features 🔮

### Phase 2 (With Backend)

**Enhanced Features**:
- Persistent rooms
- Real-time collaboration on single prediction
- Video/voice chat integration
- Automated scoring and leaderboards
- Private vs public rooms
- Room history and replays

**Firebase Integration**:
```typescript
// Realtime Database structure
/rooms
  /{roomId}
    /info: { name, performanceId, host, created }
    /participants
      /{userId}: { name, predictionId, joinedAt }
    /predictions
      /{predictionId}: { ... full prediction }
    /chat
      /{messageId}: { user, message, timestamp }
    /reactions
      /{reactionId}: { user, predictionId, emoji, timestamp }
```

---

## Implementation Summary

### Phase 1 (Frontend-Only) Priorities:

1. **✅ Performance Bingo**: Easy, fun, great for groups
   - Can work fully offline
   - No backend needed
   - High engagement

2. **✅ Setlist Diff Tool**: Pure frontend feature
   - Compare local predictions
   - Visual diff algorithms
   - Export comparisons

3. **✅ Song Performance Trends**: Data-driven suggestions
   - Build from performance-history.json
   - Read-only analytics
   - Smart suggestions

4. **⚠️ Social Prediction Rooms** (Limited): Basic share & compare
   - URL-based rooms
   - BroadcastChannel for same-tab updates
   - Manual prediction sharing

5. **❌ Prediction Heatmaps**: Requires backend
   - Phase 2 feature
   - Alternative: Manual collection and local aggregation

### Quick Wins:
1. Bingo mode (weekend project!)
2. Diff tool (reuse existing components)
3. Trend badges (read from JSON)

### Future Enhancements:
- AI predictions based on trends
- Fantasy league scoring
- Outfit predictions (Phase 4)
- Live scoring during shows

---

**Next Steps**: See [Implementation Plan](./IMPLEMENTATION_PLAN.md) for build order! 🚀
