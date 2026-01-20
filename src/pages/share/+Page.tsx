import { Suspense, lazy } from 'react';
import { useTranslation } from 'react-i18next';
import { decompressFromEncodedURIComponent } from 'lz-string';
import { Link, Text, Button } from '../../components/ui';
import { useData } from '../../hooks/useData';
import type { Character } from '../../types';
import school from '../../../data/school.json';
import series from '../../../data/series.json';
import units from '../../../data/units.json';
import { Container, Stack } from 'styled-system/jsx';
import { ResultsView } from '~/components/results/ResultsView';
import { getFilterTitle } from '~/utils/filter';
import { addPresetParams } from '~/utils/share';
import { Metadata } from '~/components/layout/Metadata';
import type { TierListSettings } from '~/components/results/TierList';
import { useDialogData } from '~/hooks/useDialogData';

const CharacterInfoDialog = lazy(() =>
  import('../../components/dialog/CharacterInfoDialog').then((m) => ({
    default: m.CharacterInfoDialog
  }))
);

export function Page() {
  const data = useData();
  const { t, i18n } = useTranslation();

  const {
    data: showCharacterInfo,
    isOpen: isShowCharacterInfo,
    setData: setShowCharacterInfo
  } = useDialogData<Character>();

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

  const seiyuu = urlSeiyuu === 'true';

  const filters = {
    series: urlSeries.filter((s) => Object.keys(series).includes(s)),
    school: urlSchool.filter((s) => Object.keys(school).includes(s)),
    units: urlUnits.filter((unitId) => units?.some((s) => s.id === unitId))
  };

  const titlePrefix = getFilterTitle(filters, data, i18n.language) ?? t('defaultTitlePrefix');
  const title = t('title', {
    titlePrefix
  });

  const getShareUrl = () => {
    const params = new URLSearchParams();
    addPresetParams(params, filters, seiyuu);
    return `/?${params.toString()}`;
  };

  return (
    <>
      <Metadata title={title} helmet />
      <Container zIndex="1" flex={1} w="full" py={4} px={4}>
        <Stack alignItems="center" w="full">
          <Text fontSize="3xl" fontWeight="bold" textAlign="center">
            {title}
          </Text>
          <Text textAlign="center">{t('description')}</Text>
          <Link href={getShareUrl()}>
            <Button>{t('share.create_your_own')}</Button>
          </Link>
          {data?.length && results?.length > 0 && (
            <>
              <ResultsView
                titlePrefix={titlePrefix}
                charactersData={data}
                isSeiyuu={seiyuu}
                shareDisplayData={shareDisplayData}
                onSelectCharacter={(c: Character) => setShowCharacterInfo(c)}
                readOnly
                w="full"
                order={results}
              />
              <Link href={getShareUrl()}>
                <Button>{t('share.create_your_own')}</Button>
              </Link>
            </>
          )}
        </Stack>
      </Container>
      <Suspense>
        <CharacterInfoDialog
          character={showCharacterInfo}
          isSeiyuu={seiyuu}
          open={isShowCharacterInfo}
          onOpenChange={(e) => {
            if (!e.open) {
              return setShowCharacterInfo(undefined);
            }
          }}
        />
      </Suspense>
    </>
  );
}
