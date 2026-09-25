import characterInfo from '../../../data/character-info.json';
import performanceInfo from '../../../data/performance-info.json';
import performanceSetlists from '../../../data/performance-setlists.json';
import songInfo from '../../../data/song-info.json';
import { type CanonicalFilter, toCharacterFilter, toSongFilter } from './filters';
import type { Character } from '~/types';
import type { RankingKind, RankingMode } from '~/types/global-ranking';
import type { Performance, PerformanceSetlist } from '~/types/setlist-prediction';
import type { Song } from '~/types/songs';
import { getCharacterSortList } from '~/utils/character';
import { buildPerformanceSortSelection } from '~/utils/performance-sort';
import { getSongSortList } from '~/utils/song-sort-list';

interface Dataset {
  characters: Character[];
  songs: Song[];
  performances: Performance[];
  setlists: Record<string, PerformanceSetlist>;
}

const isArrayOfIds = (value: unknown): value is { id: unknown }[] =>
  Array.isArray(value) &&
  value.length > 0 &&
  value.every((v) => v && typeof v === 'object' && 'id' in v);

export class DataStore {
  private data: Dataset;
  private universes = new Map<string, Set<string>>();

  constructor(data?: Dataset) {
    this.data = data ?? {
      characters: characterInfo as Character[],
      songs: songInfo as Song[],
      performances: performanceInfo as unknown as Performance[],
      setlists: performanceSetlists as unknown as Record<string, PerformanceSetlist>
    };
  }

  get characters() {
    return this.data.characters;
  }

  get songs() {
    return this.data.songs;
  }

  async refresh(baseUrl: string, fetcher: typeof fetch = fetch) {
    const load = async (name: string) => {
      const res = await fetcher(`${baseUrl}/${name}.json`);
      if (!res.ok) throw new Error(`Failed to fetch ${name}: ${res.status}`);
      return (await res.json()) as unknown;
    };
    const [characters, songs, performances, setlists] = await Promise.all([
      load('character-info'),
      load('song-info'),
      load('performance-info'),
      load('performance-setlists')
    ]);
    if (
      !isArrayOfIds(characters) ||
      !isArrayOfIds(songs) ||
      !isArrayOfIds(performances) ||
      !setlists ||
      typeof setlists !== 'object' ||
      Array.isArray(setlists)
    ) {
      throw new Error('Fetched data has an unexpected shape');
    }
    this.data = {
      characters: characters as Character[],
      songs: songs as Song[],
      performances: performances as Performance[],
      setlists: setlists as Record<string, PerformanceSetlist>
    };
    this.universes.clear();
  }

  universe(kind: RankingKind, mode: RankingMode) {
    const key = kind === 'character' ? `${kind}:${mode}` : kind;
    let set = this.universes.get(key);
    if (!set) {
      set = new Set(
        kind === 'character'
          ? getCharacterSortList(this.data.characters, mode === 'seiyuu').map((c) => c.id)
          : this.data.songs.map((s) => s.id)
      );
      this.universes.set(key, set);
    }
    return set;
  }

  deriveItems(
    kind: RankingKind,
    mode: RankingMode,
    filter: CanonicalFilter,
    performanceIds: string[]
  ): string[] | undefined {
    if (kind === 'character') {
      return getCharacterSortList(
        this.data.characters,
        mode === 'seiyuu',
        toCharacterFilter(filter)
      ).map((c) => c.id);
    }
    const songFilter = toSongFilter(filter);
    if (mode === 'normal' || mode === 'heardle') {
      return getSongSortList(this.data.songs, songFilter, { heardleMode: mode === 'heardle' }).map(
        (s) => s.id
      );
    }
    if (performanceIds.length === 0) return undefined;
    const setlistsByPerformanceId = new Map(
      performanceIds.flatMap((id) => {
        const setlist = this.data.setlists[id];
        return setlist ? ([[id, setlist]] as const) : [];
      })
    );
    const selection = buildPerformanceSortSelection(
      performanceIds,
      this.data.performances,
      setlistsByPerformanceId,
      this.data.songs
    );
    if (!selection) return undefined;
    return getSongSortList(this.data.songs, songFilter, {
      performanceSongIds: selection.songIds
    }).map((s) => s.id);
  }
}
