import { toHiragana } from 'wanakana';
import songData from '../../data/song-abbreviations.json';
import eventData from '../../data/event-abbreviations.json';
import nameData from '../../data/name-abbreviations.json';
import schools from '../../data/school.json';
import series from '../../data/series.json';
import units from '../../data/units.json';

export interface EventAbbreviation {
  name: string;
  ja: string;
  en: string;
  aliases: string[];
}

const songs = songData as Record<string, string[]>;
const events = eventData as Record<string, EventAbbreviation>;
const names = nameData as Record<string, { ja: string; en?: string }>;
const latin = /^[\p{Script=Latin}\p{N}\p{P}\p{S}\s]+$/u;

const eventsByName = new Map<string, EventAbbreviation | null>();
for (const event of Object.values(events)) {
  eventsByName.set(event.name, eventsByName.has(event.name) ? null : event);
}

export const getSongAliases = (id: string | number) => songs[id] ?? [];

export const getSongAbbreviation = (
  id: string | number,
  name: string,
  locale: string | undefined
) => {
  const aliases = getSongAliases(id);
  const alias = locale === 'en' ? aliases.find((item) => latin.test(item)) : aliases[0];
  return alias && alias.length < name.length ? alias : undefined;
};

export const getEventAbbreviation = (tourName: string, locale: string | undefined) => {
  const alias = eventsByName.get(tourName)?.[locale === 'en' ? 'en' : 'ja'];
  return alias && alias.length < tourName.length ? alias : undefined;
};

export const foldText = (text: string) =>
  toHiragana(text.normalize('NFKC').toLowerCase(), {
    passRomaji: true,
    convertLongVowelMark: false
  }).replace(/[^\p{L}\p{N}]/gu, '');

export const nameKey = (name: string) => name.normalize('NFKC').replace(/\s/g, '');
const namesByKey = new Map(Object.entries(names).map(([name, short]) => [nameKey(name), short]));

for (const [name, english] of [
  ...Object.entries(series),
  ...Object.entries(schools),
  ...units.map((unit) => [unit.name, unit.englishName])
]) {
  const short = name ? namesByKey.get(nameKey(name)) : undefined;
  if (short && english && !namesByKey.has(nameKey(english))) {
    namesByKey.set(nameKey(english), short);
  }
}

export const getNameAbbreviation = (
  name: string,
  locale: string | undefined
): string | undefined => {
  const short = namesByKey.get(nameKey(name))?.[locale === 'en' ? 'en' : 'ja'];
  const members = name.split('、');
  if (short || members.length < 2) return short || undefined;
  const shortMembers = members.map((member) => getNameAbbreviation(member, locale));
  if (!shortMembers.some(Boolean)) return undefined;
  return members
    .map((member, index) => shortMembers[index] ?? member)
    .join(locale === 'en' ? ', ' : '、');
};

export const getAliasScore = (aliases: string[], query: string) => {
  const q = foldText(query);
  if (!q) return 0;
  return Math.max(
    0,
    ...aliases.map((alias) => {
      const text = foldText(alias);
      if (text === q) return 98;
      if (text.startsWith(q)) return 88;
      return text.includes(q) ? 78 : 0;
    })
  );
};

export const matchesEventAlias = (eventId: string | undefined, query: string) => {
  const event = eventId ? events[eventId] : undefined;
  return !!event && getAliasScore([event.ja, event.en, ...event.aliases], query) > 0;
};
