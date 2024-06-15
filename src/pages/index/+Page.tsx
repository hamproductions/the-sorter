import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaShare } from 'react-icons/fa6';
import { CharacterCard } from '../../components/sorter/CharacterCard';
import { CharacterFilters } from '../../components/sorter/CharacterFilters';
import { Button } from '../../components/ui/button';
import { Kbd } from '../../components/ui/kbd';
import { Link } from '../../components/ui/link';
import { Progress } from '../../components/ui/progress';
import { Switch } from '../../components/ui/switch';
import { Text } from '../../components/ui/text';
import { useToaster } from '../../context/ToasterContext';
import { useData } from '../../hooks/useData';
import { useSortData } from '../../hooks/useSortData';
import type { Character, WithRank } from '../../types';
import { getCurrentItem } from '../../utils/sort';
import { getFilterTitle, isValidFilter } from '~/utils/filter';
import { getAssetUrl } from '~/utils/assets';
import { Box, Container, HStack, Stack, Wrap } from 'styled-system/jsx';
import { getCharacterFromId } from '~/utils/character';
import { Footer } from '~/components/layout/Footer';

import { Metadata } from '~/components/layout/Metadata';
import type { Locale } from '~/i18n';

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

export function Page() {
  const data = useData();
  const { toast } = useToaster();
  const { t, i18n } = useTranslation();
  const {
    seiyuu,
    setSeiyuu,
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

  const charaList = useMemo(() => {
    return (state?.arr
      ?.flatMap((ids, idx, arr) => {
        const startRank = arr.slice(0, idx).reduce((p, c) => p + c.length, 1);
        if (Array.isArray(ids)) {
          return ids
            .map((id) => ({ rank: startRank, ...getCharacterFromId(data, id) }))
            .filter((d) => 'id' in d);
        } else {
          const chara = data.find((i) => i.id === (ids as string));
          if (!chara) return [];
          return [{ rank: startRank, ...chara }];
        }
      })
      .filter((c) => !!c) ?? []) as WithRank<Character>[];
  }, [state?.arr, data]);

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
    const params = new URLSearchParams();
    for (const key of ['series', 'units', 'school'] as const) {
      const list = filters?.[key];
      if (list && list?.length > 0) {
        list.forEach((item) => params.append(key, item));
      }
    }
    if (seiyuu) {
      params.append('seiyuu', seiyuu.toString());
    }
    const url = `${location.origin}${location.pathname}?${params.toString()}`;
    try {
      await navigator.clipboard.writeText(url);
      toast?.(t('toast.url_copied'));
    } catch (e) {}
  };

  const shareResultsUrl = async ({
    title,
    description
  }: {
    title: string;
    description?: string;
  }) => {
    if (!isValidFilter(filters)) return;
    const params = new URLSearchParams();
    for (const key of ['series', 'units', 'school'] as const) {
      const list = filters?.[key];
      if (list && list?.length > 0) {
        list.forEach((item) => params.append(key, item));
      }
    }
    if (seiyuu) {
      params.append('seiyuu', seiyuu.toString());
    }
    const data = { title, description, results: state?.arr ?? undefined };
    const compress = (await import('lz-string')).compressToEncodedURIComponent;
    params.append('data', compress(JSON.stringify(data)));
    const url = `${location.origin}${import.meta.env.PUBLIC_ENV__BASE_URL ?? ''}/share?${params.toString()}`;
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

  const handleSetLocale = (locale: Locale) => {
    void i18n.changeLanguage(locale);
  };

  return (
    <>
      <Metadata title={title} helmet />
      <Stack position="relative" w="full" minH="100vh">
        <Box
          style={{
            ['--bg-image' as 'backgroundImage']: `url('${getAssetUrl('/assets/bg.webp')}')`
          }}
          zIndex="0"
          position="fixed"
          top="0"
          left="0"
          w="100vw"
          h="100vh"
          opacity="0.05"
          backgroundPosition="center"
          backgroundAttachment="fixed"
          backgroundImage="var(--bg-image)"
          backgroundSize="cover"
        />
        <Container zIndex="1" flex={1} w="full" py={4} px={4}>
          <Stack alignItems="center" w="full">
            <Text textAlign="center" fontSize="3xl" fontWeight="bold">
              {title}
            </Text>
            <Text textAlign="center">{t('description')}</Text>
            <Wrap>
              <Link href="#" onClick={() => handleSetLocale('en')}>
                English
              </Link>
              |
              <Link href="#" onClick={() => handleSetLocale('ja')}>
                日本語
              </Link>
            </Wrap>
            <Text fontSize="sm" fontWeight="bold">
              {t('settings.sort_count', { count: listCount })}
            </Text>
            {!isSorting && (
              <>
                <CharacterFilters filters={filters} setFilters={setFilters} />
                <Switch
                  checked={seiyuu}
                  disabled={isSorting}
                  onCheckedChange={(e) => setSeiyuu(e.checked)}
                >
                  {t('settings.seiyuu')}
                </Switch>
              </>
            )}
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
                          <Text>
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
                {charaList && progress === 1 && (
                  <Suspense>
                    <ResultsView
                      titlePrefix={titlePrefix}
                      characters={charaList}
                      isSeiyuu={seiyuu}
                      onShareResults={(title, description) =>
                        void shareResultsUrl({ title, description })
                      }
                      w="full"
                    />
                  </Suspense>
                )}
              </Stack>
            )}
          </Stack>
        </Container>
        <Footer />
      </Stack>
      <ConfirmEndedDialog
        open={showConfirmDialog?.type === 'ended'}
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
    </>
  );
}
