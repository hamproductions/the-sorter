import type { PerformancePerformer, SetlistOrderEntry } from '~/types/performance-sort';
import type { Song } from '~/types/songs';
import artistsInfo from '../../data/artists-info.json';
import characterInfo from '../../data/character-info.json';

const RECOGNIZED_GROUP_ARTIST_IDS = new Set([
  '1',
  '2',
  '3',
  '4',
  '32',
  '33',
  '34',
  '35',
  '36',
  '37',
  '60',
  '61',
  '62',
  '63',
  '91',
  '99',
  '110',
  '127',
  '133',
  '134',
  '135',
  '136',
  '160',
  '161',
  '162',
  '187',
  '194',
  '201',
  '213'
]);

const groupAliases = new Map<string, (typeof artistsInfo)[number]>();
for (const artist of artistsInfo) {
  if (RECOGNIZED_GROUP_ARTIST_IDS.has(String(artist.id))) {
    groupAliases.set(artist.name.trim(), artist);
  }
}
for (const [alias, id] of [
  ['虹ヶ咲', '60'],
  ['ニジガク', '60'],
  ['蓮ノ空', '133']
] as const) {
  const artist = artistsInfo.find((item) => String(item.id) === id);
  if (artist) groupAliases.set(alias, artist);
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
for (const character of characterInfo) {
  characterAliases.set(character.fullName, String(character.id));
  characterAliases.set(character.fullName.replace(/\s+/g, ''), String(character.id));
}

const castCharacterIds = new Map<string, Set<string>>();
for (const character of characterInfo) {
  for (const cast of character.casts ?? []) {
    const key = cast.seiyuu.trim();
    if (!key) continue;
    const ids = castCharacterIds.get(key) ?? new Set<string>();
    ids.add(String(character.id));
    castCharacterIds.set(key, ids);
  }
}
for (const [name, ids] of castCharacterIds) {
  if (ids.size === 1) characterAliases.set(name, [...ids][0]);
}

const protectedAliases = [
  ...characterInfo.map((character) => character.fullName),
  ...castCharacterIds.keys(),
  ...groupAliases.keys()
].sort((a, b) => b.length - a.length);

export function getSetlistPerformers(remarks?: string): PerformancePerformer[] | undefined {
  if (!remarks) return undefined;
  const segments = remarks
    .split(/[｜|]/u)
    .map((segment) => segment.trim())
    .filter(Boolean);

  for (const segment of segments) {
    let work = segment
      .replace(/\s*Ver\.?$/iu, '')
      .replace(/\s*の\s*\d+人による歌唱$/u, '')
      .replace(/\s*歌唱$/u, '');
    const placeholders = new Map<string, string>();
    protectedAliases.forEach((alias, index) => {
      const placeholder = `__PERFORMER_${index}__`;
      if (work.includes(alias)) {
        work = work.replaceAll(alias, placeholder);
        placeholders.set(placeholder, alias);
      }
    });
    const tokens = work
      .replace(/[（(][^）)]*[）)]/gu, '')
      .split(/[、,・×✕&＆/／＋+]/u)
      .map((token) => token.trim().replace(/さん$/u, ''))
      .filter(Boolean)
      .map((token) => {
        let restored = token;
        for (const [placeholder, alias] of placeholders)
          restored = restored.replaceAll(placeholder, alias);
        return restored;
      });
    if (tokens.length === 0) continue;

    const performers: PerformancePerformer[] = [];
    let unrecognized = false;
    for (const token of tokens) {
      const group = groupAliases.get(token);
      if (group) {
        performers.push({ kind: 'group', id: String(group.id), name: group.name.trim() });
        continue;
      }
      const characterId =
        characterAliases.get(token) ?? characterAliases.get(token.replace(/\s+/gu, ''));
      if (characterId) {
        performers.push({ kind: 'member', characterId });
        continue;
      }
      unrecognized = true;
      break;
    }
    if (!unrecognized && performers.length > 0) {
      return [
        ...new Map(
          performers.map((performer) => [
            performer.kind === 'group' ? `G:${performer.id}` : `M:${performer.characterId}`,
            performer
          ])
        ).values()
      ];
    }
  }
  return undefined;
}

export function getPerformerSignature(performers?: PerformancePerformer[]): string {
  if (!performers?.length) return 'unparsed';
  return performers
    .map((performer) =>
      performer.kind === 'group' ? `G:${performer.id}` : `M:${performer.characterId}`
    )
    .sort()
    .join(',');
}

function getSongOriginalMemberIds(song: Song): string[] {
  return song.artists.flatMap((songArtist) => {
    const artist = artistsInfo.find((item) => item.id === songArtist.id);
    if (songArtist.variant)
      return characterInfo
        .filter((character) =>
          character.units.some(
            (unit) => unit.id === songArtist.id && unit.additionalInfo === songArtist.variant
          )
        )
        .map((character) => character.id);
    return artist?.characters.filter((id): id is string => Boolean(id)) ?? [];
  });
}

export function getSongGroupMemberIds(song: Song): Set<string> {
  const artistIds = new Set(song.artists.map((artist) => artist.id));
  return new Set(
    characterInfo
      .filter((character) => character.units.some((unit) => artistIds.has(unit.id)))
      .map((character) => character.id)
  );
}

export function getPerformanceDisplayPerformers(
  song: Song,
  performers?: PerformancePerformer[]
): PerformancePerformer[] {
  if (!performers?.length) return [];
  const artistIds = new Set(song.artists.map((artist) => artist.id));
  if (
    performers.length === artistIds.size &&
    performers.every((performer) => performer.kind === 'group' && artistIds.has(performer.id))
  )
    return [];
  if (performers.some((performer) => performer.kind === 'group')) return performers;

  const memberIds = performers
    .flatMap((performer) => (performer.kind === 'member' ? [performer.characterId] : []))
    .sort();
  const originalMembers = getSongOriginalMemberIds(song);
  if (
    originalMembers.length &&
    [...new Set(originalMembers)].sort().join(',') === memberIds.join(',')
  )
    return [];

  if (song.artists.length === 1 && !song.artists[0].variant) {
    const variants = new Map<string, string[]>();
    for (const character of characterInfo) {
      for (const unit of character.units) {
        if (unit.id !== song.artists[0].id || !unit.additionalInfo) continue;
        variants.set(unit.additionalInfo, [
          ...(variants.get(unit.additionalInfo) ?? []),
          character.id
        ]);
      }
    }
    for (const roster of variants.values()) {
      if (roster.slice().sort().join(',') === memberIds.join(',')) return [];
    }
  }
  return performers;
}

export function getPerformanceVersionNote(entry: SetlistOrderEntry): string {
  if (!entry.performers?.length) return entry.remarks ?? '';
  return (entry.remarks ?? '')
    .split(/[｜|]/u)
    .map((part) => part.trim())
    .filter((part) => part && !getSetlistPerformers(part)?.length)
    .join(' · ');
}
