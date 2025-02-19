import { useEffect, useMemo, useState } from 'react';
import { FaChevronDown, FaCopy, FaDownload } from 'react-icons/fa6';

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

export function SongResultsView({
  titlePrefix,
  songsData,
  order,
  ...props
}: RootProps & {
  titlePrefix?: string;
  songsData: Song[];
  order?: string[][];
}) {
  const artists = useArtistsData();
  const seriesData = useSeriesData();
  const { toast } = useToaster();
  const [title, setTitle] = useState<string>('My LoveLive! Song Ranking');
  const [description, setDescription] = useState<string>();
  const [currentTab, setCurrentTab] = useLocalStorage<'table'>('songs-result-tab', 'table');
  const [timestamp, setTimestamp] = useState(new Date());
  const [showRenderingCanvas, setShowRenderingCanvas] = useState(false);
  const { t, i18n: _i18n } = useTranslation();

  const tabs = [{ id: 'table', label: t('results.table') }];

  const songs = useMemo(() => {
    return (
      order
        ?.map((ids, idx, arr) => {
          const startRank = arr
            .slice(0, idx)
            .reduce((p, c) => p + (Array.isArray(c) ? c.length : 1), 1);
          if (Array.isArray(ids)) {
            return ids
              .map((id) => ({
                rank: startRank,
                ...(songsData.find((s) => s.id === `${id}`) ?? {})
              }))
              .filter((d) => 'id' in d);
          } else {
            const chara = songsData.find((i) => i.id === ids);
            if (!chara) return [];
            return [{ rank: startRank, ...chara }];
          }
        })
        .filter((c): c is WithRank<Song>[] => !!c) ?? []
    ).flatMap((s) => s);
  }, [order, songsData]);

  const makeScreenshot = async () => {
    setShowRenderingCanvas(true);
    toast?.(t('toast.generating_screenshot'));
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
      toast?.(t('toast.screenshot_copied'));
    }
  };

  const exportText = async () => {
    await navigator.clipboard.writeText(
      order
        ?.flatMap((item, idx) =>
          item.map((i) => {
            const s = songsData.find((s) => s.id === `${i}`);
            const artist = uniq(s?.artists).map((id) => artists.find((a) => a.id === id));
            return `${idx + 1}. ${s?.name} - ${artist?.[0]?.name ?? 'unknown'}`;
          })
        )
        .join('\n') ?? ''
    );
    toast?.(t('toast.text_copied'));
  };

  const exportJSON = async () => {
    await navigator.clipboard.writeText(
      JSON.stringify(
        order?.flatMap((item, idx) =>
          item.map((i) => {
            const s = songsData.find((s) => s.id === `${i}`);
            const artist = uniq(s?.artists).map((id) => artists.find((a) => a.id === id));
            const series = uniq(s?.seriesIds).map((id) => seriesData.find((a) => a.id === `${id}`));
            return {
              rank: idx + 1,
              title: s?.name,
              series: series.map((a) => a?.name)?.join(', '),
              unit: artist.map((a) => a?.name)?.join(', ')
            };
          })
        )
      )
    );
    toast?.(t('toast.text_copied'));
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
    const sortType = t('songs');
    const type = t('results.ranking');
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
          defaultValue="table"
          value={currentTab}
          onValueChange={(d) => setCurrentTab(d.value as 'table')}
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
            <Tabs.Content value="table">
              <SongRankingTable songs={songs} />
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
            {currentTab === 'table' ? (
              <SongRankingTable songs={songs} />
            ) : (
              <SongRankingTable songs={songs} />
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
