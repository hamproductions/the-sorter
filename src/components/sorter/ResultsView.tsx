import FileSaver from 'file-saver';
import { useEffect, useState } from 'react';
import { FaCopy, FaDownload } from 'react-icons/fa6';
import { Box, Stack, Wrap } from 'styled-system/jsx';
import { useToaster } from '~/context/ToasterContext';
import { Character, WithRank } from '~/types';
import { Button } from '../ui/button';
import { FormLabel } from '../ui/form-label';
import { Heading } from '../ui/heading';
import { Input } from '../ui/input';
import type { RootProps } from '../ui/tabs';
import * as Tabs from '../ui/tabs';
import { Text } from '../ui/text';
import { Textarea } from '../ui/textarea';
import { RankingTable } from './RankingTable';
import { RankingView } from './RankingView';
import { domToBlob } from 'modern-screenshot';

const tabs = [
  { id: 'default', label: 'Default' },
  { id: 'table', label: 'Table View' }
];
export const ResultsView = ({
  titlePrefix,
  characters,
  isSeiyuu,
  ...props
}: RootProps & { titlePrefix?: string; characters: WithRank<Character>[]; isSeiyuu: boolean }) => {
  const { toast } = useToaster();
  const [title, setTitle] = useState<string>('My LoveLive! Ranking');
  const [description, setDescription] = useState<string>();
  const [currentTab, setCurrentTab] = useState<'default' | 'table'>('default');
  const [timestamp, setTimestamp] = useState(new Date());

  const makeScreenshot = async () => {
    setTimestamp(new Date());
    const resultsBox = document.getElementById('results');
    if (resultsBox) {
      const shareImage = await domToBlob(resultsBox, {
        quality: 1,
        scale: 2,
        type: 'image/png',
        features: { removeControlCharacter: false }
      });
      return shareImage;
    }
  };
  const screenshot = async () => {
    const shareImage = await makeScreenshot();
    if (!shareImage) return;
    try {
      await navigator.share({
        text: 'Check out my sorted LL! characters',
        files: [new File([shareImage], 'll-sorted.png')]
      });
    } catch {
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': shareImage }, { presentationStyle: 'attachment' })
      ]);
      toast?.('Screenshot Copied to Clipboard');
    }
  };

  const download = async () => {
    try {
      const blob = await makeScreenshot();
      if (!blob) return;
      FileSaver.saveAs(
        new File([blob], `${titlePrefix ?? 'll'}-sorted-${timestamp.valueOf()}.png`)
      );
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    setTitle(
      titlePrefix
        ? `My ${titlePrefix} ${isSeiyuu ? 'Seiyuu' : 'Character'} Ranking`
        : `My LoveLive! ${isSeiyuu ? 'Seiyuu' : 'Character'} Ranking`
    );
  }, [titlePrefix, isSeiyuu]);
  return (
    <>
      <Stack w="full">
        <Heading fontSize="2xl" fontWeight="bold">
          Results
        </Heading>
        <Stack>
          <Text>Export Settings</Text>
          <Wrap>
            <FormLabel htmlFor="title">Title</FormLabel>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </Wrap>
          <Wrap>
            <FormLabel htmlFor="description">Description (Optional)</FormLabel>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Wrap>
        </Stack>
        <Wrap justifyContent="flex-end">
          <Button variant="subtle" onClick={() => void screenshot()}>
            <FaCopy /> Copy Screenshot
          </Button>
          <Button onClick={() => void download()}>
            <FaDownload /> Download
          </Button>
        </Wrap>
        <Tabs.Root
          lazyMount
          defaultValue="default"
          value={currentTab}
          onValueChange={(d) => setCurrentTab(d.value as 'default' | 'table')}
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
            <Tabs.Content value="default">
              <RankingView characters={characters} isSeiyuu={isSeiyuu} />
            </Tabs.Content>
            <Tabs.Content value="table">
              <RankingTable characters={characters} isSeiyuu={isSeiyuu} />
            </Tabs.Content>
          </Box>
        </Tabs.Root>
      </Stack>
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
          ) : (
            <RankingView characters={characters} isSeiyuu={isSeiyuu} />
          )}
          <Text textAlign="end">Generated at: {timestamp.toLocaleString()}</Text>
        </Stack>
      </Box>
    </>
  );
};
