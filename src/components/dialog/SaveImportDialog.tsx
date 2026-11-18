import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { FaCamera, FaFileImport, FaImage, FaStop, FaXmark } from 'react-icons/fa6';
import { Box, Stack, Wrap } from 'styled-system/jsx';
import { Button } from '~/components/ui/button';
import { Dialog } from '~/components/ui/dialog';
import { IconButton } from '~/components/ui/icon-button';
import { Text } from '~/components/ui/text';
import { Textarea } from '~/components/ui/textarea';
import type { SavedSortState, SorterType } from '~/types/save-state';
import { autoSaveName } from '~/utils/save-state';
import { decodeQr, decodeQrFromFile } from '~/utils/qr-scan';
import {
  createQrChunkCollector,
  parseSaveImport,
  type QrScanProgress
} from '~/utils/save-transfer';

const SCAN_INTERVAL_MS = 150;

type ImportStatus =
  | { kind: 'idle' }
  | { kind: 'scanning'; received?: number; total?: number }
  | { kind: 'error'; message: string }
  | { kind: 'imported'; count: number };

export interface SaveImportDialogProps extends Dialog.RootProps {
  onImport: (saves: SavedSortState[]) => SavedSortState[];
}

export function SaveImportDialog({ onImport, ...rest }: SaveImportDialogProps) {
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const [status, setStatus] = useState<ImportStatus>({ kind: 'idle' });
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const collectorRef = useRef(createQrChunkCollector());

  const nameFor = (sorterType: SorterType, itemCount: number) =>
    `${t('dialog.save_transfer.imported_prefix')} · ${autoSaveName(t, sorterType, itemCount)}`;

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsCameraActive(false);
  };

  useEffect(() => stopCamera, []);

  const finish = (saves: SavedSortState[] | null) => {
    if (!saves) {
      setStatus({ kind: 'error', message: t('dialog.save_transfer.invalid') });
      return;
    }
    const added = onImport(saves);
    setStatus(
      added.length > 0
        ? { kind: 'imported', count: added.length }
        : { kind: 'error', message: t('dialog.save_transfer.already_imported') }
    );
    setText('');
  };

  const handleQrText = (value: string | null): QrScanProgress => {
    if (!value) return { status: 'invalid' };
    const progress = collectorRef.current(value);
    if (progress.status === 'done') finish(progress.saves);
    else if (progress.status === 'progress')
      setStatus({ kind: 'scanning', received: progress.received, total: progress.total });
    return progress;
  };

  const startCamera = async () => {
    collectorRef.current = createQrChunkCollector();
    setStatus({ kind: 'scanning' });
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false
      });
      streamRef.current = stream;
      setIsCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch {
      stopCamera();
      setStatus({ kind: 'error', message: t('dialog.save_transfer.camera_error') });
    }
  };

  useEffect(() => {
    if (!isCameraActive) return;
    const canvas = document.createElement('canvas');
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const tick = async () => {
      const video = videoRef.current;
      if (video && video.readyState >= video.HAVE_CURRENT_DATA && video.videoWidth > 0) {
        const value = await decodeQr(video, video.videoWidth, video.videoHeight, canvas);
        if (cancelled) return;
        if (value && handleQrText(value).status === 'done') {
          stopCamera();
          return;
        }
      }
      if (!cancelled) timer = setTimeout(() => void tick(), SCAN_INTERVAL_MS);
    };
    void tick();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // oxlint-disable-next-line exhaustive-deps
  }, [isCameraActive]);

  const handleStopCamera = () => {
    stopCamera();
    setStatus({ kind: 'idle' });
  };

  const readImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = [...(event.target.files ?? [])];
    event.target.value = '';
    if (files.length === 0) return;
    stopCamera();
    collectorRef.current = createQrChunkCollector();
    let last: QrScanProgress = { status: 'invalid' };
    for (const file of files) {
      try {
        last = handleQrText(await decodeQrFromFile(file));
      } catch {
        last = { status: 'invalid' };
      }
      if (last.status === 'done') return;
    }
    if (last.status !== 'progress') {
      setStatus({ kind: 'error', message: t('dialog.save_transfer.no_qr_found') });
    }
  };

  const readFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    stopCamera();
    finish(parseSaveImport(await file.text(), nameFor));
  };

  return (
    <Dialog.Root
      {...rest}
      onOpenChange={(e) => {
        if (!e.open) {
          stopCamera();
          setStatus({ kind: 'idle' });
          setText('');
        }
        rest.onOpenChange?.(e);
      }}
    >
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content maxW="md" maxH="90vh" overflow="auto">
          <Stack gap="4" p="6">
            <Stack gap="1">
              <Dialog.Title>{t('dialog.save_transfer.import_title')}</Dialog.Title>
              <Dialog.Description>
                {t('dialog.save_transfer.import_description')}
              </Dialog.Description>
            </Stack>
            <Box
              hidden={!isCameraActive}
              aspectRatio="1"
              borderRadius="md"
              w="full"
              bg="black"
              overflow="hidden"
            >
              <video
                ref={videoRef}
                muted
                playsInline
                aria-label={t('dialog.save_transfer.camera_preview')}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </Box>
            <Wrap gap="2">
              {isCameraActive ? (
                <Button variant="outline" onClick={handleStopCamera}>
                  <FaStop /> {t('dialog.save_transfer.stop_camera')}
                </Button>
              ) : (
                <Button onClick={() => void startCamera()}>
                  <FaCamera /> {t('dialog.save_transfer.scan_camera')}
                </Button>
              )}
              <Button variant="outline" onClick={() => imageInputRef.current?.click()}>
                <FaImage /> {t('dialog.save_transfer.scan_image')}
              </Button>
              <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                <FaFileImport /> {t('dialog.save_transfer.open_file')}
              </Button>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={(e) => void readImage(e)}
              />
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json,text/plain"
                hidden
                onChange={(e) => void readFile(e)}
              />
            </Wrap>
            <Stack gap="2">
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={t('dialog.save_transfer.paste_placeholder')}
                aria-label={t('dialog.save_transfer.paste_placeholder')}
                rows={3}
              />
              <Button
                disabled={!text.trim()}
                onClick={() => finish(parseSaveImport(text, nameFor))}
                alignSelf="flex-end"
              >
                {t('dialog.save_transfer.import')}
              </Button>
            </Stack>
            <Box aria-live="polite">
              {status.kind === 'scanning' && (
                <Text fontSize="sm">
                  {status.total
                    ? t('dialog.save_transfer.scan_progress', {
                        received: status.received,
                        total: status.total
                      })
                    : t('dialog.save_transfer.scanning')}
                </Text>
              )}
              {status.kind === 'error' && (
                <Text color="red" fontSize="sm">
                  {status.message}
                </Text>
              )}
              {status.kind === 'imported' && (
                <Text fontSize="sm" fontWeight="medium">
                  {t('dialog.save_transfer.imported', { count: status.count })}
                </Text>
              )}
            </Box>
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
