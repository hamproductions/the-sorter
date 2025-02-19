import { Suspense, lazy, useEffect, useState } from 'react';
import { preload } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Progress } from '../../components/ui/progress';
import { Button } from '../../components/ui/styled/button';
import { Kbd } from '../../components/ui/styled/kbd';
import { Text } from '../../components/ui/styled/text';
import { Switch } from '../../components/ui/switch';
import { useToaster } from '../../context/ToasterContext';
import { getCurrentItem } from '../../utils/sort';
import { Box, HStack, Stack, Wrap } from 'styled-system/jsx';
import { Metadata } from '~/components/layout/Metadata';
import { HasuSongResultsView } from '~/components/results/songs/HasuSongResultsView';
import { LoadingCharacterFilters } from '~/components/sorter/LoadingCharacterFilters';
import { useHasuSongData } from '~/hooks/useHasuSongData';
import { useHasuSongsSortData } from '~/hooks/useHasuSongsSortData';
import { getPicUrl } from '~/utils/assets';
import { getNextItems } from '~/utils/preloading';
import { HasuSongCard } from '~/components/sorter/HasuSongCard';

const ConfirmMidSortDialog = lazy(() =>
  import('../../components/dialog/ConfirmDialog').then((m) => ({
    default: m.ConfirmMidSortDialog
  }))
);

const ConfirmEndedDialog = lazy(() =>
  import('../../components/dialog/ConfirmDialog').then((m) => ({
    default: m.ConfirmEndedDialog
  }))
);

const HasuSongFilters = lazy(() =>
  import('../../components/sorter/HasuSongFilters').then((m) => ({
    default: m.HasuSongFilters
  }))
);

