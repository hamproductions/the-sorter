import { useEffect, useMemo, useState } from 'react';
import { FaChevronDown, FaCopy, FaDownload, FaXTwitter } from 'react-icons/fa6';

import { useTranslation } from 'react-i18next';

import type { TierListSettings as TierListSettingsData } from '../TierList';
import { DEFAULT_TIERS } from '../TierList';
import { TierListSettings } from '../TierListSettings';
import { HasuSongGridView } from './HasuSongGridView';
import { HasuSongTierList } from './HasuSongTierList';
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
import type { HasuSong } from '~/types/songs';
import { Button } from '~/components/ui/button';
import type { RootProps } from '~/components/ui/styled/tabs';

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

  const tabs = [
    { id: 'grid', label: t('results.grid') },
    { id: 'tier', label: t('results.tier') }
  ];

  useEffect(() => {
    if (!tabs.find((t) => t.id === currentTab)) {
      setCurrentTab('grid');
    }
  }, [currentTab]);

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
    setShowRenderingCanvas(true);
    toast?.({ description: t('toast.generating_screenshot') });
    const domToBlob = await import('modern-screenshot').then((module) => module.domToBlob);
    const resultsBox = document.getElementById('results');
    setTimestamp(new Date());
    if (resultsBox) {
      const shareImage = await domToBlob(resultsBox, {
        quality: 1,
        scale: 2,
        type: 'image/png',
        features: { removeControlCharacter: false }
      });
      setShowRenderingCanvas(false);
      return shareImage;
    }
  };

  const screenshot = async () => {
    const shareImage = await makeScreenshot();
    if (!shareImage) return;
    try {
      await navigator.share({
        text: t('share.copy_text'),
        files: [new File([shareImage], 'll-sorted.png')]
      });
    } catch {
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': shareImage }, { presentationStyle: 'attachment' })
      ]);
      toast?.({ description: t('toast.screenshot_copied') });
    }
  };

  const exportText = async () => {
    await navigator.clipboard.writeText(
      order
        ?.flatMap((item, idx) =>
          item.map((i) => {
            const s = songsData.find((s) => s.id === i);
            return `${idx + 1}. ${s?.title} - ${s?.unit}`;
          })
        )
        .join('\n') ?? ''
    );
    toast?.({ description: t('toast.text_copied') });
  };

  const exportJSON = async () => {
    await navigator.clipboard.writeText(
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
    toast?.({ description: t('toast.text_copied') });
  };

  const getShareText = () => {
    const seiyuuList = order
      ?.flatMap((ids, idx) =>
        ids.map((id) => {
          const song = songsData.find((s) => s.id === id);
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
    const shareURL = `https://twitter.com/intent/tweet?text=${encodeURIComponent(getShareText())}`;
    window.open(shareURL, '_blank');
  };

  const copyText = async () => {
    await navigator.clipboard.writeText(getShareText());
    toast?.({ description: t('toast.text_copied') });
  };

  const download = async () => {
    try {
      const blob = await makeScreenshot();
      if (!blob) return;
      const saveAs = (await import('file-saver')).saveAs;
      saveAs(new File([blob], `${titlePrefix ?? 'll'}-sorted-${timestamp.valueOf()}.png`));
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    const sortType = t('hasu-songs');
    const type = currentTab === 'tier' ? t('results.tierlist') : t('results.ranking');
    setTitle(
      titlePrefix
        ? t('results.results_title', { titlePrefix, sortType, type })
        : t('results.default_results_title', {
            titlePrefix,
            sortType,
            type
          })
    );
  }, [titlePrefix, currentTab]);
  return (
    <>
      <Stack alignItems="center" w="full" textAlign="center">
        <Heading fontSize="2xl" fontWeight="bold">
          {t('results.sort_results')}
        </Heading>
        <HStack justifyContent="center">
          <Button variant="subtle" onClick={() => void copyText()}>
            {t('results.copy_results')}
          </Button>
          <Button onClick={() => void shareToX()}>
            <FaXTwitter /> {t('results.share_x')}
          </Button>
        </HStack>
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
                    {currentTab === 'tier' && tierListSettings && (
                      <TierListSettings
                        settings={tierListSettings}
                        setSettings={setTierListSettings}
                        count={songs.length}
                      />
                    )}
                  </Stack>
                </Stack>
              </Accordion.ItemContent>
            </Accordion.Item>
          </Accordion.Root>
          <HStack justifyContent="space-between" w="full">
            <Wrap justifyContent="flex-end" w="full">
              <Button variant="subtle" onClick={() => void exportJSON()}>
                <FaCopy /> {t('results.export_json')}
              </Button>
              <Button variant="subtle" onClick={() => void exportText()}>
                <FaCopy /> {t('results.copy_text')}
              </Button>
              <Button variant="subtle" onClick={() => void screenshot()}>
                <FaCopy /> {t('results.copy')}
              </Button>
              <Button onClick={() => void download()}>
                <FaDownload /> {t('results.download')}
              </Button>
            </Wrap>
          </HStack>
        </Stack>

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
        <Box position="absolute" w="0" h="0" overflow="hidden">
          <Stack id="results" width="1280px" p="4" bgColor="bg.canvas">
            {title && (
              <Heading fontSize="2xl" fontWeight="bold">
                {title}
              </Heading>
            )}
            {description && <Text>{description}</Text>}
            {currentTab === 'grid' ? (
              <HasuSongGridView songs={songs} />
            ) : (
              <HasuSongTierList songs={songs} settings={tierListSettings} />
            )}
            <Text textAlign="end">
              {t('results.generated_at')}: {timestamp.toLocaleString()}
            </Text>
          </Stack>
        </Box>
      )}
    </>
  );
}
