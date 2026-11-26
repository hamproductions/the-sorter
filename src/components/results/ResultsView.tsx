import { useEffect, useMemo, useState } from 'react';
import { flushSync } from 'react-dom';
import { FaChevronDown, FaCopy, FaDownload, FaPencil, FaShare, FaXTwitter } from 'react-icons/fa6';

import { useTranslation } from 'react-i18next';
import { Accordion } from '../ui/accordion';
import { Button } from '../ui/button';
import { FormLabel } from '../ui/form-label';
import { Heading } from '../ui/heading';
import { Input } from '../ui/input';

import { Tabs } from '../ui/tabs';
import { Text } from '../ui/text';
import { Textarea } from '../ui/textarea';
import type { RootProps } from '../ui/styled/tabs';
import { GridView } from './GridView';
import { RankingTable } from './RankingTable';
import { RankingView } from './RankingView';
import type { TierListSettings as TierListSettingsData } from './TierList';
import { DEFAULT_TIERS, TierList } from './TierList';
import { TierListSettings } from './TierListSettings';
import { EditResultsModal } from './edit/EditResultsModal';
import { getCastName, getCharacterFromId, getFullName, parseSortResult } from '~/utils/character';
import type { Character } from '~/types';
import { useLocalStorage } from '~/hooks/useLocalStorage';
import { useToaster } from '~/context/ToasterContext';
import { Box, Stack, Wrap } from 'styled-system/jsx';
import { ExportActions } from '~/components/results/ExportActions';
import { useAbbreviations } from '~/hooks/useAbbreviations';
import { useClipboard } from '~/hooks/useClipboard';
import { TabIcon } from '~/components/layout/TabIcon';

export type ShareDisplayData = {
  title: string;
  description?: string;
  tierListSettings?: TierListSettingsData;
  tab?: string;
};

