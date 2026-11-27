import { useEffect, useMemo, useState } from 'react';
import { flushSync } from 'react-dom';
import { FaCode, FaCopy, FaDownload, FaXTwitter } from 'react-icons/fa6';

import { useTranslation } from 'react-i18next';

import type { TierListSettings as TierListSettingsData } from '../TierList';
import { DEFAULT_TIERS } from '../TierList';
import { TierListSettings } from '../TierListSettings';
import { HasuSongGridView } from './HasuSongGridView';
import { HasuSongTierList } from './HasuSongTierList';
import { Tabs } from '~/components/ui/tabs';
import { Box, Stack } from 'styled-system/jsx';
import { Heading } from '~/components/ui/heading';
import { useToaster } from '~/context/ToasterContext';
import { useLocalStorage } from '~/hooks/useLocalStorage';
import type { WithRank } from '~/types';
import type { HasuSong } from '~/types/songs';
import type { RootProps } from '~/components/ui/styled/tabs';
import { useClipboard } from '~/hooks/useClipboard';
import { TabIcon } from '~/components/layout/TabIcon';
import { ExportActions } from '~/components/results/ExportActions';
import { getCopyOptions } from '~/components/results/export/copy-options';
import { ExportCanvas } from '~/components/results/export/ExportCanvas';
import { ExportSettingsFields } from '~/components/results/export/ExportSettings';
import { useAbbreviations } from '~/hooks/useAbbreviations';
import { useSongData } from '~/hooks/useSongData';
import { nameKey } from '~/utils/abbreviations';

