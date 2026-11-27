/**
 * Export and Share Tools Component
 * Provides buttons for exporting and sharing predictions
 */

import { useState, useRef, useId } from 'react';
import { useTranslation } from 'react-i18next';
import { domToPng } from 'modern-screenshot';
import { FaDownload, FaFileCsv, FaCode } from 'react-icons/fa6';
import { Box, Stack } from 'styled-system/jsx';
import { ExportActions } from '~/components/results/ExportActions';
import { getCopyOptions } from '~/components/results/export/copy-options';
import { FormLabel } from '~/components/ui/form-label';
import { Input } from '~/components/ui/styled/input';
import { Text } from '~/components/ui/styled/text';
import type { SetlistPrediction, Performance } from '~/types/setlist-prediction';
import { getFullPerformanceName, getSongName } from '~/utils/names';
import { useSongData } from '~/hooks/useSongData';
import {
  generateShareUrl,
  canShareUrl,
  estimateShareUrlSize
} from '~/utils/setlist-prediction/compression';
import {
  downloadJSON,
  downloadCSV,
  copyTextToClipboard,
  exportAsText
} from '~/utils/setlist-prediction/export';
import { useToaster } from '~/context/ToasterContext';
import { SetlistView } from '~/components/setlist-prediction/SetlistView';
import { useAbbreviations } from '~/hooks/useAbbreviations';

export interface ExportShareToolsProps {
  prediction: SetlistPrediction;
  performance?: Performance;
}