export function ResultsView({
  titlePrefix,
  charactersData,
  order,
  isSeiyuu,
  readOnly,
  allowExport,
  shareDisplayData,
  onShareResults,
  onSelectCharacter,
  ...props
}: RootProps & {
  titlePrefix?: string;
  charactersData: Character[];
  order?: string[][];
  isSeiyuu: boolean;
  readOnly?: boolean;
  allowExport?: boolean;
  shareDisplayData?: {
    title: string;
    description?: string;
    tierListSettings?: TierListSettingsData;
    tab?: string;
  };
  onShareResults?: (params: ShareDisplayData) => void;
  onSelectCharacter?: (character: Character) => void;
}) {
  const { toast } = useToaster();
  const { enabled: useShortNames, short } = useAbbreviations();
  const exportTitlePrefix =
    (useShortNames && titlePrefix && short.name(titlePrefix)) || titlePrefix;
  const { copyText: copyToClipboard, copyImage } = useClipboard();
  const [tierListSettings, setTierListSettings] = useLocalStorage<TierListSettingsData>(
    'tier-settings',
    { tiers: DEFAULT_TIERS }
  );
  const [showEditResults, setShowEditResults] = useState(false);
  const [title, setTitle] = useState<string>('My LoveLive! Ranking');
  const [description, setDescription] = useState<string>();
  const [currentTab, setCurrentTab] = useLocalStorage<'default' | 'table' | 'grid' | 'tier'>(
    'result-tab',
    'default'
  );
  const [savedDisplayOrder, setSavedDisplayOrder] = useLocalStorage<string[][]>(
    readOnly ? 'results-display-order-read-only' : 'results-display-order',
    readOnly ? undefined : order
  );
  const [timestamp, setTimestamp] = useState(new Date());
  const [showRenderingCanvas, setShowRenderingCanvas] = useState(false);
  const { t, i18n } = useTranslation();

  const tabs = useMemo(
    () => [
      { id: 'default', label: t('results.list') },
      { id: 'table', label: t('results.table') },
      { id: 'grid', label: t('results.grid') },
      { id: 'tier', label: t('results.tier') }
    ],
    [t]
  );

  useEffect(() => {
    if (!tabs.find((t) => t.id === currentTab)) {
      setCurrentTab('default');
    }
  }, [currentTab, setCurrentTab, tabs]);

  const displayOrder =
    !readOnly && savedDisplayOrder?.length === order?.length ? savedDisplayOrder : order;

  const characters = useMemo(() => {
    if (!displayOrder) return [];
    return parseSortResult(displayOrder, charactersData, isSeiyuu);
  }, [displayOrder, charactersData, isSeiyuu]);

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

  const getShareText = (abbreviate: boolean) => {
    const seiyuuList = order
      ?.flatMap((ids, idx) =>
        ids.map((id) => {
          const character = getCharacterFromId(charactersData, id, isSeiyuu);
          if (!character) return;
          const name = isSeiyuu
            ? getCastName(character?.casts[0], i18n.language)
            : ((abbreviate ? short.name(character.fullName) : undefined) ??
              getFullName(character, i18n.language));
          return `${idx + 1}. ${name}`;
        })
      )
      .slice(0, 5)
      .join('\n');
    return `${t('results.share_text.title')}\n${seiyuuList}\n${t(
      'results.share_text.footer'
    )}\nhttps://hamproductions.github.io/the-sorter/`;
  };
  const shareToX = () => {
    const shareURL = `https://twitter.com/intent/tweet?text=${encodeURIComponent(getShareText(useShortNames))}`;
    window.open(shareURL, '_blank');
  };

  const copyText = async (abbreviate: boolean) => {
    await copyToClipboard(getShareText(abbreviate));
  };

  const exportCharacters = useShortNames
    ? characters.map((character) => {
        const name = short.name(character.fullName);
        return name
          ? { ...character, originalName: character.fullName, fullName: name, englishName: name }
          : character;
      })
    : characters;

  const {
    title: displayTitle,
    description: displayDescription,
    tierListSettings: displayTierListSettings,
    tab: displayCurrentTab
  } = shareDisplayData ?? {};

  const displayTab = currentTab || displayCurrentTab;

  const makeTitle = (prefix?: string) => {
    const sortType = isSeiyuu ? t('seiyuu') : t('character');
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
          {displayTitle || t('results.sort_results')}
        </Heading>
        {displayDescription && <Text>{displayDescription}</Text>}
        {(!readOnly || allowExport) && (
          <Stack w="full">
            <Wrap justifyContent="center">
              <Button variant="subtle" onClick={() => void copyText(false)}>
                {t('results.copy_results')}
              </Button>
              <Button variant="subtle" onClick={() => void copyText(true)}>
                {t('results.copy_results_short')}
              </Button>
              <Button onClick={() => void shareToX()}>
                <FaXTwitter /> {t('results.share_x')}
              </Button>
            </Wrap>
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
                        <Input
                          id="title"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                        />
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
                  </Stack>
                </Accordion.ItemContent>
              </Accordion.Item>
            </Accordion.Root>
            <ExportActions>
              {!readOnly && (
                <Button
                  variant="subtle"
                  onClick={() => setShowEditResults(true)}
                  mr={{ md: 'auto' }}
                >
                  <FaPencil /> {t('results.edit')}
                </Button>
              )}
              {onShareResults && (
                <Button
                  variant="subtle"
                  data-testid="share-results-button"
                  onClick={() =>
                    onShareResults({
                      title,
                      description,
                      tierListSettings: tierListSettings ?? undefined,
                      tab: displayTab ?? undefined
                    })
                  }
                >
                  <FaShare /> {t('results.share')}
                </Button>
              )}
              <Button variant="subtle" onClick={() => void screenshot()}>
                <FaCopy /> {t('results.copy')}
              </Button>
              <Button onClick={() => void download()}>
                <FaDownload /> {t('results.download')}
              </Button>
            </ExportActions>
          </Stack>
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
                  <TabIcon id={option.id} />
                  {option.label}
                </Tabs.Trigger>
              ))}
              <Tabs.Indicator />
            </Tabs.List>
          )}
          <Box w="full" p="4">
            <Tabs.Content value="default">
              <RankingView
                characters={characters}
                isSeiyuu={isSeiyuu}
                onSelectCharacter={onSelectCharacter}
              />
            </Tabs.Content>
            <Tabs.Content value="table">
              <RankingTable
                characters={characters}
                isSeiyuu={isSeiyuu}
                onSelectCharacter={onSelectCharacter}
                responsive
              />
            </Tabs.Content>
            <Tabs.Content value="grid">
              <GridView
                characters={characters}
                onSelectCharacter={onSelectCharacter}
                isSeiyuu={isSeiyuu}
              />
            </Tabs.Content>
            <Tabs.Content value="tier">
              <TierList
                onSelectCharacter={onSelectCharacter}
                characters={characters}
                isSeiyuu={isSeiyuu}
                settings={displayTierListSettings || tierListSettings}
              />
            </Tabs.Content>
          </Box>
        </Tabs.Root>
      </Stack>
      {(!readOnly || allowExport) && showRenderingCanvas && (
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
                <RankingTable
                  characters={exportCharacters}
                  isSeiyuu={isSeiyuu}
                  abbreviate={useShortNames}
                />
              ) : currentTab === 'grid' ? (
                <GridView characters={exportCharacters} isSeiyuu={isSeiyuu} />
              ) : currentTab === 'tier' ? (
                <TierList
                  characters={exportCharacters}
                  isSeiyuu={isSeiyuu}
                  settings={displayTierListSettings || tierListSettings}
                />
              ) : (
                <RankingView
                  characters={exportCharacters}
                  isSeiyuu={isSeiyuu}
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
      <EditResultsModal
        setOrder={setSavedDisplayOrder}
        charactersData={charactersData}
        open={showEditResults}
        onOpenChange={({ open }) => setShowEditResults(open)}
        originalOrder={order ?? []}
        isSeiyuu={isSeiyuu}
        order={savedDisplayOrder ?? []}
      />
    </>
  );
}
