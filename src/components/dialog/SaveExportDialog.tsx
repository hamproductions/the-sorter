import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FaChevronLeft,
  FaChevronRight,
  FaCopy,
  FaDownload,
  FaPause,
  FaPlay,
  FaXmark
} from 'react-icons/fa6';
import { Box, HStack, Stack, Wrap } from 'styled-system/jsx';
import { Button } from '~/components/ui/button';
import { Dialog } from '~/components/ui/dialog';
import { IconButton } from '~/components/ui/icon-button';
import { QrCode } from '~/components/ui/qr-code';
import { Text } from '~/components/ui/text';
import { useToaster } from '~/context/ToasterContext';
import type { SavedSortState } from '~/types/save-state';
import { encodeSaveCode, encodeSaveFile, encodeSaveQrChunks } from '~/utils/save-transfer';

const FRAME_INTERVAL_MS = 900;

export interface SaveExportDialogProps extends Dialog.RootProps {
  saves?: SavedSortState[];
}

export function SaveExportDialog({ saves, ...rest }: SaveExportDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToaster();
  const code = useMemo(() => (saves?.length ? encodeSaveCode(saves) : ''), [saves]);
  const chunks = useMemo(() => (saves?.length ? encodeSaveQrChunks(saves) : []), [saves]);
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const isMultiPart = chunks.length > 1;

  useEffect(() => {
    setIndex(0);
    setIsPlaying(true);
  }, [code]);

  useEffect(() => {
    if (!isPlaying || !isMultiPart) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % chunks.length), FRAME_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [isPlaying, isMultiPart, chunks.length]);

  const move = (delta: number) => {
    setIsPlaying(false);
    setIndex((i) => (i + delta + chunks.length) % chunks.length);
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      toast?.({ description: t('dialog.save_transfer.code_copied') });
    } catch {}
  };

  const downloadFile = async () => {
    if (!saves?.length) return;
    const saveAs = (await import('file-saver')).saveAs;
    const name = saves.length === 1 ? saves[0].name : t('dialog.save_transfer.all_sessions');
    saveAs(
      new File([encodeSaveFile(saves)], `${name.replace(/[\\/:*?"<>|]/g, '_')}.sorter.json`, {
        type: 'application/json'
      })
    );
  };

  return (
    <Dialog.Root {...rest}>
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content maxW="md" maxH="90vh" overflow="auto">
          <Stack gap="4" p="6">
            <Stack gap="1">
              <Dialog.Title>{t('dialog.save_transfer.export_title')}</Dialog.Title>
              <Dialog.Description>
                {saves?.length === 1
                  ? saves[0].name
                  : t('dialog.save_transfer.session_count', { count: saves?.length ?? 0 })}
              </Dialog.Description>
            </Stack>
            {chunks.length > 0 && (
              <Stack gap="2" alignItems="center">
                <Box borderRadius="md" w="full" maxW="80" p="3" color="black" bg="white">
                  <QrCode.Root
                    value={chunks[index]}
                    encoding={{ ecc: 'L' }}
                    aria-label={t('dialog.save_transfer.qr_label', {
                      part: index + 1,
                      total: chunks.length
                    })}
                  >
                    <QrCode.Frame w="full" h="auto">
                      <QrCode.Pattern />
                    </QrCode.Frame>
                  </QrCode.Root>
                </Box>
                {isMultiPart && (
                  <HStack gap="2">
                    <IconButton
                      aria-label={t('dialog.save_transfer.previous_part')}
                      variant="outline"
                      size="sm"
                      onClick={() => move(-1)}
                    >
                      <FaChevronLeft />
                    </IconButton>
                    <IconButton
                      aria-label={
                        isPlaying ? t('dialog.save_transfer.pause') : t('dialog.save_transfer.play')
                      }
                      variant="outline"
                      size="sm"
                      onClick={() => setIsPlaying((p) => !p)}
                    >
                      {isPlaying ? <FaPause /> : <FaPlay />}
                    </IconButton>
                    <IconButton
                      aria-label={t('dialog.save_transfer.next_part')}
                      variant="outline"
                      size="sm"
                      onClick={() => move(1)}
                    >
                      <FaChevronRight />
                    </IconButton>
                    <Text minW="14" fontSize="sm" fontVariantNumeric="tabular-nums">
                      {index + 1} / {chunks.length}
                    </Text>
                  </HStack>
                )}
                <Text color="fg.muted" fontSize="sm" textAlign="center">
                  {isMultiPart
                    ? t('dialog.save_transfer.scan_hint_multi', { count: chunks.length })
                    : t('dialog.save_transfer.scan_hint')}
                </Text>
              </Stack>
            )}
            <Text color="fg.muted" fontSize="xs">
              {t('dialog.save_transfer.history_note')}
            </Text>
            <Wrap gap="2" justifyContent="flex-end">
              <Button variant="outline" onClick={() => void copyCode()}>
                <FaCopy /> {t('dialog.save_transfer.copy_code')}
              </Button>
              <Button onClick={() => void downloadFile()}>
                <FaDownload /> {t('dialog.save_transfer.download_file')}
              </Button>
            </Wrap>
          </Stack>
          <Dialog.CloseTrigger asChild position="absolute" top="2" right="2">
            <IconButton aria-label={t('dialog.close')} variant="ghost" size="sm">
              <FaXmark />
            </IconButton>
          </Dialog.CloseTrigger>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}
