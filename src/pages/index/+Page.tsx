import { Suspense, lazy, useEffect, useState } from 'react';
import { preload } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { FaShare } from 'react-icons/fa6';
import type { ShareDisplayData } from '../../components/results/ResultsView';
import { CharacterCard } from '../../components/sorter/CharacterCard';
import { ComparisonInfo } from '../../components/sorter/ComparisonInfo';
import { KeyboardShortcuts } from '../../components/sorter/KeyboardShortcuts';
import { Button } from '../../components/ui/button';
import { Kbd } from '../../components/ui/kbd';
import { Progress } from '../../components/ui/progress';
import { Switch } from '../../components/ui/switch';
import { Text } from '../../components/ui/text';
import { useToaster } from '../../context/ToasterContext';
import { useData } from '../../hooks/useData';
import { useSortData } from '../../hooks/useSortData';
import type { Character } from '../../types';
import { getCurrentItem, resumeSort } from '../../utils/sort';
import { addPresetParams, serializeData } from '~/utils/share';
import { getCastName, getCharacterSortList, getFullName } from '~/utils/character';
import { getNextItems } from '~/utils/preloading';
import { getFilterTitle, isValidFilter } from '~/utils/filter';
import { getPicUrl } from '~/utils/assets';
import { useDialogData } from '~/hooks/useDialogData';
import { useSortSaves } from '~/hooks/useSortSaves';
import { LoadingCharacterFilters } from '~/components/sorter/LoadingCharacterFilters';
import { Metadata } from '~/components/layout/Metadata';
import { GlobalRankingToggle } from '~/components/results/GlobalRankingToggle';
import { AgreementPanel } from '~/components/leaderboard/AgreementPanel';
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