export function ExportShareTools({ prediction, performance }: ExportShareToolsProps) {
  const { t, i18n } = useTranslation();
  const songs = useSongData();
  const { toast } = useToaster();
  const [isSharing, setIsSharing] = useState(false);
  const [isExportingImage, setIsExportingImage] = useState(false);
  const [authorName, setAuthorName] = useState('');
  const setlistExportRef = useRef<HTMLDivElement>(null);
  const { enabled: useShortNames, short } = useAbbreviations();
  const authorId = useId();

  const handleShareUrl = async () => {
    setIsSharing(true);
    try {
      // Check if URL is shareable
      if (!canShareUrl(prediction)) {
        const { compressed } = estimateShareUrlSize(prediction);
        toast({
          title: t('setlistPrediction.urlTooLong', {
            defaultValue: 'Prediction too large to share via URL'
          }),
          description: t('setlistPrediction.urlTooLongHint', {
            defaultValue: `URL size: ${compressed} chars. Try removing some items or use JSON export instead.`
          }),
          type: 'error'
        });
        return;
      }

      const shareUrl = generateShareUrl(prediction, window.location.origin);

      // Copy to clipboard
      await navigator.clipboard.writeText(shareUrl);

      toast({
        title: t('setlistPrediction.urlCopied', { defaultValue: 'Share URL copied!' }),
        description: t('setlistPrediction.urlCopiedHint', {
          defaultValue: 'Share this URL with your friends!'
        }),
        type: 'success'
      });
    } catch {
      toast({
        title: t('common.error', { defaultValue: 'Error' }),
        description: t('setlistPrediction.failedToCopy', {
          defaultValue: 'Failed to copy URL to clipboard'
        }),
        type: 'error'
      });
    } finally {
      setIsSharing(false);
    }
  };

  const getTextArgs = (abbreviate: boolean) =>
    [
      prediction,
      abbreviate && performance
        ? {
            ...performance,
            tourName: short.event(getFullPerformanceName(performance), performance.tourName),
            performanceName: undefined
          }
        : performance,
      authorName,
      (songId: string) => {
        const song = songs.find((item) => String(item.id) === String(songId));
        if (!song) return undefined;
        return abbreviate
          ? short.song(song)
          : getSongName(song.name, song.englishName, i18n.language);
      }
    ] as const;

  const getTextPreview = (abbreviate: boolean) =>
    exportAsText(...getTextArgs(abbreviate))
      .split('\n')
      .filter((line) => /^\d+\./.test(line))
      .join('\n');

  const handleCopyText = async (abbreviate: boolean) => {
    try {
      await copyTextToClipboard(...getTextArgs(abbreviate));

      toast({
        title: t('toast.text_copied', { defaultValue: 'Text copied to clipboard' }),
        type: 'success'
      });
      return true;
    } catch {
      toast({
        title: t('common.error', { defaultValue: 'Error' }),
        description: t('setlistPrediction.failedToCopy', {
          defaultValue: 'Failed to copy text to clipboard'
        }),
        type: 'error'
      });
      return false;
    }
  };

  const handleDownloadJSON = () => {
    try {
      downloadJSON(prediction);

      toast({
        title: t('setlistPrediction.jsonDownloaded', {
          defaultValue: 'JSON file downloaded'
        }),
        type: 'success'
      });
    } catch {
      toast({
        title: t('common.error', { defaultValue: 'Error' }),
        description: t('setlistPrediction.failedToDownload', {
          defaultValue: 'Failed to download JSON'
        }),
        type: 'error'
      });
    }
  };

  const handleDownloadCSV = () => {
    try {
      downloadCSV(prediction);

      toast({
        title: t('setlistPrediction.csvDownloaded', { defaultValue: 'CSV file downloaded' }),
        type: 'success'
      });
    } catch {
      toast({
        title: t('common.error', { defaultValue: 'Error' }),
        description: t('setlistPrediction.failedToDownload', {
          defaultValue: 'Failed to download CSV'
        }),
        type: 'error'
      });
    }
  };

  const handleExportImage = async () => {
    if (!setlistExportRef.current) return;

    setIsExportingImage(true);
    try {
      // Get the current background color from computed styles
      const bgColor = window.getComputedStyle(setlistExportRef.current).backgroundColor;

      const dataUrl = await domToPng(setlistExportRef.current, {
        scale: 2, // 2x resolution for better quality
        backgroundColor: bgColor
      });

      // Generate filename from performance info
      let filename = 'setlist-prediction';
      if (performance) {
        const datePart = new Date(performance.date).toISOString().split('T')[0]; // YYYY-MM-DD
        const namePart = getFullPerformanceName(performance)
          .replace(/[^a-zA-Z0-9-_]/g, '-')
          .replace(/-+/g, '-')
          .toLowerCase();
        filename = `${datePart}-${namePart}`;
      } else if (prediction.name && prediction.name !== 'New Prediction') {
        filename = prediction.name
          .replace(/[^a-zA-Z0-9-_]/g, '-')
          .replace(/-+/g, '-')
          .toLowerCase();
      }

      // Create download link
      const link = document.createElement('a');
      link.download = `${filename}.png`;
      link.href = dataUrl;
      link.click();

      toast({
        title: t('setlistPrediction.imageDownloaded', {
          defaultValue: 'Image downloaded'
        }),
        type: 'success'
      });
    } catch {
      toast({
        title: t('common.error', { defaultValue: 'Error' }),
        description: t('setlistPrediction.failedToExportImage', {
          defaultValue: 'Failed to export image'
        }),
        type: 'error'
      });
    } finally {
      setIsExportingImage(false);
    }
  };

  return (
    <Stack gap={2}>
      <Text fontSize="sm" fontWeight="medium">
        {t('setlistPrediction.exportShare', { defaultValue: 'Export & Share' })}
      </Text>

      {/* Author Name Input */}
      <Stack gap="1">
        <FormLabel htmlFor={authorId} fontSize="xs">
          {t('setlistPrediction.authorName', { defaultValue: 'Your Name (Optional)' })}
        </FormLabel>
        <Input
          id={authorId}
          value={authorName}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAuthorName(e.target.value)}
          placeholder={t('setlistPrediction.authorNamePlaceholder', {
            defaultValue: 'Enter your name...'
          })}
          size="sm"
        />
      </Stack>

      <ExportActions
        stacked
        copy={[
          {
            id: 'text',
            options: getCopyOptions(
              'text',
              [
                t('setlistPrediction.copyText', { defaultValue: 'Copy as Text' }),
                t('setlistPrediction.copyTextShort', {
                  defaultValue: 'Copy as Text (abbreviated)'
                })
              ],
              getTextPreview,
              handleCopyText
            )
          }
        ]}
        image={{
          busy: isExportingImage,
          busyLabel: t('setlistPrediction.exportingImage', { defaultValue: 'Exporting...' }),
          actions: [
            {
              id: 'export-image',
              label: t('setlistPrediction.exportImage', { defaultValue: 'Export Image' }),
              icon: <FaDownload />,
              onSelect: () => void handleExportImage()
            }
          ],
          nicknameLabel: t('setlistPrediction.abbreviateImage', {
            defaultValue: 'Abbreviate image'
          })
        }}
        share={{
          label: t('setlistPrediction.shareUrl', { defaultValue: 'Share URL' }),
          onClick: () => void handleShareUrl(),
          disabled: isSharing
        }}
        more={[
          {
            id: 'json',
            label: t('results.export_json', { defaultValue: 'Export JSON' }),
            icon: <FaCode />,
            onSelect: handleDownloadJSON
          },
          {
            id: 'csv',
            label: t('setlistPrediction.exportCsv', { defaultValue: 'Export CSV' }),
            icon: <FaFileCsv />,
            onSelect: handleDownloadCSV
          }
        ]}
      />

      {/* Hidden setlist view for image export */}
      <Box position="absolute" top="-9999px" left="-9999px">
        <Box ref={setlistExportRef} w="800px" p={8} bgColor="bg.default">
          <SetlistView
            prediction={prediction}
            performance={performance}
            authorName={authorName}
            showHeader={true}
            compact={false}
            abbreviate={useShortNames}
          />
        </Box>
      </Box>
    </Stack>
  );
}
