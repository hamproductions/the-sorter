import type {
  CollabPerformer,
  PerformanceSortMeta,
  SetlistOrderEntry
} from '~/types/performance-sort';
import type { Performance, PerformanceSetlist } from '~/types/setlist-prediction';
import type { Song } from '~/types/songs';
import { isSongItem } from '~/types/setlist-prediction';
import { getFullPerformanceName } from './names';
import artistsInfo from '../../data/artists-info.json';
import characterInfo from '../../data/character-info.json';
import seriesInfo from '../../data/series-info.json';

const MAIN_GROUP_ARTIST_IDS = new Set(['1', '33', '60', '91', '127', '187', '133', '213']);
const RECOGNIZED_GROUP_ARTIST_IDS = new Set([
  ...MAIN_GROUP_ARTIST_IDS,
  '2',
  '3',
  '4',
  '32',
  '34',
  '35',
  '36',
  '37',
  '61',
  '62',
  '63',
  '99',
  '110',
  '134',
  '135',
  '136',
  '160',
  '161',
  '162',
  '194',
  '201'
]);

const artistById = new Map(artistsInfo.map((a) => [String(a.id), a]));
const seriesById = new Map(seriesInfo.map((s) => [String(s.id), s]));

const groupAliases = new Map<string, (typeof artistsInfo)[number]>();
for (const artist of artistsInfo) {
  if (RECOGNIZED_GROUP_ARTIST_IDS.has(String(artist.id))) {
    groupAliases.set(artist.name.trim(), artist);
  }
}
const nijigasakiArtist = artistById.get('60');
if (nijigasakiArtist) {
  groupAliases.set('虹ヶ咲', nijigasakiArtist);
  groupAliases.set('ニジガク', nijigasakiArtist);
}
const hasunosoraArtist = artistById.get('133');
if (hasunosoraArtist) {
  groupAliases.set('蓮ノ空', hasunosoraArtist);
}

const MANUAL_CHARACTER_ALIASES: Record<string, string> = {
  穂乃果: '1',
  絵里: '2',
  ことり: '3',
  海未: '4',
  凛: '5',
  真姫: '6',
  希: '7',
  花陽: '8',
  にこ: '9',
  千歌: '13',
  梨子: '14',
  果南: '15',
  ダイヤ: '16',
  曜: '17',
  善子: '18',
  花丸: '19',
  鞠莉: '20',
  ルビィ: '21',
  聖良: '22',
  理亞: '23',
  歩夢: '24',
  かすみ: '25',
  しずく: '26',
  果林: '27',
  愛: '28',
  彼方: '29',
  せつ菜: '30',
  エマ: '31',
  璃奈: '32',
  栞子: '33',
  ミア: '34',
  嵐珠: '35',
  ランジュ: '35',
  侑: '36',
  かのん: '37',
  可可: '38',
  千砂都: '39',
  すみれ: '40',
  恋: '41',
  きな子: '42',
  メイ: '43',
  四季: '44',
  夏美: '45',
  マルガレーテ: '48',
  冬毬: '65',
  花帆: '59',
  さやか: '60',
  梢: '61',
  綴理: '62',
  瑠璃乃: '63',
  慈: '64',
  小鈴: '66',
  吟子: '67',
  姫芽: '68',
  泉: '79',
  セラス: '80',
  ポルカ: '81',
  麻衣: '82',
  玲: '83',
  花火: '84',
  奇跡: '85',
  のりこ: '86',
  ゆくり: '87',
  輝夜: '88',
  真緑: '89',
  翔音: '90'
};

const characterAliases = new Map<string, string>(Object.entries(MANUAL_CHARACTER_ALIASES));
for (const chara of characterInfo) {
  characterAliases.set(chara.fullName, String(chara.id));
  characterAliases.set(chara.fullName.replace(/\s+/g, ''), String(chara.id));
}

function getOriginalSongPool(song?: Song): { characterIds: Set<string>; artistIds: Set<string> } {
  const characterIds = new Set<string>();
  const artistIds = new Set<string>((song?.artists ?? []).map((a) => String(a.id)));

  for (const sa of song?.artists ?? []) {
    const artist = artistById.get(String(sa.id));
    if (!artist) continue;
    for (const cid of artist.characters ?? []) {
      if (cid) characterIds.add(String(cid));
    }
    if (MAIN_GROUP_ARTIST_IDS.has(String(artist.id))) {
      const seriesSet = new Set((artist.seriesIds ?? []).map(String));
      for (const chara of characterInfo) {
        if (seriesSet.has(String(chara.seriesId))) {
          characterIds.add(String(chara.id));
        }
      }
    }
  }

  for (const chara of characterInfo) {
    for (const unit of chara.units ?? []) {
      if (artistIds.has(String(unit.id))) {
        characterIds.add(String(chara.id));
      }
    }
  }

  return { characterIds, artistIds };
}