const ConfirmNewSessionDialog = lazy(() =>
  import('../../components/dialog/ConfirmDialog').then((m) => ({
    default: m.ConfirmNewSessionDialog
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

const SortingPreviewDialog = lazy(() =>
  import('../../components/sorter/SortingPreviewDialog').then((m) => ({
    default: m.SortingPreviewDialog
  }))
);

const ContinueSortingDialog = lazy(() =>
  import('../../components/dialog/ContinueSortingDialog').then((m) => ({
    default: m.ContinueSortingDialog
  }))
);

const SaveStateDialog = lazy(() =>
  import('../../components/dialog/SaveStateDialog').then((m) => ({
    default: m.SaveStateDialog
  }))
);

const SavedStatesListDialog = lazy(() =>
  import('../../components/dialog/SavedStatesListDialog').then((m) => ({
    default: m.SavedStatesListDialog
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
    comparisonsCount,
    isEstimatedCount,
    maxComparisons,
    tie,
    undo,
    progress,
    isEnded,
    filters,
    setFilters,
    listToSort,
    listCount,
    clear,
    loadResumeState,
    getSnapshot,
    loadState,
    globalRanking
  } = useSortData();
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState<{
    type: 'mid-sort' | 'ended' | 'new-session' | 'preview';
    action: 'reset' | 'clear';
  }>();
  const [showContinueDialog, setShowContinueDialog] = useState(false);
  const {
    data: showCharacterInfo,
    isOpen: isShowCharacterInfo,
    setData: setShowCharacterInfo
  } = useDialogData<Character>();

  const { left: leftItem, right: rightItem } =
    (state && getCurrentItem(state)) || ({} as { left: string[]; right: string[] });

  const findCharacter = (id: string) =>
    listToSort.find((l) => l.id === id) ??
    getCharacterSortList(data, seiyuu).find((l) => l.id === id);
  const currentLeft = leftItem && findCharacter(leftItem[0]);
  const currentRight = rightItem && findCharacter(rightItem[0]);

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
      toast?.({ description: t('toast.url_copied') });
    } catch {}
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
      toast?.({ description: t('toast.url_copied') });
    } catch {}
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlSeiyuu = params.get('seiyuu');

    if (state && state.status !== 'end') {
      const hasFilterParams =
        params.has('series') || params.has('school') || params.has('units') || params.has('seiyuu');
      if (hasFilterParams) {
        setShowConfirmDialog({
          type: 'new-session',
          action: 'reset'
        });
        return;
      }
    }

    if (urlSeiyuu !== null) {
      setSeiyuu(urlSeiyuu === 'true');
    }
  }, [setSeiyuu, state]);

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
  }, [state, listToSort, seiyuu]);

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

  const handleContinue = (results: string[][]) => {
    const validIds = new Set(getCharacterSortList(data, seiyuu).map((c) => c.id));
    const validResults = results
      .map((group) =>
        group.filter((id) => {
          if (!validIds.has(id)) return false;
          validIds.delete(id);
          return true;
        })
      )
      .filter((group) => group.length > 0);
    if (validResults.length === 0) return false;
    loadResumeState(resumeSort(validResults));
    setShowContinueDialog(false);
    return true;
  };

  const getFilterSummary = () => {
    if (!filters) return undefined;
    const parts: string[] = [];
    if (filters.series?.length)
      parts.push(t('dialog.saved_states.filter_summary.series', { count: filters.series.length }));
    if (filters.school?.length)
      parts.push(t('dialog.saved_states.filter_summary.schools', { count: filters.school.length }));
    if (filters.units?.length)
      parts.push(t('dialog.saved_states.filter_summary.units', { count: filters.units.length }));
    return parts.length > 0 ? parts.join(', ') : undefined;
  };

  const {
    saves,
    saveCurrent,
    overwrite,
    loadById,
    remove: removeSave
  } = useSortSaves({
    sorterType: 'characters',
    getSnapshot,
    loadState,
    itemCount: listCount,
    progress,
    filterSummary: getFilterSummary(),
    isSeiyuu: seiyuu,
    onApply: (saved) => {
      const savedSeiyuu =
        saved.isSeiyuu ?? (saved.log?.context ? saved.log.context.mode === 'seiyuu' : undefined);
      if (savedSeiyuu !== undefined) setSeiyuu(savedSeiyuu);
    }
  });

  const defaultSaveName = `${t('navigation.characters')} - ${new Date().toLocaleDateString()}`;

  return (
    <>
      <Metadata title={title} helmet />
      <Stack alignItems="center" w="full">
        <Text fontSize="3xl" fontWeight="bold" textAlign="center">
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
        <Button
          size="sm"
          variant="outline"
          disabled={listCount === 0}
          onClick={() => setShowConfirmDialog({ type: 'preview', action: 'reset' })}
        >
          {t('sort.preview')}
        </Button>
        <Wrap justifyContent="center">
          <Button onClick={() => void shareUrl()} variant="subtle">
            <FaShare /> {t('settings.share')}
          </Button>
          {!isSorting && (
            <Button variant="outline" onClick={() => setShowContinueDialog(true)}>
              {t('dialog.continue_sorting')}
            </Button>
          )}
          {!isSorting && saves.length > 0 && (
            <Button variant="outline" onClick={() => setShowLoadDialog(true)}>
              {t('sort.load_save')}
            </Button>
          )}
          <Button variant="solid" onClick={() => handleStart()}>
            {!isSorting ? t('sort.start') : t('sort.start_over')}
          </Button>
          {isSorting && (
            <Button variant="outline" onClick={() => setShowSaveDialog(true)}>
              {t('sort.save')}
            </Button>
          )}
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
                  <KeyboardShortcuts noTieMode={noTieMode} />
                </Stack>
                <ComparisonInfo
                  comparisonsCount={comparisonsCount}
                  isEstimatedCount={isEstimatedCount}
                  maxComparisons={maxComparisons}
                />
                <Progress
                  translations={{ value: (details) => `${details.percent}%` }}
                  value={progress}
                  min={0}
                  max={1}
                  defaultValue={0}
                />
              </Stack>
            )}
            {state.arr && isEnded && globalRanking.isAvailable && (
              <GlobalRankingToggle
                contribute={globalRanking.contribute}
                setContribute={globalRanking.setContribute}
              />
            )}
            {state.arr && isEnded && globalRanking.isEnabled && (
              <AgreementPanel
                kind={globalRanking.sortContext.kind}
                mode={globalRanking.sortContext.mode}
                ranking={state.arr}
                submissionId={globalRanking.submissionId}
              />
            )}
            {state.arr && isEnded && (
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
        <ConfirmNewSessionDialog
          open={showConfirmDialog?.type === 'new-session'}
          lazyMount
          unmountOnExit
          onConfirm={() => {
            // User chose to accept the new link (reset current session and use new params)
            clear();
            // We need to parse URL params and set them as filters
            const params = new URLSearchParams(location.search);
            const newFilters = {
              series: params.getAll('series'),
              school: params.getAll('school'),
              units: params.getAll('units')
            };
            const urlSeiyuu = params.get('seiyuu');
            if (urlSeiyuu !== null) {
              setSeiyuu(urlSeiyuu === 'true');
            }
            setFilters(newFilters);
            setShowConfirmDialog(undefined);
          }}
          onOpenChange={({ open }) => {
            if (!open) {
              // User dismissed/cancelled (keep current session, remove URL params)
              const url = new URL(window.location.href);
              url.search = '';
              window.history.replaceState({}, '', url.toString());
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
        <SortingPreviewDialog
          open={showConfirmDialog?.type === 'preview'}
          lazyMount
          unmountOnExit
          items={listToSort}
          getItemName={(item) => {
            const c = item as Character;
            return seiyuu ? getCastName(c.casts[0], i18n.language) : getFullName(c, i18n.language);
          }}
          onOpenChange={({ open }) => {
            if (!open) {
              setShowConfirmDialog(undefined);
            }
          }}
        />
        <ContinueSortingDialog
          open={showContinueDialog}
          lazyMount
          unmountOnExit
          onContinue={handleContinue}
          onOpenChange={({ open }) => {
            if (!open) {
              setShowContinueDialog(false);
            }
          }}
        />
        <SaveStateDialog
          open={showSaveDialog}
          lazyMount
          unmountOnExit
          defaultName={defaultSaveName}
          onSave={(name) => {
            if (saveCurrent(name)) setShowSaveDialog(false);
          }}
          existingSaves={saves}
          onOverwrite={(id) => {
            if (overwrite(id)) setShowSaveDialog(false);
          }}
          onOpenChange={({ open }) => {
            if (!open) setShowSaveDialog(false);
          }}
        />
        <SavedStatesListDialog
          open={showLoadDialog}
          lazyMount
          unmountOnExit
          saves={saves}
          onLoad={(id) => {
            if (loadById(id)) setShowLoadDialog(false);
          }}
          onDelete={(id) => removeSave(id)}
          onOpenChange={({ open }) => {
            if (!open) setShowLoadDialog(false);
          }}
        />
      </Suspense>
    </>
  );
}
