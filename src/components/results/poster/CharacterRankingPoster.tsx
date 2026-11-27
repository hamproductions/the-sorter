import { uniq } from 'lodash-es';
import { useTranslation } from 'react-i18next';
import { HStack, styled } from 'styled-system/jsx';
import { RankingPoster } from './RankingPoster';
import { getUnitLabels } from '../RankingTable';
import { CharacterIcon } from '~/components/sorter/CharacterIcon';
import { useAbbreviations } from '~/hooks/useAbbreviations';
import type { Character, WithRank } from '~/types';
import { getPicUrl } from '~/utils/assets';
import { getCastName, getFullName } from '~/utils/character';
import { getSchoolName, getSeriesName } from '~/utils/names';

export function CharacterRankingPoster({
  characters,
  isSeiyuu,
  detailed,
  abbreviate
}: {
  characters: WithRank<Character & { originalName?: string }>[];
  isSeiyuu: boolean;
  detailed?: boolean;
  abbreviate?: boolean;
}) {
  const { i18n } = useTranslation();
  const { short } = useAbbreviations();
  const lang = i18n.language;
  const shortName = abbreviate ? short.name : undefined;

  const entries = characters.map((character, index) => {
    const { id, rank, casts, colorCode, seriesColor, series, school } = character;
    const fullName = getFullName(character, lang);
    const note = casts[0]?.note;
    const isLead = index < 3;
    const showPortrait = isLead || (detailed && index < 10);

    return {
      key: id,
      rank,
      color: colorCode ?? seriesColor ?? 'currentColor',
      title: isSeiyuu ? getCastName(casts[0], lang) : fullName,
      subtitle: isSeiyuu
        ? [fullName, note && `(${note})`].filter(Boolean).join(' ')
        : casts
            .map((cast) =>
              [getCastName(cast, lang), cast.note && `(${cast.note})`].filter(Boolean).join(' ')
            )
            .join(', '),
      media: (
        <HStack gap="1" flexShrink="0" alignItems="flex-end">
          {showPortrait && (
            <styled.img
              src={getPicUrl(id, isSeiyuu ? 'seiyuu' : 'character')}
              alt={fullName}
              w="auto"
              maxW="5rem"
              maxH={isLead ? '6rem' : '3.5rem'}
            />
          )}
          <CharacterIcon locale={lang} character={character} w="auto" h={isLead ? '8' : '6'} />
        </HStack>
      ),
      details: uniq([
        shortName?.(series) ?? getSeriesName(series, lang),
        ...(detailed
          ? [
              shortName?.(school) ?? getSchoolName(school, lang),
              ...getUnitLabels(character, lang, shortName)
            ]
          : [])
      ])
        .filter(Boolean)
        .join(' · ')
    };
  });

  return <RankingPoster entries={entries} />;
}
