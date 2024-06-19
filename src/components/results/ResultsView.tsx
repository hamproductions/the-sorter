import { useEffect, useState } from 'react';
import { FaCopy, FaDownload, FaShare } from 'react-icons/fa6';

import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import { FormLabel } from '../ui/form-label';
import { Heading } from '../ui/heading';
import { Input } from '../ui/input';
import type { RootProps } from '../ui/tabs';
import * as Tabs from '../ui/tabs';
import { Text } from '../ui/text';
import { Textarea } from '../ui/textarea';
import { GridView } from './GridView';
import { RankingTable } from './RankingTable';
import { RankingView } from './RankingView';
import type { TierListSettings as TierListSettingsData } from './TierList';
import { DEFAULT_TIERS, TierList } from './TierList';
import { TierListSettings } from './TierListSettings';
import type { Character, WithRank } from '~/types';
import { useLocalStorage } from '~/hooks/useLocalStorage';
import { useToaster } from '~/context/ToasterContext';
import { Box, Stack, Wrap } from 'styled-system/jsx';
export type ShareDisplayData = {
  title: string;
  description?: string;
  tierListSettings?: TierListSettingsData;
  tab?: string;
};

export function ResultsView({
  titlePrefix,
  characters,
  isSeiyuu,
  readOnly,
  shareDisplayData,
  onShareResults,
  ...props
}: RootProps & {
  titlePrefix?: string;
  characters: WithRank<Character>[];
  isSeiyuu: boolean;
  readOnly?: boolean;
  shareDisplayData?: {
    title: string;
    description?: string;
    tierListSettings?: TierListSettingsData;
    tab?: string;
  };
  onShareResults?: (params: ShareDisplayData) => void;
}) {
  const { toast } = useToaster();
  const [tierListSettings, setTierListSettings] = useLocalStorage<TierListSettingsData>(
    'tier-settings',
    { tiers: DEFAULT_TIERS }
  );
  const [title, setTitle] = useState<string>('My LoveLive! Ranking');
  const [description, setDescription] = useState<string>();
  const [currentTab, setCurrentTab] = useLocalStorage<'default' | 'table' | 'grid' | 'tier'>(
    'result-tab',
    'default'
  );
  const [timestamp, setTimestamp] = useState(new Date());
  const [showRenderingCanvas, setShowRenderingCanvas] = useState(false);
  const { t } = useTranslation();

  const tabs = [
    { id: 'default', label: t('results.list') },
    { id: 'table', label: t('results.table') },
    { id: 'grid', label: t('results.grid') },
    { id: 'tier', label: t('results.tier') }
  ];
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

  const {
    title: displayTitle,
    description: displayDescription,
    tierListSettings: displayTierListSettings,
    tab: displayCurrentTab
  } = shareDisplayData ?? {};

  const displayTab = currentTab || displayCurrentTab;

  useEffect(() => {
    const sortType = isSeiyuu ? t('seiyuu') : t('character');
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
  }, [titlePrefix, isSeiyuu, currentTab]);
  return (
    <>
      <Stack alignItems="center" w="full" textAlign="center">
        <Heading fontSize="2xl" fontWeight="bold">
          {displayTitle || t('results.sort_results')}
        </Heading>
        {displayDescription && <Text>{displayDescription}</Text>}
        {!readOnly && (
          <>
            <Stack w="full">
              <Text>{t('results.export_settings')}</Text>
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
                  count={characters.length}
                />
              )}
            </Stack>
            <Wrap justifyContent="flex-end" w="full">
              <Button
                variant="subtle"
                onClick={() =>
                  onShareResults?.({
                    title,
                    description,
                    tierListSettings: tierListSettings ?? undefined,
                    tab: displayTab ?? undefined
                  })
                }
              >
                <FaShare /> {t('results.share')}
              </Button>
              <Button variant="subtle" onClick={() => void screenshot()}>
                <FaCopy /> {t('results.copy')}
              </Button>
              <Button onClick={() => void download()}>
                <FaDownload /> {t('results.download')}
              </Button>
            </Wrap>
          </>
        )}
        <Tabs.Root
          lazyMount
          defaultValue="default"
          value={displayTab}
          onValueChange={(d) => setCurrentTab(d.value as 'default' | 'table')}
          {...props}
        >
          {!displayCurrentTab && (
            <Tabs.List>
              {tabs.map((option) => (
                <Tabs.Trigger key={option.id} value={option.id}>
                  {option.label}
                </Tabs.Trigger>
              ))}
              <Tabs.Indicator />
            </Tabs.List>
          )}
          <Box w="full" p="4">
            <Tabs.Content value="default">
              <RankingView characters={characters} isSeiyuu={isSeiyuu} />
            </Tabs.Content>
            <Tabs.Content value="table">
              <RankingTable characters={characters} isSeiyuu={isSeiyuu} responsive />
            </Tabs.Content>
            <Tabs.Content value="grid">
              <GridView characters={characters} isSeiyuu={isSeiyuu} />
            </Tabs.Content>
            <Tabs.Content value="tier">
              <TierList
                characters={characters}
                isSeiyuu={isSeiyuu}
                settings={displayTierListSettings || tierListSettings}
              />
            </Tabs.Content>
          </Box>
        </Tabs.Root>
      </Stack>
      {!readOnly && showRenderingCanvas && (
        <Box position="absolute" w="0" h="0" overflow="hidden">
          <Stack id="results" width="1280px" p="4" bgColor="bg.canvas">
            {title && (
              <Heading fontSize="2xl" fontWeight="bold">
                {title}
              </Heading>
            )}
            {description && <Text>{description}</Text>}
            {currentTab === 'table' ? (
              <RankingTable characters={characters} isSeiyuu={isSeiyuu} />
            ) : currentTab === 'grid' ? (
              <GridView characters={characters} isSeiyuu={isSeiyuu} />
            ) : currentTab === 'tier' ? (
              <TierList
                characters={characters}
                isSeiyuu={isSeiyuu}
                settings={displayTierListSettings || tierListSettings}
              />
            ) : (
              <RankingView characters={characters} isSeiyuu={isSeiyuu} />
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