export function Page() {
  const songs = useHasuSongData();
  const { toast: _toast } = useToaster();
  const { t, i18n: _i18n } = useTranslation();
  const {
    noTieMode,
    setNoTieMode,
    init,
    left,
    right,
    state,
    count,
    tie,
    undo,
    progress,
    songFilters,
    setSongFilters,
    listToSort,
    listCount,
    clear,
    isEnded
  } = useHasuSongsSortData();
  const [showConfirmDialog, setShowConfirmDialog] = useState<{
    type: 'mid-sort' | 'ended';
    action: 'reset' | 'clear';
  }>();

  const { left: leftItem, right: rightItem } =
    (state && getCurrentItem(state)) || ({} as { left: string[]; right: string[] });

  const currentLeft = leftItem && listToSort.find((l) => l.id === leftItem[0]);
  const currentRight = rightItem && listToSort.find((l) => l.id === rightItem[0]);

  // const titlePrefix = getFilterTitle(filters, data, i18n.language) ?? t('defaultTitlePrefix');
  const title = t('title', {
    titlePrefix: t('hasu-songs')
  });

  // Preload Assets
  useEffect(() => {
    if (!state) return;
    const nextItems = getNextItems(state);
    for (const item of nextItems) {
      const url = getPicUrl(`${item}`, 'thumbnail');
      if (url) preload(url, { as: 'image' });
    }
  }, [state]);

  const isSorting = !!state;

  const handleStart = () => {
    if (isSorting) {
      setShowConfirmDialog({
        type: state.status === 'end' ? 'ended' : 'mid-sort',
        action: 'reset'
      });
    } else {
      init();
    }
  };

  const handleClear = () => {
    if (isSorting) {
      setShowConfirmDialog({
        type: state.status === 'end' ? 'ended' : 'mid-sort',
        action: 'clear'
      });
    } else {
      clear();
    }
  };

  return (
    <>
      <Metadata title={title} helmet />
      <Stack alignItems="center" w="full">
        <Text textAlign="center" fontSize="3xl" fontWeight="bold">
          {title}
        </Text>
        <Text textAlign="center">{t('description')}</Text>
        {!isSorting && (
          <>
            <Suspense fallback={<LoadingCharacterFilters />}>
              {import.meta.env.SSR ? (
                <LoadingCharacterFilters />
              ) : (
                <HasuSongFilters filters={songFilters} setFilters={setSongFilters} />
              )}
            </Suspense>
            <Wrap>
              <Switch
                checked={noTieMode}
                disabled={isSorting}
                onCheckedChange={(e) => setNoTieMode(e.checked)}
              >
                {t('settings.no_tie_mode')}
              </Switch>
            </Wrap>
          </>
        )}
        <Text fontSize="sm" fontWeight="bold">
          {t('settings.song_sort_count', { count: listCount })}
        </Text>
        <Wrap justifyContent="center">
          <Button variant="solid" onClick={() => handleStart()}>
            {!isSorting ? t('sort.start') : t('sort.start_over')}
          </Button>
          {isSorting && (
            <Button variant="subtle" onClick={() => handleClear()}>
              {state?.status !== 'end' ? t('sort.stop') : t('sort.new_settings')}
            </Button>
          )}
        </Wrap>
        {state && (
          <Stack alignItems="center" w="full">
            {state.status !== 'end' && (
              <Stack w="full" h={{ base: '100vh', md: 'auto' }} p="4">
                <Stack flex="1" alignItems="center" w="full">
                  {currentLeft && currentRight && (
                    <HStack
                      flex={1}
                      flexDirection={{ base: 'column', sm: 'row' }}
                      justifyContent="stretch"
                      alignItems="stretch"
                      width="full"
                    >
                      <Stack flex="1" alignItems="center" w="full">
                        <HasuSongCard onClick={() => left()} song={currentLeft} flex={1} />
                        <Box hideBelow="sm">
                          <Kbd>←</Kbd>
                        </Box>
                      </Stack>
                      <Stack flex="1" alignItems="center" w="full">
                        <HasuSongCard onClick={() => right()} song={currentRight} flex={1} />
                        <Box hideBelow="sm">
                          <Kbd>→</Kbd>
                        </Box>
                      </Stack>
                    </HStack>
                  )}
                  <HStack justifyContent="center" w="full">
                    <Button
                      size={{ base: '2xl', md: 'lg' }}
                      onClick={() => tie()}
                      disabled={noTieMode}
                      flex={{ base: 1, md: 'unset' }}
                    >
                      {t('sort.tie')}
                    </Button>
                    <Button
                      size={{ base: '2xl', md: 'lg' }}
                      variant="subtle"
                      onClick={() => undo()}
                      flex={{ base: 1, md: 'unset' }}
                    >
                      {t('sort.undo')}
                    </Button>
                  </HStack>
                  <Stack hideBelow="sm" gap="1">
                    <Text fontWeight="bold">{t('sort.keyboard_shortcuts')}</Text>
                    <Wrap>
                      <Text>
                        <Kbd>←</Kbd>: {t('sort.pick_left')}
                      </Text>
                      <Text>
                        <Kbd>→</Kbd>: {t('sort.pick_right')}
                      </Text>
                      <Text
                        data-disabled={noTieMode === true || undefined}
                        textDecoration={{ _disabled: 'line-through' }}
                      >
                        <Kbd>↓</Kbd>: {t('sort.tie')}
                      </Text>
                      <Text>
                        <Kbd>↑</Kbd>: {t('sort.undo')}
                      </Text>
                    </Wrap>
                  </Stack>
                </Stack>
                <Text>{t('sort.comparison_no', { count })}</Text>
                <Progress
                  translations={{ value: (details) => `${details.percent}%` }}
                  value={progress}
                  min={0}
                  max={1}
                  defaultValue={0}
                />
              </Stack>
            )}
            {state.arr && isEnded && (
              <Suspense>
                <HasuSongResultsView songsData={songs} w="full" order={state.arr} />
              </Suspense>
            )}
          </Stack>
        )}
      </Stack>
      <Suspense>
        <ConfirmEndedDialog
          open={showConfirmDialog?.type === 'ended'}
          lazyMount
          unmountOnExit
          onConfirm={() => {
            if (showConfirmDialog?.action === 'clear') {
              clear();
            } else {
              init();
            }
            setShowConfirmDialog(undefined);
          }}
          onOpenChange={({ open }) => {
            if (!open) {
              setShowConfirmDialog(undefined);
            }
          }}
        />
        <ConfirmMidSortDialog
          open={showConfirmDialog?.type === 'mid-sort'}
          lazyMount
          unmountOnExit
          onConfirm={() => {
            if (showConfirmDialog?.action === 'clear') {
              clear();
            } else {
              init();
            }
            setShowConfirmDialog(undefined);
          }}
          onOpenChange={({ open }) => {
            if (!open) {
              setShowConfirmDialog(undefined);
            }
          }}
        />
      </Suspense>
    </>
  );
}
