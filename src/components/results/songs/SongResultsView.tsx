import { useEffect, useMemo, useState } from 'react';
import { flushSync } from 'react-dom';
import { FaChevronDown, FaCopy, FaDownload, FaShare } from 'react-icons/fa6';

import { useTranslation } from 'react-i18next';

import { uniq } from 'lodash-es';
import { SongRankingTable } from './SongRankingTable';
import { Tabs } from '~/components/ui/tabs';
import { Accordion } from '~/components/ui/accordion';
import { Box, HStack, Stack, Wrap } from 'styled-system/jsx';
import { FormLabel } from '~/components/ui/form-label';
import { Heading } from '~/components/ui/heading';
import { Input } from '~/components/ui/input';
import { Textarea } from '~/components/ui/textarea';
import { useToaster } from '~/context/ToasterContext';
import { useLocalStorage } from '~/hooks/useLocalStorage';
import type { WithRank } from '~/types';
import { Text } from '~/components/ui/text';
import type { Song } from '~/types/songs';
import { Button } from '~/components/ui/button';
import type { RootProps } from '~/components/ui/styled/tabs';
import { useArtistsData } from '~/hooks/useArtistsData';
import { useSeriesData } from '~/hooks/useSeriesData';
import { HeardleStatsDialog } from '~/components/sorter/HeardleStatsDialog';
import type { GuessResult } from '~/hooks/useHeardleState';
import type { PerformanceSortMeta, SetlistOrderEntry } from '~/types/performance-sort';
import { PerformanceOrderView } from './PerformanceOrderView';
import { SongSortTimeStats } from './SongSortTimeStats';
import { getArtistName, getFullPerformanceName } from '~/utils/names';
import { ExportActions } from '~/components/results/ExportActions';
import { useAbbreviations } from '~/hooks/useAbbreviations';
import type { SortTimingStats } from '~/utils/sort-timing';
import { useClipboard } from '~/hooks/useClipboard';
import { TabIcon } from '~/components/layout/TabIcon';
import { useData } from '~/hooks/useData';
import {
  formatPerformancePerformersText,
  getDistinctSongPerformanceEntries
} from '~/utils/performance-sort';

