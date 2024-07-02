import { Suspense, lazy, useEffect, useState } from 'react';
//@ts-expect-error @types/react-dom not updated for 19 yet
import { preload } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { FaShare } from 'react-icons/fa6';
import type { ShareDisplayData } from '../../components/results/ResultsView';
import { CharacterCard } from '../../components/sorter/CharacterCard';
import { Button } from '../../components/ui/button';
import { Kbd } from '../../components/ui/kbd';
import { Progress } from '../../components/ui/progress';
import { Switch } from '../../components/ui/switch';
import { Text } from '../../components/ui/text';
import { useToaster } from '../../context/ToasterContext';
import { useData } from '../../hooks/useData';
import { useSortData } from '../../hooks/useSortData';
import type { Character } from '../../types';
import { getCurrentItem } from '../../utils/sort';
import { addPresetParams, serializeData } from '~/utils/share';
import { getNextItems } from '~/utils/preloading';
import { getFilterTitle, isValidFilter } from '~/utils/filter';
import { getPicUrl } from '~/utils/assets';
import { useDialogData } from '~/hooks/useDialogData';
import { LoadingCharacterFilters } from '~/components/sorter/LoadingCharacterFilters';
import { Metadata } from '~/components/layout/Metadata';
import { Box, HStack, Stack, Wrap } from 'styled-system/jsx';

const ResultsView = lazy(() =>
  import('../../components/results/ResultsView').then((m) => ({ default: m.ResultsView }))
);

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

const CharacterInfoDialog = lazy(() =>
  import('../../components/dialog/CharacterInfoDialog').then((m) => ({
    default: m.CharacterInfoDialog
  }))
);

const CharacterFilters = lazy(() =>
  import('../../components/sorter/CharacterFilters').then((m) => ({
    default: m.CharacterFilters
  }))
);

export function Page() {
  const data = useData();
  const { toast } = useToaster();
  const { t, i18n } = useTranslation();
  const {
    seiyuu,
    setSeiyuu,
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
    filters,
    setFilters,
    listToSort,
    listCount,
    clear
  } = useSortData();
  const [showConfirmDialog, setShowConfirmDialog] = useState<{
    type: 'mid-sort' | 'ended';
    action: 'reset' | 'clear';
  }>();
  const {
    data: showCharacterInfo,
    isOpen: isShowCharacterInfo,
    setData: setShowCharacterInfo
  } = useDialogData<Character>();

  const { left: leftItem, right: rightItem } =
    (state && getCurrentItem(state)) || ({} as { left: string[]; right: string[] });

  const currentLeft = leftItem && listToSort.find((l) => l.id === leftItem[0]);
  const currentRight = rightItem && listToSort.find((l) => l.id === rightItem[0]);

  const titlePrefix = getFilterTitle(filters, data, i18n.language) ?? t('defaultTitlePrefix');
  const title = t('title', {
    titlePrefix
  });

  const shareUrl = async () => {
    if (!isValidFilter(filters)) return;
    const params = addPresetParams(new URLSearchParams(), filters, seiyuu);
    const url = `${location.origin}${location.pathname}?${params.toString()}`;
    try {
      await navigator.clipboard.writeText(url);
      toast?.(t('toast.url_copied'));
    } catch (e) {}
  };

  const shareResultsUrl = async (shareData: ShareDisplayData) => {
    if (!isValidFilter(filters)) return;
    const params = addPresetParams(new URLSearchParams(), filters, seiyuu);
    params.append('data', await serializeData({ ...shareData, results: state?.arr ?? undefined }));
    const url = `${location.origin}${
      import.meta.env.PUBLIC_ENV__BASE_URL ?? ''
    }/share?${params.toString()}`;
    try {
      await navigator.clipboard.writeText(url);
      toast?.(t('toast.url_copied'));
    } catch (e) {}
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlSeiyuu = params.get('seiyuu');

    if (urlSeiyuu !== null) {
      setSeiyuu(urlSeiyuu === 'true');
    }
  }, []);

  // Preload Assets
  useEffect(() => {
    if (!state) return;
    const nextItems = getNextItems(state);
    for (const item of nextItems) {
      preload(getPicUrl(item, seiyuu ? 'seiyuu' : 'character'), { as: 'image' });
      if (listToSort.find((c) => c.id === item)?.hasIcon) {
        preload(getPicUrl(item, 'icons'), { as: 'image' });
      }
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
                <CharacterFilters filters={filters} setFilters={setFilters} />
              )}
            </Suspense>
            <Wrap>
              <Switch
                checked={seiyuu}
                disabled={isSorting}
                onCheckedChange={(e) => setSeiyuu(e.checked)}
              >
                {t('settings.seiyuu')}
              </Switch>
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
          {t('settings.sort_count', { count: listCount })}
        </Text>
        <Wrap justifyContent="center">
          <Button onClick={() => void shareUrl()} variant="subtle">
            <FaShare /> {t('settings.share')}
          </Button>
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
                        <CharacterCard
                          onClick={() => left()}
                          character={currentLeft}
                          isSeiyuu={seiyuu}
                          flex={1}
                        />
                        <Box hideBelow="sm">
                          <Kbd>←</Kbd>
                        </Box>
                      </Stack>
                      <Stack flex="1" alignItems="center" w="full">
                        <CharacterCard
                          onClick={() => right()}
                          character={currentRight}
                          isSeiyuu={seiyuu}
                          flex={1}
                        />
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
            {state.arr && progress === 1 && (
              <Suspense>
                <ResultsView
                  titlePrefix={titlePrefix}
                  charactersData={data}
                  isSeiyuu={seiyuu}
                  onShareResults={(results) => void shareResultsUrl(results)}
                  onSelectCharacter={setShowCharacterInfo}
                  w="full"
                  order={state.arr}
                />
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