export function HasuSongResultsView({
  titlePrefix,
  songsData,
  order,
  ...props
}: RootProps & {
  titlePrefix?: string;
  songsData: HasuSong[];
  order?: number[][];
}) {
  const { toast } = useToaster();
  const { copyText: copyToClipboard, copyImage } = useClipboard();
  const [tierListSettings, setTierListSettings] = useLocalStorage<TierListSettingsData>(
    'tier-settings',
    { tiers: DEFAULT_TIERS }
  );
  const [title, setTitle] = useState<string>('My LoveLive! Ranking');
  const [description, setDescription] = useState<string>();
  const [currentTab, setCurrentTab] = useLocalStorage<'grid' | 'tier'>(
    'hasu-songs-result-tab',
    'grid'
  );
  const [timestamp, setTimestamp] = useState(new Date());
  const [showRenderingCanvas, setShowRenderingCanvas] = useState(false);
  const { t, i18n: _i18n } = useTranslation();
  const catalog = useSongData();
  const { enabled: useShortNames, short } = useAbbreviations();
  const exportTitlePrefix =
    (useShortNames && titlePrefix && short.name(titlePrefix)) || titlePrefix;

  const tabs = useMemo(
    () => [
      { id: 'grid', label: t('results.grid') },
      { id: 'tier', label: t('results.tier') }
    ],
    [t]
  );

  useEffect(() => {
    if (!tabs.find((t) => t.id === currentTab)) {
      setCurrentTab('grid');
    }
  }, [currentTab, setCurrentTab, tabs]);

  const songs = useMemo(() => {
    return (
      order
        ?.map((ids, idx, arr) => {
          const startRank = arr
            .slice(0, idx)
            .reduce((p, c) => p + (Array.isArray(c) ? c.length : 1), 1);
          if (Array.isArray(ids)) {
            return ids
              .map((id) => {
                const song = songsData.find((s) => s.id === id);
                return song ? { rank: startRank, ...song } : null;
              })
              .filter((d): d is WithRank<HasuSong> => d !== null);
          } else {
            const chara = songsData.find((i) => i.id === ids);
            if (!chara) return [];
            return [{ rank: startRank, ...chara }];
          }
        })
        .filter((c): c is WithRank<HasuSong>[] => !!c) ?? []
    ).flatMap((s) => s);
  }, [order, songsData]);

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

  const screenshot = () => copyImage(makeScreenshot, true);

  const shortTitle = (title: string) => {
    const find = (text: string) => catalog.find((song) => nameKey(song.name) === nameKey(text));
    const exact = find(title);
    if (exact) return short.song(exact);
    const [, base, version] = /^(.*?)(（[^（）]*）)$/u.exec(title) ?? [];
    const song = base ? find(base) : undefined;
    return song ? `${short.song(song)}${version}` : title;
  };
  const shortUnit = (unit: string) =>
    unit
      .split(', ')
      .map((name) => short.name(name) ?? name)
      .join(', ');
  const exportSong = <T extends HasuSong>(song: T, abbreviate: boolean): T =>
    abbreviate ? { ...song, title: shortTitle(song.title), unitLabel: shortUnit(song.unit) } : song;
  const findSong = (id: number, abbreviate: boolean) => {
    const song = songsData.find((item) => item.id === id);
    return song && exportSong(song, abbreviate);
  };
  const exportSongs = songs.map((song) => exportSong(song, useShortNames));

  const getText = (abbreviate: boolean) =>
    order
      ?.flatMap((item, idx) =>
        item.map((i) => {
          const s = findSong(i, abbreviate);
          return `${idx + 1}. ${s?.title} - ${s?.unitLabel ?? s?.unit}`;
        })
      )
      .join('\n') ?? '';

  const exportJSON = async () => {
    await copyToClipboard(
      JSON.stringify(
        order?.flatMap((item, idx) =>
          item.map((i) => {
            const s = songsData.find((s) => s.id === i);
            return {
              rank: idx + 1,
              title: s?.title,
              unit: s?.unit
            };
          })
        )
      )
    );
  };

  const getShareText = (abbreviate: boolean) => {
    const seiyuuList = order
      ?.flatMap((ids, idx) =>
        ids.map((id) => {
          const song = findSong(id, abbreviate);
          if (!song) return;
          return `${idx + 1}. ${song.title}`;
        })
      )
      .slice(0, 5)
      .join('\n');
    return `${t('results.hasu_songs.share_text.title')}\n${seiyuuList}\n${t(
      'results.hasu_songs.share_text.footer'
    )}\nhttps://hamproductions.github.io/the-sorter/hasu-music`;
  };

  const shareToX = () => {
    const shareURL = `https://twitter.com/intent/tweet?text=${encodeURIComponent(getShareText(useShortNames))}`;
    window.open(shareURL, '_blank');
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
    const sortType = t('hasu-songs');
    const type = currentTab === 'tier' ? t('results.tierlist') : t('results.ranking');
    return prefix
      ? t('results.results_title', { titlePrefix: prefix, sortType, type })
      : t('results.default_results_title', { titlePrefix: prefix, sortType, type });
  };
  const defaultTitle = makeTitle(titlePrefix);
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
        <ExportActions
          copy={[
            {
              id: 'text',
              label: t('results.all_results'),
              options: getCopyOptions(
                'text',
                [t('results.copy_text'), t('results.copy_text_short')],
                getText,
                (abbreviate) => copyToClipboard(getText(abbreviate))
              )
            },
            {
              id: 'top5',
              label: t('results.top5_post'),
              options: getCopyOptions(
                'top5',
                [t('results.copy_results'), t('results.copy_results_short')],
                getShareText,
                (abbreviate) => copyToClipboard(getShareText(abbreviate))
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
            nicknameHint: t('results.also_applies_x'),
            settings: (
              <>
                <ExportSettingsFields
                  title={title}
                  onTitleChange={setTitle}
                  description={description}
                  onDescriptionChange={setDescription}
                />
                {currentTab === 'tier' && tierListSettings && (
                  <TierListSettings
                    settings={tierListSettings}
                    setSettings={setTierListSettings}
                    count={songs.length}
                  />
                )}
              </>
            )
          }}
          more={[
            {
              id: 'share-x',
              label: t('results.share_x'),
              icon: <FaXTwitter />,
              onSelect: shareToX
            },
            {
              id: 'json',
              label: t('results.export_json'),
              icon: <FaCode />,
              onSelect: () => void exportJSON()
            }
          ]}
        />

        <Tabs.Root
          lazyMount
          defaultValue="default"
          value={currentTab}
          onValueChange={(d) => setCurrentTab(d.value as 'tier' | 'grid')}
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
          <Box w="full" p="4">
            <Tabs.Content value="grid">
              <HasuSongGridView songs={songs} />
            </Tabs.Content>
            <Tabs.Content value="tier">
              <HasuSongTierList songs={songs} settings={tierListSettings} />
            </Tabs.Content>
          </Box>
        </Tabs.Root>
      </Stack>
      {showRenderingCanvas && (
        <ExportCanvas title={exportTitle} description={description} timestamp={timestamp}>
          {currentTab === 'grid' ? (
            <HasuSongGridView songs={exportSongs} />
          ) : (
            <HasuSongTierList songs={exportSongs} settings={tierListSettings} />
          )}
        </ExportCanvas>
      )}
    </>
  );
}
