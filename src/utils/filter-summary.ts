import type { TFunction } from 'i18next';
import artistsInfo from '../../data/artists-info.json';
import seriesInfo from '../../data/series-info.json';
import units from '../../data/units.json';
import { getArtistName, getSchoolName, getSeriesName, getUnitName } from './names';
import type { Locale } from '~/i18n';
import type { RankingFilter, RankingKind } from '~/types/global-ranking';

const SHOWN_NAMES = 3;

export interface FilterNameLookup {
  song?: (id: string) => string | undefined;
  character?: (id: string) => string | undefined;
  discography?: (id: string) => string | undefined;
}

const lookupAll = (
  ids: (string | number)[] | undefined,
  lookup: ((id: string) => string | undefined) | undefined
) => (lookup ? (ids ?? []).flatMap((id) => lookup(String(id)) ?? []) : []);

const nameList = (
  kind: RankingKind,
  filter: Record<string, (string | number)[] | undefined>,
  lang: Locale | undefined,
  t: TFunction,
  lookup: FilterNameLookup
) =>
  kind === 'character'
    ? [
        ...(filter.series ?? []).map((s) => getSeriesName(String(s), lang)),
        ...(filter.school ?? []).map((s) => getSchoolName(String(s), lang)),
        ...(filter.units ?? []).map((id) => {
          const unit = units.find((u) => u.id === String(id));
          return unit ? getUnitName(unit.name, lang) : String(id);
        })
      ]
    : [
        ...(filter.series ?? []).map((id) =>
          id === 'cross'
            ? t('settings.cross_series')
            : (seriesInfo.find((s) => s.id === String(id))?.name ?? String(id))
        ),
        ...(filter.artists ?? []).map((id) => {
          const artist = artistsInfo.find((a) => a.id === String(id));
          return artist ? getArtistName(artist.name, lang) : String(id);
        }),
        ...(filter.types ?? []).map((type) => t(`settings.type.${type}`)),
        ...lookupAll(filter.characters, lookup.character),
        ...lookupAll(filter.discographies, lookup.discography),
        ...lookupAll(filter.songs, lookup.song),
        ...(filter.years ?? []).map(String)
      ];

export const countFilter = (filter: RankingFilter | null | undefined) =>
  Object.values(filter ?? {}).reduce((total, values) => total + (values?.length ?? 0), 0);

export const describeFilter = (
  kind: RankingKind,
  filter: RankingFilter | null | undefined,
  lang: Locale | undefined,
  t: TFunction,
  lookup: FilterNameLookup = {}
) => {
  const total = countFilter(filter);
  if (!filter || total === 0) return undefined;
  const names = nameList(kind, filter, lang, t, lookup);
  if (names.length === 0) return t('global_ranking.filter_count', { count: total });
  const hidden = total - Math.min(names.length, SHOWN_NAMES);
  const shown = names.slice(0, SHOWN_NAMES).join('・');
  return hidden > 0 ? `${shown} +${hidden}` : shown;
};
