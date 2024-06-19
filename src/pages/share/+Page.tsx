import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { decompressFromEncodedURIComponent } from 'lz-string';
import { Link } from '../../components/ui/link';
import { Text } from '../../components/ui/text';
import { useData } from '../../hooks/useData';
import type { Character, WithRank } from '../../types';
import school from '../../../data/school.json';
import series from '../../../data/series.json';
import units from '../../../data/units.json';
import { Container, Stack } from 'styled-system/jsx';
import { ResultsView } from '~/components/results/ResultsView';
import { getFilterTitle } from '~/utils/filter';

import { Button } from '~/components/ui/button';
import { getCharacterFromId } from '~/utils/character';
import { Metadata } from '~/components/layout/Metadata';
import type { TierListSettings } from '~/components/results/TierList';

export function Page() {
  const data = useData();
  const { t, i18n } = useTranslation();

  const params = new URLSearchParams(import.meta.env.SSR ? '' : location.search);
  const urlSeiyuu = params.get('seiyuu');

  const urlSeries = params.getAll('series');
  const urlSchool = params.getAll('school');
  const urlUnits = params.getAll('units');
  const urlData = params.get('data');

  const {
    results,
    ...shareDisplayData
  }: {
    title: string;
    description?: string;
    tierlist?: TierListSettings;
    results: string[][];
    tab?: 'default' | 'table' | 'grid' | 'tier';
  } = JSON.parse(urlData !== null ? decompressFromEncodedURIComponent(urlData) : '{}') ?? {};

  console.log(shareDisplayData);
  const seiyuu = urlSeiyuu === 'true';

  const filters = {
    series: urlSeries.filter((s) => Object.keys(series).includes(s)),
    school: urlSchool.filter((s) => Object.keys(school).includes(s)),
    units: urlUnits.filter((unitId) => units?.some((s) => s.id === unitId))
  };

  const charaList = useMemo(() => {
    return (results
      ?.flatMap((ids, idx, arr) => {
        const startRank = arr.slice(0, idx).reduce((p, c) => p + c.length, 1);
        if (Array.isArray(ids)) {
          return ids
            .map((id) => ({ rank: startRank, ...getCharacterFromId(data, id, seiyuu) }))
            .filter((d) => 'id' in d);
        } else {
          const chara = data.find((i) => i.id === (ids as string));
          if (!chara) return [];
          return [{ rank: startRank, ...chara }];
        }
      })
      .filter((c) => !!c) ?? []) as WithRank<Character>[];
  }, [results, data]);

  const titlePrefix = getFilterTitle(filters, data, i18n.language) ?? t('defaultTitlePrefix');
  const title = t('title', {
    titlePrefix
  });

  const getShareUrl = () => {
    if (import.meta.env.SSR) return '/';
    const params = new URLSearchParams(location.search);
    params.delete('data');
    return `${location.origin}${import.meta.env.PUBLIC_ENV__BASE_URL ?? '/'}?${params.toString()}`;
  };

  return (
    <>
      <Metadata title={title} helmet />
      <Container zIndex="1" flex={1} w="full" py={4} px={4}>
        <Stack alignItems="center" w="full">
          <Text textAlign="center" fontSize="3xl" fontWeight="bold">
            {title}
          </Text>
          <Text textAlign="center">{t('description')}</Text>
          <Link href={getShareUrl()}>
            <Button>{t('share.create_your_own')}</Button>
          </Link>
          {charaList.length > 0 && (
            <>
              <ResultsView
                titlePrefix={titlePrefix}
                characters={charaList}
                isSeiyuu={seiyuu}
                readOnly
                shareDisplayData={shareDisplayData}
                w="full"
              />
              <Link href={getShareUrl()}>
                <Button>{t('share.create_your_own')}</Button>
              </Link>
            </>
          )}
        </Stack>
      </Container>
    </>
  );
}
