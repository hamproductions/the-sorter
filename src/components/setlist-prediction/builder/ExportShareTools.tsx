/**
 * Export and Share Tools Component
 * Provides buttons for exporting and sharing predictions
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Stack } from 'styled-system/jsx';
import { Button } from '~/components/ui/styled/button';
import { Text } from '~/components/ui/styled/text';
import type { SetlistPrediction, Performance } from '~/types/setlist-prediction';
import {
  generateShareUrl,
  canShareUrl,
  estimateShareUrlSize
} from '~/utils/setlist-prediction/compression';
import {
  exportAsJSON,
  downloadJSON,
  downloadCSV,
  copyTextToClipboard
} from '~/utils/setlist-prediction/export';
import { useToaster } from '~/context/ToasterContext';

export interface ExportShareToolsProps {
  prediction: SetlistPrediction;
  performance?: Performance;
}

export function ExportShareTools({ prediction, performance }: ExportShareToolsProps) {
  const { t } = useTranslation();
  const { toast } = useToaster();
  const [isSharing, setIsSharing] = useState(false);

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
    } catch (error) {
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

  const handleCopyText = async () => {
    try {
      await copyTextToClipboard(prediction, performance);

      toast({
        title: t('toast.text_copied', { defaultValue: 'Text copied to clipboard' }),
        type: 'success'
      });
    } catch (error) {
      toast({
        title: t('common.error', { defaultValue: 'Error' }),
        description: t('setlistPrediction.failedToCopy', {
          defaultValue: 'Failed to copy text to clipboard'
        }),
        type: 'error'
      });
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
    } catch (error) {
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
    } catch (error) {
      toast({
        title: t('common.error', { defaultValue: 'Error' }),
        description: t('setlistPrediction.failedToDownload', {
          defaultValue: 'Failed to download CSV'
        }),
        type: 'error'
      });
    }
  };

  const handleExportImage = () => {
    toast({
      title: t('setlistPrediction.comingSoon', { defaultValue: 'Coming Soon!' }),
      description: t('setlistPrediction.imageExportHint', {
        defaultValue: 'Image export will be available soon'
      }),
      type: 'info'
    });
  };

  return (
    <Stack gap={2}>
      <Text fontSize="sm" fontWeight="medium">
        {t('setlistPrediction.exportShare', { defaultValue: 'Export & Share' })}
      </Text>

      {/* Share URL */}
      <Button size="sm" onClick={handleShareUrl} loading={isSharing}>
        {t('setlistPrediction.shareUrl', { defaultValue: 'Share URL' })}
      </Button>

      {/* Copy Text */}
      <Button size="sm" variant="outline" onClick={handleCopyText}>
        {t('setlistPrediction.copyText', { defaultValue: 'Copy as Text' })}
      </Button>

      {/* Export JSON */}
      <Button size="sm" variant="outline" onClick={handleDownloadJSON}>
        {t('results.export_json', { defaultValue: 'Export JSON' })}
      </Button>

      {/* Export CSV */}
      <Button size="sm" variant="outline" onClick={handleDownloadCSV}>
        {t('setlistPrediction.exportCsv', { defaultValue: 'Export CSV' })}
      </Button>

      {/* Export Image */}
      <Button size="sm" variant="outline" onClick={handleExportImage}>
        {t('setlistPrediction.exportImage', { defaultValue: 'Export Image' })}
      </Button>
    </Stack>
  );
}