export function parseSetlistPerformers(
  remarks: string | undefined,
  song?: Song
): CollabPerformer[] | undefined {
  if (!remarks) return undefined;
  const { characterIds: originalCharIds, artistIds: originalArtistIds } = getOriginalSongPool(song);
  const protectedNames = [
    'エマ・ヴェルデ',
    'ミア・テイラー',
    'ウィーン・マルガレーテ',
    'A・ZU・NA'
  ];
  const segments = remarks
    .split(/[｜|]/)
    .map((s) => s.trim())
    .filter(Boolean);

  for (const seg of segments) {
    const cleaned = seg.replace(/\s*Ver\.?$/i, '').trim();
    let work = cleaned;
    protectedNames.forEach((name, idx) => {
      work = work.replaceAll(name, `__PROT_${idx}__`);
    });

    const tokens = work
      .split(/[、,・×✕&＆/／]/)
      .map((token) => {
        let restored = token.trim();
        protectedNames.forEach((name, idx) => {
          restored = restored.replaceAll(`__PROT_${idx}__`, name);
        });
        return restored.replace(/[（(][^）)]*[）)]$/u, '').trim();
      })
      .filter(Boolean);

    if (tokens.length === 0) continue;

    const performers: CollabPerformer[] = [];
    let unrecognized = 0;

    for (const tok of tokens) {
      const group = groupAliases.get(tok);
      if (group) {
        const seriesColor = seriesById.get(String(group.seriesIds?.[0]))?.color;
        performers.push({
          kind: 'group',
          id: String(group.id),
          name: group.name.trim(),
          englishName: (group as { englishName?: string }).englishName,
          color: seriesColor
        });
        continue;
      }

      const charId = characterAliases.get(tok) ?? characterAliases.get(tok.replace(/\s+/g, ''));
      if (charId) {
        performers.push({
          kind: 'member',
          characterId: charId
        });
        continue;
      }

      unrecognized++;
    }

    if (performers.length > 0 && unrecognized === 0) {
      const hasOutsidePerformer = performers.some((p) => {
        if (p.kind === 'group') return !originalArtistIds.has(p.id);
        return !originalCharIds.has(p.characterId);
      });
      if (!hasOutsidePerformer) return undefined;
      return performers;
    }
  }

  return undefined;
}

export function getPerformerSignature(performers?: CollabPerformer[]): string {
  if (!performers || performers.length === 0) return 'original';
  return performers.map((p) => (p.kind === 'group' ? `G:${p.id}` : `M:${p.characterId}`)).join(',');
}

export interface SongPerformanceDisplayEntry {
  dayLabel?: string;
  label: string;
  remarks?: string;
  performers?: CollabPerformer[];
}

export function getDistinctSongPerformanceEntries(
  songId: string,
  setlistOrder?: SetlistOrderEntry[]
): SongPerformanceDisplayEntry[] {
  if (!setlistOrder || setlistOrder.length === 0) return [];
  const matches = setlistOrder.filter((entry) => entry.songId === songId);
  if (matches.length === 0) return [];

  if (matches.length === 1) {
    const entry = matches[0];
    return [
      {
        label: entry.label,
        remarks: entry.remarks,
        performers: entry.performers
      }
    ];
  }

  const firstLineupSig = getPerformerSignature(matches[0].performers);
  const allIdentical = matches.every((m) => getPerformerSignature(m.performers) === firstLineupSig);

  if (allIdentical) {
    return [
      {
        label: matches.map((m) => m.label).join(' / '),
        performers: matches[0].performers
      }
    ];
  }

  return matches.map((entry) => ({
    dayLabel: entry.performanceName ?? entry.label,
    label: entry.label,
    performers: entry.performers
  }));
}

export function computeSetlistLabels(setlist: PerformanceSetlist): SetlistOrderEntry[] {
  const { items, sections } = setlist;
  const entries: SetlistOrderEntry[] = [];

  const getSectionType = (index: number): string => {
    for (const section of sections) {
      if (index >= section.startIndex && index <= section.endIndex) {
        return section.type ?? 'main';
      }
    }
    return 'main';
  };

  const songCountBySection: Record<string, number> = {};

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!isSongItem(item)) continue;

    const sectionType = getSectionType(i);
    songCountBySection[sectionType] = (songCountBySection[sectionType] ?? 0) + 1;

    let label: string;
    if (sectionType === 'encore') {
      label = `EN${songCountBySection[sectionType].toString().padStart(2, '0')}`;
    } else {
      label = `M${songCountBySection[sectionType].toString().padStart(2, '0')}`;
    }
    entries.push({ songId: item.songId, label });
  }

  return entries;
}

