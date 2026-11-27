import { useEffect, useMemo, useState } from 'react';
import { flushSync } from 'react-dom';
import { FaCode, FaCopy, FaDownload } from 'react-icons/fa6';

import { useTranslation } from 'react-i18next';

import { uniq } from 'lodash-es';
import { SongRankingTable } from './SongRankingTable';
import { Tabs } from '~/components/ui/tabs';
import { Box, HStack, Stack } from 'styled-system/jsx';
import { Heading } from '~/components/ui/heading';
import { useToaster } from '~/context/ToasterContext';
import { useLocalStorage } from '~/hooks/useLocalStorage';
import type { WithRank } from '~/types';
import { Text } from '~/components/ui/text';
import type { Song } from '~/types/songs';
import type { RootProps } from '~/components/ui/styled/tabs';
import { useArtistsData } from '~/hooks/useArtistsData';
import { useSeriesData } from '~/hooks/useSeriesData';
import { HeardleStatsDialog } from '~/components/sorter/HeardleStatsDialog';
import type { GuessResult } from '~/hooks/useHeardleState';
import type { PerformanceSortMeta } from '~/types/performance-sort';
import { PerformanceOrderView } from './PerformanceOrderView';
import { SongSortTimeStats } from './SongSortTimeStats';
import { getArtistName, getFullPerformanceName } from '~/utils/names';
import { ExportActions } from '~/components/results/ExportActions';
import { getCopyOptions } from '~/components/results/export/copy-options';
import { ExportCanvas } from '~/components/results/export/ExportCanvas';
import { ExportSettingsFields } from '~/components/results/export/ExportSettings';
import { SongRankingPoster } from '~/components/results/poster/SongRankingPoster';
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

  const getText = (abbreviate: boolean) => {
    const shortName = abbreviate ? short.name : undefined;
    return [
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
      .join('\n');
  };

  const exportJSON = async () => {
    await copyToClipboard(
      JSON.stringify(
        songs.map((s) => {
          const artist = s?.artists.map((art) => artists.find((a) => a.id === art.id));
          const series = uniq(s?.seriesIds).map((id) => seriesData.find((a) => a.id === `${id}`));
          return {
            rank: s.rank,
            title: s?.name,
            series: series.map((a) => a?.name)?.join(', '),
            unit: artist?.map((a) => a?.name)?.join(', '),
            ...(performanceMeta
              ? {
                  performance: effectiveTitlePrefix,
                  performances: getDistinctSongPerformanceEntries(s, performanceMeta.setlistOrder)
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

        {(!readOnly || allowExport) && (
          <ExportActions
            copy={[
              {
                id: 'text',
                options: getCopyOptions(
                  'text',
                  [t('results.copy_text'), t('results.copy_text_short')],
                  getText,
                  (abbreviate) => copyToClipboard(getText(abbreviate))
                )
              }
            ]}
            image={{
              busy: showRenderingCanvas,
              actions: [
                {
                  id: 'copy-image',
                  label: t('results.copy'),
                  icon: <FaCopy />,
                  onSelect: () => void screenshot()
                },
                {
                  id: 'download',
                  label: t('results.download'),
                  icon: <FaDownload />,
                  onSelect: () => void download()
                }
              ],
              nicknameLabel: t('settings.use_abbreviations'),
              settings: (
                <ExportSettingsFields
                  title={title}
                  onTitleChange={setTitle}
                  description={description}
                  onDescriptionChange={setDescription}
                />
              )
            }}
            share={onShareResults && { label: t('results.share'), onClick: onShareResults }}
            more={[
              {
                id: 'json',
                label: t('results.export_json'),
                icon: <FaCode />,
                onSelect: () => void exportJSON()
              }
            ]}
          />
        )}

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
        <ExportCanvas
          title={exportTitle}
          description={description}
          timestamp={timestamp}
          compact={!(currentTab !== 'table' && performanceMeta && order)}
        >
          {currentTab !== 'table' && performanceMeta && order ? (
            <PerformanceOrderView
              performanceMeta={performanceMeta}
              abbreviate={useShortNames}
              order={order}
            />
          ) : (
            <SongRankingPoster
              songs={songs}
              performanceMeta={performanceMeta}
              abbreviate={useShortNames}
            />
          )}
        </ExportCanvas>
      )}
    </>
  );
}
