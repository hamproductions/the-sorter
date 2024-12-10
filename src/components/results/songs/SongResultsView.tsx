import { useEffect, useMemo, useState } from 'react';
import { FaChevronDown, FaCopy, FaDownload } from 'react-icons/fa6';

import { useTranslation } from 'react-i18next';

import type { TierListSettings as TierListSettingsData } from '../TierList';
import { DEFAULT_TIERS } from '../TierList';
import { TierListSettings } from '../TierListSettings';
import { SongGridView } from './SongGridView';
import { SongTierList } from './SongTierList';
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

export function SongResultsView({
  titlePrefix,
  songsData,
  order,
  ...props
}: RootProps & {
  titlePrefix?: string;
  songsData: Song[];
  order?: number[][];
}) {
  const { toast } = useToaster();
  const [tierListSettings, setTierListSettings] = useLocalStorage<TierListSettingsData>(
    'tier-settings',
    { tiers: DEFAULT_TIERS }
  );
  const [title, setTitle] = useState<string>('My LoveLive! Ranking');
  const [description, setDescription] = useState<string>();
  const [currentTab, setCurrentTab] = useLocalStorage<'grid' | 'tier'>('songs-result-tab', 'grid');
  const [timestamp, setTimestamp] = useState(new Date());
  const [showRenderingCanvas, setShowRenderingCanvas] = useState(false);
  const { t, i18n: _i18n } = useTranslation();

  const tabs = [
    { id: 'default', label: t('results.list') },
    { id: 'table', label: t('results.table') },
    { id: 'grid', label: t('results.grid') },
    { id: 'tier', label: t('results.tier') }
  ];

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
                ...(songsData.find((s) => s.id === id) ?? {})
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

  const download = async () => {
    try {
      const blob = await makeScreenshot();
      if (!blob) return;
      const saveAs = (await import('file-saver')).saveAs;
      saveAs(new File([blob], `${titlePrefix ?? 'll'}-sorted-${timestamp.valueOf()}.png`));
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    const sortType = t('songs');
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
              <SongGridView songs={songs} />
            </Tabs.Content>
            <Tabs.Content value="tier">
              <SongTierList songs={songs} settings={tierListSettings} />
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
              <SongGridView songs={songs} />
            ) : (
              <SongTierList songs={songs} settings={tierListSettings} />
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
