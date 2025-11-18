# LLFans Integration

> Understanding and integrating LLFans performance data for setlist predictions

## Overview

LLFans (https://ll-fans.jp/) provides comprehensive Love Live! performance data through a GraphQL API. This document explains:
- The LLFans data structure
- How to map it to our prediction models
- Using existing fetch scripts
- Data transformation requirements

## LLFans Data Structure

### Hierarchy

```
Tour (ツアー/イベント)
└── Concert (公演)
    └── Performance (出演)
        └── Setlist (セットリスト)
            ├── Song (楽曲)
            ├── MC (トーク)
            ├── VTR (映像)
            └── Other (その他)
```

### 1. Tour Schema

**GraphQL Query**: `EventDetailPage`

```typescript
interface LLFansTour {
  id: string;
  name: string;                    // Tour name
  note: string | null;             // Additional notes
  seriesIds: string[];             // Related series (1=μ's, 2=Aqours, etc.)
  startsOn: string;                // ISO date
  endsOn: string;                  // ISO date
  url: string;                     // Official tour URL
  tourType: {
    name: string;                  // "ライブ・ファンミ", etc.
    __typename: "TourType";
  };
  concerts: LLFansConcert[];
  __typename: "Tour";
}
```

**Example**:
```json
{
  "id": "264",
  "name": "ラブライブ！蓮ノ空女学院スクールアイドルクラブ 5th Live Tour ～4Pair Power Spread!!!!～",
  "seriesIds": ["6"],
  "startsOn": "2025-10-04",
  "endsOn": "2025-12-07",
  "url": "https://www.lovelive-anime.jp/hasunosora/...",
  "tourType": { "name": "ライブ・ファンミ" }
}
```

### 2. Concert Schema

```typescript
interface LLFansConcert {
  id: string;
  name: string;                    // Concert name within tour
  startsOn: string;                // ISO date
  endsOn: string;                  // ISO date
  note: string | null;             // Special notes
  venue: {
    id: string;
    name: string;                  // "国立代々木競技場 第一体育館"
    __typename: "Venue";
  };
  performances: LLFansPerformance[];
  __typename: "Concert";
}
```

**Example**:
```json
{
  "id": "380",
  "name": "みらくらぱーく！ presents Heart Stage cross Bloom Days Extra",
  "startsOn": "2025-10-04",
  "endsOn": "2025-10-05",
  "venue": {
    "id": "6",
    "name": "国立代々木競技場 第一体育館"
  },
  "performances": [
    { "id": "655", "name": "Day.1" },
    { "id": "656", "name": "Day.2" }
  ]
}
```

### 3. Performance Schema

**GraphQL Query**: `EventDetailPage_PerformanceDetail`

```typescript
interface LLFansPerformance {
  id: string;
  name: string;                    // "Day.1", "Day.2", etc.
  canceled: boolean;               // Was it canceled?
  audience: boolean;               // Had audience?
  date: string;                    // ISO date
  openTime: string;                // "15:30:00"
  startTime: string;               // "17:00:00"
  note: string | null;
  mcChecked: boolean;              // MC segments verified?
  hideCostumes: boolean;           // Hide costume info?
  setlists: LLFansSetlist[];
  __typename: "Performance";
}
```

### 4. Setlist Item Schema

```typescript
interface LLFansSetlist {
  id: string;
  indexPrefix: string;             // "M", "EN", null
  indexNumber: number | null;      // Position number (can be null)

  // Content (mutually exclusive)
  content: {
    __typename: "Song" | "CollaborationSong";
    id: string;                    // Song ID (if Song)
    name: string;
    seriesIds: number[];
  } | null;

  contentTypeOther: string | null; // "MC①", "上映", "幕間①", "Encore", etc.

  note: string | null;             // "105期 Ver.", etc.
  premiere: boolean;               // First performance?

  costumes: LLFansCostume[];
  __typename: "Setlist";
}

interface LLFansCostume {
  id: string;
  name: string | null;
  song: {
    name: string;
    __typename: "Song";
  } | null;
  __typename: "Costume";
}
```

**Setlist Item Types**:
- **Song**: `content` is Song object, `contentTypeOther` is null
- **MC/VTR/Other**: `content` is null, `contentTypeOther` has value
- **Section marker**: `contentTypeOther` = "Encore", "幕間①", etc.

**Examples**:

Song item:
```json
{
  "id": "10725",
  "indexPrefix": "M",
  "indexNumber": null,
  "content": {
    "__typename": "Song",
    "id": "502",
    "name": "Dream Believers",
    "seriesIds": [6]
  },
  "contentTypeOther": null,
  "note": "105期 Ver.",
  "premiere": false,
  "costumes": [...]
}
```

MC item:
```json
{
  "id": "10727",
  "indexPrefix": "M",
  "indexNumber": null,
  "content": null,
  "contentTypeOther": "MC①",
  "note": null,
  "premiere": false,
  "costumes": [...]
}
```

Encore marker:
```json
{
  "id": "10755",
  "indexPrefix": "M",
  "indexNumber": null,
  "content": null,
  "contentTypeOther": "Encore",
  "note": null,
  "premiere": false,
  "costumes": []
}
```

## Data Mapping

### LLFans → Our Models

#### Tour/Concert → Performance

```typescript
// LLFans has: Tour → Concert → Performance
// We simplify to: Performance (single predictable unit)

function mapToPerformance(
  tour: LLFansTour,
  concert: LLFansConcert,
  performance: LLFansPerformance
): Performance {
  return {
    id: performance.id,
    name: `${tour.name} - ${concert.name} (${performance.name})`,
    nameJa: performance.name,
    date: performance.date,
    venue: concert.venue.name,
    venueJa: concert.venue.name,
    seriesIds: tour.seriesIds,
    artistIds: [], // Extract from setlist songs

    source: 'llfans',
    llfansId: performance.id,

    // If performance has setlists, it's completed
    status: performance.setlists?.length > 0 ? 'completed' : 'upcoming',

    // Map actual setlist if exists
    actualSetlist: performance.setlists
      ? mapSetlists(performance.setlists, performance.id)
      : undefined,

    imageUrl: undefined, // Would need separate fetch
    description: tour.note || concert.note,
    tags: [tour.tourType.name],

    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}
```

#### LLFansSetlist → SetlistItem

```typescript
function mapSetlistItem(
  llfansItem: LLFansSetlist,
  position: number
): SetlistItem {
  // Song item
  if (llfansItem.content) {
    return {
      id: llfansItem.id,
      type: 'song',
      position,
      songId: llfansItem.content.id,
      remarks: llfansItem.note || undefined,
      section: inferSection(position, llfansItem.indexPrefix)
    };
  }

  // Encore marker
  if (llfansItem.contentTypeOther === 'Encore') {
    // This is a section marker, not an item
    return null; // Handle separately for sections
  }

  // MC/VTR/Other
  const itemType = inferItemType(llfansItem.contentTypeOther);
  return {
    id: llfansItem.id,
    type: itemType,
    position,
    title: llfansItem.contentTypeOther!,
    titleJa: llfansItem.contentTypeOther!,
    section: inferSection(position, llfansItem.indexPrefix)
  };
}

function inferItemType(contentTypeOther: string): SetlistItemType {
  if (contentTypeOther.startsWith('MC')) return 'mc';
  if (contentTypeOther.includes('上映') || contentTypeOther.includes('映像')) return 'vtr';
  if (contentTypeOther.includes('幕間')) return 'vtr';
  return 'custom';
}

function inferSection(position: number, indexPrefix: string): string {
  if (indexPrefix === 'EN') return 'Encore';
  return 'Main';
}
```

#### Building Sections

```typescript
function buildSections(setlists: LLFansSetlist[]): PerformanceSetlist['sections'] {
  const sections: PerformanceSetlist['sections'] = [];
  let currentSection = 'Main';
  let sectionStart = 0;

  setlists.forEach((item, idx) => {
    // Check for section markers
    if (item.contentTypeOther === 'Encore' || item.indexPrefix === 'EN') {
      // Close current section
      if (sectionStart < idx) {
        sections.push({
          name: currentSection,
          startIndex: sectionStart,
          endIndex: idx - 1,
          type: currentSection === 'Main' ? 'main' : 'encore'
        });
      }

      // Start new section
      currentSection = 'Encore';
      sectionStart = idx + 1; // Skip the marker itself
    }
  });

  // Close final section
  sections.push({
    name: currentSection,
    startIndex: sectionStart,
    endIndex: setlists.length - 1,
    type: currentSection === 'Main' ? 'main' : 'encore'
  });

  return sections;
}
```

## Using Existing Fetch Scripts

You mentioned having scripts to fetch LLFans data. Here's how to integrate:

### Expected Script Output

Your scripts should fetch and save:

```typescript
// data/performances/raw/llfans-tours.json
interface LLFansToursData {
  tours: LLFansTour[];
  fetchedAt: string;
}

// data/performances/raw/llfans-performances.json
interface LLFansPerformancesData {
  performances: Map<string, {
    performance: LLFansPerformance;
    concert: LLFansConcert;
    tour: LLFansTour;
  }>;
  fetchedAt: string;
}
```

### Build Script

Create `scripts/build-performances.ts`:

```typescript
import llfansTours from '../data/performances/raw/llfans-tours.json';
import llfansPerformances from '../data/performances/raw/llfans-performances.json';
import songData from '../data/song-info.json';

// Map all performances
const performances: Performance[] = [];

for (const [perfId, data] of Object.entries(llfansPerformances.performances)) {
  const mapped = mapToPerformance(
    data.tour,
    data.concert,
    data.performance
  );
  performances.push(mapped);
}

// Save processed data
fs.writeFileSync(
  'data/performances/performances.json',
  JSON.stringify(performances, null, 2)
);

// Build song performance history
const songHistory: Record<string, PerformanceHistoryCache> = {};

for (const perf of performances) {
  if (!perf.actualSetlist) continue;

  for (const item of perf.actualSetlist.items) {
    if (item.type !== 'song') continue;

    const songId = item.songId;
    if (!songHistory[songId]) {
      songHistory[songId] = {
        songId,
        performances: [],
        lastUpdated: new Date().toISOString()
      };
    }

    songHistory[songId].performances.push({
      id: perf.id,
      name: perf.name,
      date: perf.date,
      position: item.position,
      section: item.section || 'Main',
      artistIds: perf.artistIds
    });
  }
}

// Save history
fs.writeFileSync(
  'data/performances/performance-history.json',
  JSON.stringify(songHistory, null, 2)
);
```

### Fetching Live Data

For upcoming performances without setlists:

```typescript
// Fetch tour data
const tourQuery = {
  operationName: "EventDetailPage",
  variables: { id: "264" },
  query: `query EventDetailPage($id: ID!) { ... }`
};

const response = await fetch('https://ll-fans.jp/graphql', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(tourQuery)
});

const { data } = await response.json();
const tour = data.tour;

// For each performance, fetch details
for (const concert of tour.concerts) {
  for (const perf of concert.performances) {
    const perfQuery = {
      operationName: "EventDetailPage_PerformanceDetail",
      variables: { id: perf.id },
      query: `query EventDetailPage_PerformanceDetail($id: ID!) { ... }`
    };

    const perfResponse = await fetch('https://ll-fans.jp/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(perfQuery)
    });

    const perfData = await perfResponse.json();
    // Save for processing...
  }
}
```

## Data Files Structure

```
data/
└── performances/
    ├── raw/                           # Raw LLFans data
    │   ├── llfans-tours.json
    │   └── llfans-performances.json
    │
    ├── performances.json              # Processed performances
    ├── performance-history.json       # Song performance history
    └── venues.json                    # Venue database (optional)
```

## Handling Special Cases

### 1. Virtual Lives

LLFans includes virtual lives (e.g., "バーチャルライブ"):

```typescript
if (item.contentTypeOther?.includes('バーチャル')) {
  // Mark as special/virtual
  item.metadata = { virtual: true };
}
```

### 2. Multi-part Performances

Some items have version notes (e.g., "105期 Ver."):

```typescript
if (item.note?.includes('Ver.')) {
  // Store in remarks
  mappedItem.remarks = item.note;
}
```

### 3. Premiere Performances

LLFans marks premieres with `premiere: true`:

```typescript
if (llfansItem.premiere) {
  // Could give bonus points for predicting premieres
  mappedItem.metadata = { premiere: true };
}
```

### 4. Costume Changes

Costumes are tracked per item but not needed for basic prediction:

```typescript
// Optional: Store for Phase 4 (outfit prediction)
if (llfansItem.costumes.length > 0) {
  mappedItem.metadata = {
    costumes: llfansItem.costumes.map(c => ({
      id: c.id,
      name: c.name
    }))
  };
}
```

## API Rate Limiting

If fetching directly from LLFans:
- Cache responses locally
- Implement exponential backoff
- Fetch in batches
- Update only changed data

```typescript
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

async function fetchWithCache<T>(
  key: string,
  fetcher: () => Promise<T>
): Promise<T> {
  const cached = localStorage.getItem(`llfans-cache-${key}`);

  if (cached) {
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < CACHE_DURATION) {
      return data;
    }
  }

  const data = await fetcher();
  localStorage.setItem(
    `llfans-cache-${key}`,
    JSON.stringify({ data, timestamp: Date.now() })
  );

  return data;
}
```

## Next Steps

1. **Run existing fetch scripts** to get raw LLFans data
2. **Create build script** to transform LLFans data to our models
3. **Integrate in app** by importing processed JSON files
4. **Update periodically** as new performances are added

## Related Docs

- [Data Models](./DATA_MODELS.md) - Our prediction data structures
- [Technical Architecture](./TECHNICAL_ARCHITECTURE.md) - Where data files live
- [Implementation Plan](./IMPLEMENTATION_PLAN.md) - Build order

---

**Key Takeaway**: LLFans provides everything we need! Use existing scripts to fetch, then transform to our simpler Performance model. 🎯
