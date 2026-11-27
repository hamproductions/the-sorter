import { Suspense, lazy, type Dispatch, type SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';
import { FaXmark } from 'react-icons/fa6';
import type { FilterType } from '~/components/sorter/CharacterFilters';
import { LoadingCharacterFilters } from '~/components/sorter/LoadingCharacterFilters';
import type { SongFilterType } from '~/components/sorter/SongFilters';
import { Button } from '~/components/ui/button';
import { Drawer } from '~/components/ui/drawer';
import { IconButton } from '~/components/ui/icon-button';
import { Text } from '~/components/ui/text';
import type { CohortSummary, RankingKind } from '~/types/global-ranking';
import { HStack, Stack, Wrap, styled } from 'styled-system/jsx';

const CharacterFilters = lazy(() =>
  import('~/components/sorter/CharacterFilters').then((m) => ({ default: m.CharacterFilters }))
);

const SongFilters = lazy(() =>
  import('~/components/sorter/SongFilters').then((m) => ({ default: m.SongFilters }))
);

function QuickFilterRow({
  label,
  testId,
  children
}: {
  label: string;
  testId: string;
  children: React.ReactNode;
}) {
  return (
    <Stack gap="2" w="full">
      <Text color="fg.muted" fontSize="xs" fontWeight="bold">
        {label}
      </Text>
      <Wrap data-testid={testId} gap="2">
        {children}
      </Wrap>
    </Stack>
  );
}

export function LeaderboardFilterDrawer({
  open,
  onOpenChange,
  kind,
  popularCohorts,
  describeCohort,
  isActiveCohort,
  applyCohort,
  performanceCount,
  onOpenPicker,
  characterFilter,
  setCharacterFilter,
  songFilter,
  setSongFilter,
  filterCount,
  clearFilter,
  submissions
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: RankingKind;
  popularCohorts: CohortSummary[];
  describeCohort: (cohort: CohortSummary) => string;
  isActiveCohort: (cohort: CohortSummary) => boolean;
  applyCohort: (cohort: CohortSummary) => void;
  performanceCount: number;
  onOpenPicker: () => void;
  characterFilter: FilterType | null | undefined;
  setCharacterFilter: Dispatch<SetStateAction<FilterType | null | undefined>>;
  songFilter: SongFilterType | null | undefined;
  setSongFilter: Dispatch<SetStateAction<SongFilterType | null | undefined>>;
  filterCount: number;
  clearFilter: () => void;
  submissions: number;
}) {
  const { t } = useTranslation();

  return (
    <Drawer.Root open={open} onOpenChange={(e) => onOpenChange(e.open)}>
      <Drawer.Backdrop />
      <Drawer.Positioner>
        <Drawer.Content>
          <Drawer.Header>
            <HStack justifyContent="space-between">
              <Drawer.Title>{t('global_ranking.filter')}</Drawer.Title>
              <Drawer.CloseTrigger asChild>
                <IconButton aria-label={t('global_ranking.close')} variant="ghost" size="sm">
                  <FaXmark />
                </IconButton>
              </Drawer.CloseTrigger>
            </HStack>
          </Drawer.Header>
          <Drawer.Body>
            <Stack gap="5">
              {popularCohorts.length > 0 && (
                <QuickFilterRow label={t('global_ranking.popular_filters')} testId="cohort-chips">
                  {popularCohorts.map((cohort) => {
                    const label = describeCohort(cohort);
                    const active = isActiveCohort(cohort);
                    return (
                      <Button
                        key={cohort.hash}
                        size="xs"
                        variant={active ? 'solid' : 'subtle'}
                        aria-pressed={active}
                        title={label}
                        onClick={() => applyCohort(cohort)}
                        flexDirection="column"
                        alignItems="flex-start"
                        w="full"
                        h="auto"
                        minH="11"
                        py="2"
                        textAlign="left"
                        whiteSpace="normal"
                      >
                        <styled.span display="block" overflowWrap="anywhere">
                          {label}
                        </styled.span>
                        <styled.span fontVariantNumeric="tabular-nums" opacity="0.75">
                          {t(`global_ranking.mode_${cohort.mode}`)} ·{' '}
                          {t('global_ranking.submissions', { count: cohort.submissions })}
                        </styled.span>
                      </Button>
                    );
                  })}
                </QuickFilterRow>
              )}
              {kind === 'song' && (
                <Stack gap="2" w="full">
                  <Button size="sm" variant="outline" onClick={onOpenPicker}>
                    {performanceCount > 0
                      ? t('global_ranking.performances_selected', {
                          count: performanceCount
                        })
                      : t('global_ranking.select_performances')}
                  </Button>
                </Stack>
              )}
              <Suspense fallback={<LoadingCharacterFilters />}>
                {import.meta.env.SSR ? (
                  <LoadingCharacterFilters />
                ) : kind === 'character' ? (
                  <CharacterFilters filters={characterFilter} setFilters={setCharacterFilter} />
                ) : (
                  <SongFilters filters={songFilter} setFilters={setSongFilter} />
                )}
              </Suspense>
            </Stack>
          </Drawer.Body>
          <Drawer.Footer>
            <HStack justifyContent="space-between" w="full">
              <Button variant="ghost" onClick={clearFilter} disabled={filterCount === 0}>
                {t('global_ranking.clear_filter')}
              </Button>
              <Drawer.CloseTrigger asChild>
                <Button>
                  {t('global_ranking.show_results', {
                    count: submissions
                  })}
                </Button>
              </Drawer.CloseTrigger>
            </HStack>
          </Drawer.Footer>
        </Drawer.Content>
      </Drawer.Positioner>
    </Drawer.Root>
  );
}
