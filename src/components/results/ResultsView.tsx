import { useEffect, useMemo, useState } from 'react';
import { flushSync } from 'react-dom';
import { FaCopy, FaDownload, FaPencil, FaXTwitter } from 'react-icons/fa6';

import { useTranslation } from 'react-i18next';
import { Heading } from '../ui/heading';

import { Tabs } from '../ui/tabs';
import { Text } from '../ui/text';
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
import { Box, Stack } from 'styled-system/jsx';
import { ExportActions } from '~/components/results/ExportActions';
import { getCopyOptions } from '~/components/results/export/copy-options';
import { ExportCanvas } from '~/components/results/export/ExportCanvas';
import { ExportSettingsFields } from '~/components/results/export/ExportSettings';
import { CharacterRankingPoster } from '~/components/results/poster/CharacterRankingPoster';
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

  const copyText = (abbreviate: boolean) => copyToClipboard(getShareText(abbreviate));

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
          <ExportActions
            copy={[
              {
                id: 'top5',
                label: t('results.top5_post'),
                options: getCopyOptions(
                  'top5',
                  [t('results.copy_results'), t('results.copy_results_short')],
                  getShareText,
                  copyText
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
                      count={characters.length}
                    />
                  )}
                </>
              )
            }}
            share={
              onShareResults && {
                label: t('results.share'),
                testId: 'share-results-button',
                onClick: () =>
                  onShareResults({
                    title,
                    description,
                    tierListSettings: tierListSettings ?? undefined,
                    tab: displayTab ?? undefined
                  })
              }
            }
            more={[
              {
                id: 'share-x',
                label: t('results.share_x'),
                icon: <FaXTwitter />,
                onSelect: shareToX
              },
              ...(readOnly
                ? []
                : [
                    {
                      id: 'edit',
                      label: t('results.edit'),
                      icon: <FaPencil />,
                      onSelect: () => setShowEditResults(true)
                    }
                  ])
            ]}
          />
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
        <ExportCanvas
          title={exportTitle}
          description={description}
          timestamp={timestamp}
          compact={currentTab !== 'grid' && currentTab !== 'tier'}
        >
          {currentTab === 'grid' ? (
            <GridView characters={exportCharacters} isSeiyuu={isSeiyuu} />
          ) : currentTab === 'tier' ? (
            <TierList
              characters={exportCharacters}
              isSeiyuu={isSeiyuu}
              settings={displayTierListSettings || tierListSettings}
            />
          ) : (
            <CharacterRankingPoster
              characters={exportCharacters}
              isSeiyuu={isSeiyuu}
              detailed={currentTab === 'table'}
              abbreviate={useShortNames}
            />
          )}
        </ExportCanvas>
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