function normalizeSongName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function createSongLookup(songs: Song[]) {
  const lookup = new Map<string, string | null>();

  for (const song of songs) {
    for (const candidate of [song.name, song.englishName, song.phoneticName]) {
      if (!candidate) continue;
      const key = normalizeSongName(candidate);
      if (!key) continue;

      if (!lookup.has(key)) {
        lookup.set(key, song.id);
        continue;
      }

      if (lookup.get(key) !== song.id) {
        lookup.set(key, null);
      }
    }
  }

  return lookup;
}

export function computeSortableSetlistLabels(
  setlist: PerformanceSetlist,
  songs: Song[]
): SetlistOrderEntry[] {
  const songLookup = createSongLookup(songs);
  const songMap = new Map(songs.map((song) => [song.id, song]));

  return computeSetlistLabels(setlist).flatMap((entry, index) => {
    const item = setlist.items.filter(isSongItem)[index];
    const customSongName = item?.customSongName?.trim();
    const normalizedCustomSongName = customSongName ? normalizeSongName(customSongName) : '';
    const resolvedSongId = normalizedCustomSongName
      ? (songLookup.get(normalizedCustomSongName) ?? undefined)
      : undefined;
    const sourceSong = songMap.get(entry.songId);
    const matchesSourceSong =
      sourceSong &&
      normalizedCustomSongName &&
      [sourceSong.name, sourceSong.englishName, sourceSong.phoneticName]
        .filter((name): name is string => Boolean(name))
        .some((name) => normalizeSongName(name) === normalizedCustomSongName);
    const songId = customSongName
      ? (resolvedSongId ?? (matchesSourceSong ? entry.songId : undefined))
      : sourceSong?.id;

    if (!songId) return [];

    const resolvedSong = songMap.get(songId);
    const remarks = item?.remarks?.trim() || undefined;
    const performers = parseSetlistPerformers(remarks, resolvedSong);

    return [
      {
        ...entry,
        songId,
        ...(remarks ? { remarks } : {}),
        ...(performers ? { performers } : {})
      }
    ];
  });
}

export function getPerformanceLegName(performance: Performance): string {
  const name = performance.performanceName?.trim();
  if (!name) return performance.tourName;

  const withoutSuffix = name
    .replace(/\s*[(（][^()（）]*[)）]\s*$/u, '')
    .replace(/\s*(?:Day\.?\s*\d+|DAY\s*\d+)$/u, '')
    .trim();

  return withoutSuffix || name;
}

export function getPerformanceSelectionLabel(performances: Performance[]): string {
  if (performances.length === 0) return '';
  if (performances.length === 1) return getFullPerformanceName(performances[0]);

  const tourNames = new Set(performances.map((performance) => performance.tourName));
  if (tourNames.size === 1) {
    const tourName = performances[0].tourName;
    const legNames = new Set(performances.map(getPerformanceLegName));
    if (legNames.size === 1) {
      const legName = [...legNames][0];
      if (legName !== tourName) {
        return `${tourName} - ${legName} (${performances.length} performances)`;
      }
    }
    return `${tourName} (${performances.length} performances)`;
  }

  return `${performances.length} performances`;
}

export function buildPerformanceSortSelection(
  performanceIds: string[],
  performances: Performance[],
  setlistsByPerformanceId: Map<string, PerformanceSetlist>,
  songs: Song[]
): { songIds: string[]; meta: PerformanceSortMeta } | undefined {
  const selectedIds = new Set(performanceIds);
  const selectedPerformances = performances
    .filter((performance) => selectedIds.has(performance.id))
    .toSorted((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (selectedPerformances.length === 0) return undefined;

  const orderEntries = selectedPerformances.flatMap((performance) => {
    const setlist = setlistsByPerformanceId.get(performance.id);
    if (!setlist) return [];

    return computeSortableSetlistLabels(setlist, songs).map((entry) => ({
      ...entry,
      label:
        selectedPerformances.length > 1
          ? `${performance.performanceName ?? performance.tourName} ${entry.label}`
          : entry.label,
      performanceId: performance.id,
      performanceName: performance.performanceName ?? performance.tourName,
      date: performance.date
    }));
  });
  const uniqueSongIds = [...new Set(orderEntries.map((entry) => entry.songId))];
  if (uniqueSongIds.length === 0) return undefined;

  const firstPerformance = selectedPerformances[0];
  const selectionLabel = getPerformanceSelectionLabel(selectedPerformances);
  return {
    songIds: uniqueSongIds,
    meta: {
      performanceId: selectedPerformances.length === 1 ? selectedPerformances[0].id : undefined,
      performanceIds: selectedPerformances.map((performance) => performance.id),
      tourName: firstPerformance.tourName,
      performanceName:
        selectedPerformances.length === 1 ? firstPerformance.performanceName : selectionLabel,
      selectionLabel,
      date: firstPerformance.date,
      venue: selectedPerformances.length === 1 ? firstPerformance.venue : undefined,
      setlistOrder: orderEntries
    }
  };
}
