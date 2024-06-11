import * as Tabs from '../ui/tabs';
import type { RootProps } from '../ui/tabs';
import { Character, WithRank } from '~/types';
import { RankingTable } from './RankingTable';
import { RankingView } from './RankingView';
import * as htmlToImage from 'html-to-image';
import { Box, Stack, Wrap } from 'styled-system/jsx';
import { Button } from '../ui/button';
import FileSaver from 'file-saver';
import { useToaster } from '~/context/ToasterContext';
import { FaDownload, FaShare } from 'react-icons/fa6';

const tabs = [
  { id: 'default', label: 'Default' },
  { id: 'table', label: 'Table View' }
];
export const ResultsView = ({
  characters,
  isSeiyuu,
  ...props
}: RootProps & { characters: WithRank<Character>[]; isSeiyuu: boolean }) => {
  const { toast } = useToaster();
  const makeScreenshot = async () => {
    const resultsBox = document.getElementById('results');
    if (resultsBox) {
      const shareImage = await htmlToImage.toBlob(resultsBox, {});
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
      console.log(blob);
      FileSaver.saveAs(new File([blob], 'll-sorted.png'));
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <Stack w="full">
      <Wrap>
        <Button variant="subtle" onClick={() => void screenshot()}>
          <FaShare /> Share Screenshot
        </Button>
        <Button variant="subtle" onClick={() => void download()}>
          <FaDownload /> Download
        </Button>
      </Wrap>
      <Tabs.Root defaultValue="default" {...props}>
        <Tabs.List>
          {tabs.map((option) => (
            <Tabs.Trigger key={option.id} value={option.id}>
              {option.label}
            </Tabs.Trigger>
          ))}
          <Tabs.Indicator />
        </Tabs.List>
        <Box id="results" w="full" p="4" bgColor="bg.canvas">
          <Tabs.Content value="default">
            <RankingView characters={characters} isSeiyuu={isSeiyuu} />
          </Tabs.Content>
          <Tabs.Content value="table">
            <RankingTable characters={characters} isSeiyuu={isSeiyuu} />
          </Tabs.Content>
        </Box>
      </Tabs.Root>
    </Stack>
  );
};