export function SongResultsView({
  titlePrefix,
  performanceMeta,
  songsData,
  order,
  failedSongs,
  guessResults,
  maxAttempts,
  timingStats,
  onShareResults,
  readOnly,
  allowExport,
  ...props
}: RootProps & {
  titlePrefix?: string;
  performanceMeta?: PerformanceSortMeta;
  songsData: Song[];
  order?: string[][];
  failedSongs?: Song[];
  guessResults?: Record<string, GuessResult>;
  maxAttempts?: number;
  timingStats?: SortTimingStats;
  onShareResults?: () => void;
  readOnly?: boolean;
  allowExport?: boolean;
}) {
  const artists = useArtistsData();
  const characters = useData();
  const seriesData = useSeriesData();
  const { toast } = useToaster();
  const { copyText: copyToClipboard, copyImage } = useClipboard();
  const [title, setTitle] = useState<string>('My LoveLive! Song Ranking');
  const [description, setDescription] = useState<string>();
  const [currentTab, setCurrentTab] = useLocalStorage<string>('songs-result-tab-v2', 'table');
  const [timestamp, setTimestamp] = useState(new Date());
  const [showRenderingCanvas, setShowRenderingCanvas] = useState(false);
  const { t, i18n: _i18n } = useTranslation();

  const effectiveTitlePrefix = performanceMeta
    ? getFullPerformanceName(performanceMeta)
    : titlePrefix;
  const { enabled: useShortNames, short } = useAbbreviations();
  const shortTitlePrefix =
    effectiveTitlePrefix &&
    (performanceMeta
      ? short.event(effectiveTitlePrefix, performanceMeta.tourName)
      : short.name(effectiveTitlePrefix));
  const exportTitlePrefix = (useShortNames && shortTitlePrefix) || effectiveTitlePrefix;

  const tabs = useMemo(() => {
    const result = [{ id: 'table', label: t('results.table') }];
    if (performanceMeta) {
      result.push({ id: 'performance-order', label: t('results.performance_order') });
    }
    return result;
  }, [t, performanceMeta]);

  useEffect(() => {
    if (!tabs.find((t) => t.id === currentTab)) {
      setCurrentTab('table');
    }
  }, [currentTab, setCurrentTab, tabs]);

  const failedSongIds = useMemo(() => new Set(failedSongs?.map((s) => s.id) ?? []), [failedSongs]);

  const songs = useMemo(() => {
    // Filter out failed songs from the order before computing ranks
    const filteredOrder = order
      ?.map((ids) =>
        Array.isArray(ids)
          ? ids.filter((id) => !failedSongIds.has(`${id}`))
          : failedSongIds.has(`${ids}`)
            ? []
            : [ids]
      )
      .filter((ids) => ids.length > 0);

    return (
      filteredOrder
        ?.map((ids, idx, arr) => {
          const startRank = arr.slice(0, idx).reduce((p, c) => p + c.length, 1);
          return ids
            .map((id) => {
              const song = songsData.find((s) => s.id === `${id}`);
              return song ? { rank: startRank, ...song } : null;
            })
            .filter((d): d is WithRank<Song> => d !== null);
        })
        .filter((c): c is WithRank<Song>[] => !!c) ?? []
    ).flatMap((s) => s);
  }, [order, songsData, failedSongIds]);

  const makeScreenshot = async () => {
    flushSync(() => {
      setTimestamp(new Date());
      setShowRenderingCanvas(true);
    });
    toast?.({ description: t('toast.generating_screenshot') });
    try {
      const domToBlob = await import('modern-screenshot').then((module) => module.domToBlob);
      const resultsBox = document.getElementById('results');
      if (!resultsBox) throw new Error('Result image is unavailable');
      return await domToBlob(resultsBox, {
        quality: 1,
        scale: 2,
        type: 'image/png',
        features: { removeControlCharacter: false }
      });
    } finally {
      setShowRenderingCanvas(false);
    }
  };

  const screenshot = () => copyImage(makeScreenshot);

  const exportText = async (abbreviate: boolean) => {
    const shortName = abbreviate ? short.name : undefined;
    await copyToClipboard(
      [
        performanceMeta
          ? [
              abbreviate && effectiveTitlePrefix
                ? short.event(effectiveTitlePrefix, performanceMeta.tourName)
                : effectiveTitlePrefix,
              performanceMeta.date,
              performanceMeta.venue
            ]
              .filter(Boolean)
              .join(' · ')
          : undefined,
        ...songs.map((song) => {
          const original = uniq(
            song.artists
              .map((art) => artists.find((a) => a.id === art.id)?.name)
              .filter((name): name is string => Boolean(name))
              .map((name) =>
                abbreviate ? (short.name(name) ?? getArtistName(name, _i18n.language)) : name
              )
          ).join(', ');
          const context = formatPerformancePerformersText(
            song,
            performanceMeta?.setlistOrder,
            characters,
            _i18n.language,
            shortName
          );
          const name = abbreviate ? short.song(song) : song.name;
          return `${song.rank}. ${name} - ${original}${context ? ` (${context})` : ''}`;
        })
      ]
        .filter(Boolean)
        .join('\n')
    );
  };

  const exportJSON = async () => {
    const exportName = (name?: string) =>
      (useShortNames && name ? short.name(name) : undefined) ?? name;
    const exportEntry = (song: Song, entry: SetlistOrderEntry): SetlistOrderEntry =>
      useShortNames
        ? {
            ...entry,
            customSongName:
              entry.customSongName === song.name ? short.song(song) : entry.customSongName,
            tourName: entry.tourName && short.event(entry.tourName, entry.tourName),
            performers: entry.performers?.map((performer) =>
              performer.kind === 'group'
                ? { ...performer, name: exportName(performer.name) ?? performer.name }
                : performer
            )
          }
        : entry;
    await copyToClipboard(
      JSON.stringify(
        songs.map((s) => {
          const artist = s?.artists.map((art) => artists.find((a) => a.id === art.id));
          const series = uniq(s?.seriesIds).map((id) => seriesData.find((a) => a.id === `${id}`));
          return {
            rank: s.rank,
            title: useShortNames ? short.song(s) : s?.name,
            series: series.map((a) => exportName(a?.name))?.join(', '),
            unit: artist?.map((a) => exportName(a?.name))?.join(', '),
            ...(performanceMeta
              ? {
                  performance: exportTitlePrefix,
                  performances: getDistinctSongPerformanceEntries(
                    s,
                    performanceMeta.setlistOrder
                  ).map((entry) => exportEntry(s, entry))
                }
              : {})
          };
        })
      )
    );
  };

  const download = async () => {
    try {
      const blob = await makeScreenshot();
      if (!blob) return;
      const saveAs = (await import('file-saver')).saveAs;
      saveAs(new File([blob], `${exportTitlePrefix ?? 'll'}-sorted-${timestamp.valueOf()}.png`));
    } catch (error) {
      console.error(error);
    }
  };

  const makeTitle = (prefix?: string) => {
    const sortType = t('songs');
    const type = t('results.ranking');
    return prefix
      ? t('results.results_title', { titlePrefix: prefix, sortType, type })
      : t('results.default_results_title', { titlePrefix: prefix, sortType, type });
  };
  const defaultTitle = makeTitle(effectiveTitlePrefix);
  const exportTitle = title === defaultTitle ? makeTitle(exportTitlePrefix) : title;

  useEffect(() => {
    setTitle(defaultTitle);
  }, [defaultTitle, currentTab]);

  return (
    <>
      <Stack alignItems="center" w="full" textAlign="center">
        <Heading fontSize="2xl" fontWeight="bold">
          {t('results.sort_results')}
        </Heading>
        {performanceMeta && <Text fontWeight="bold">{effectiveTitlePrefix}</Text>}

        {timingStats && <SongSortTimeStats stats={timingStats} />}

        <Stack w="full">
          <Accordion.Root size="md" collapsible>
            <Accordion.Item value="default" width="100%">
              <Accordion.ItemTrigger>
                <Text fontSize="lg" fontWeight="bold">
                  {t('results.export_settings')}
                </Text>
                <Accordion.ItemIndicator>
                  <FaChevronDown />
                </Accordion.ItemIndicator>
              </Accordion.ItemTrigger>
              <Accordion.ItemContent>
                <Stack>
                  <Stack w="full" textAlign="start">
                    <Wrap>
                      <FormLabel htmlFor="title">{t('results.title')}</FormLabel>
                      <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
                    </Wrap>
                    <Wrap>
                      <FormLabel htmlFor="description">{t('results.description')}</FormLabel>
                      <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      />
                    </Wrap>
                  </Stack>
                </Stack>
              </Accordion.ItemContent>
            </Accordion.Item>
          </Accordion.Root>
          {(!readOnly || allowExport) && (
            <ExportActions>
              {onShareResults && (
                <Button variant="subtle" onClick={onShareResults}>
                  <FaShare /> {t('results.share')}
                </Button>
              )}
              <Button variant="subtle" onClick={() => void exportJSON()}>
                <FaCopy /> {t('results.export_json')}
              </Button>
              <Button variant="subtle" onClick={() => void exportText(false)}>
                <FaCopy /> {t('results.copy_text')}
              </Button>
              <Button variant="subtle" onClick={() => void exportText(true)}>
                <FaCopy /> {t('results.copy_text_short')}
              </Button>
              <Button variant="subtle" onClick={() => void screenshot()}>
                <FaCopy /> {t('results.copy')}
              </Button>
              <Button onClick={() => void download()}>
                <FaDownload /> {t('results.download')}
              </Button>
            </ExportActions>
          )}
        </Stack>

        <Tabs.Root
          lazyMount
          defaultValue="table"
          value={currentTab}
          onValueChange={(d) => setCurrentTab(d.value)}
          {...props}
        >
          <Tabs.List>
            {tabs.map((option) => (
              <Tabs.Trigger key={option.id} value={option.id}>
                <TabIcon id={option.id} />
                {option.label}
              </Tabs.Trigger>
            ))}
            <Tabs.Indicator />
          </Tabs.List>
          <Box w="full" p="4" overflowX="auto">
            <Tabs.Content value="table">
              <SongRankingTable
                songs={songs}
                guessResults={guessResults}
                maxAttempts={maxAttempts}
                performanceMeta={performanceMeta}
              />
            </Tabs.Content>
            {performanceMeta && order && (
              <Tabs.Content value="performance-order">
                <PerformanceOrderView performanceMeta={performanceMeta} order={order} />
              </Tabs.Content>
            )}
          </Box>
        </Tabs.Root>

        {guessResults && Object.keys(guessResults).length > 0 && maxAttempts && (
          <HeardleStatsDialog
            guessResults={guessResults}
            songs={songsData}
            lang={_i18n.language}
            maxAttempts={maxAttempts}
          />
        )}

        {failedSongs && failedSongs.length > 0 && (
          <Stack w="full" mt="8">
            <Heading color="red.500" fontSize="xl" fontWeight="bold">
              {t('heardle.failed_section')}
            </Heading>
            <Text color="fg.muted" fontSize="sm">
              {t('heardle.failed_description', { count: maxAttempts ?? 5 })}
            </Text>
            <Box
              border="1px solid"
              borderColor="red.200"
              borderRadius="md"
              w="full"
              p="4"
              bg="bg.subtle"
            >
              <Stack gap={1}>
                {failedSongs.map((song) => {
                  const songArtists = song.artists
                    .map((art) => artists.find((a) => a.id === art.id))
                    .filter(Boolean);
                  return (
                    <HStack key={song.id} justifyContent="space-between">
                      <Text color="fg.muted">{song.name}</Text>
                      <Text color="fg.muted" fontSize="sm">
                        {songArtists.map((a) => a?.name).join(', ')}
                      </Text>
                    </HStack>
                  );
                })}
              </Stack>
            </Box>
          </Stack>
        )}
      </Stack>
      {showRenderingCanvas && (
        <Box position="absolute" w="0" h="0" overflow="hidden">
          <Stack id="results" width="1280px" p="4" bgColor="bg.canvas">
            {exportTitle && (
              <Heading fontSize="2xl" fontWeight="bold">
                {exportTitle}
              </Heading>
            )}
            {description && <Text>{description}</Text>}
            <Box w="full" textAlign="center">
              {currentTab === 'table' ? (
                <SongRankingTable
                  songs={songs}
                  performanceMeta={performanceMeta}
                  abbreviate={useShortNames}
                />
              ) : performanceMeta && order ? (
                <PerformanceOrderView
                  performanceMeta={performanceMeta}
                  abbreviate={useShortNames}
                  order={order}
                />
              ) : (
                <SongRankingTable
                  songs={songs}
                  performanceMeta={performanceMeta}
                  abbreviate={useShortNames}
                />
              )}
            </Box>
            <Text textAlign="end">
              {t('results.generated_at')}: {timestamp.toLocaleString()}
            </Text>
          </Stack>
        </Box>
      )}
    </>
  );
}
