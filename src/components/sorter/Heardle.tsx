import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaXmark, FaForwardStep } from 'react-icons/fa6';
import { Box, HStack, Stack } from 'styled-system/jsx';
import { token } from 'styled-system/tokens';
import type { Song } from '~/types/songs';
import { detectSoundStartFromBlob } from '~/utils/intro-don/detectSoundStart';
import { Text } from '../ui/text';
import { Button } from '../ui/button';
import { HeardleAudioPlayer } from './HeardleAudioPlayer';
import { HeardleSongCombobox, type HeardleSongComboboxHandle } from './HeardleSongCombobox';

interface CacheEntry {
  blobUrl: string;
  soundStart: number;
}

const MAX_CACHE_SIZE = 10;
const audioBlobCache = new Map<string, CacheEntry>();
const pendingFetches = new Map<string, Promise<CacheEntry | null>>();

function evictOldest() {
  while (audioBlobCache.size > MAX_CACHE_SIZE) {
    const oldest = audioBlobCache.keys().next().value;
    if (!oldest) break;
    const entry = audioBlobCache.get(oldest);
    if (entry) URL.revokeObjectURL(entry.blobUrl);
    audioBlobCache.delete(oldest);
  }
}

async function fetchAudioBlob(url: string): Promise<CacheEntry | null> {
  try {
    const res = await fetch(url, { referrerPolicy: 'no-referrer' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    const audioBlob = new Blob([blob], { type: 'audio/ogg' });
    let offset = 0;
    try {
      const detected = await detectSoundStartFromBlob(audioBlob);
      if (detected !== null) offset = detected;
    } catch {}
    const blobUrl = URL.createObjectURL(audioBlob);
    const entry: CacheEntry = { blobUrl, soundStart: offset };
    audioBlobCache.set(url, entry);
    evictOldest();
    return entry;
  } catch (err) {
    console.error('Failed to fetch audio:', err);
    return null;
  } finally {
    pendingFetches.delete(url);
  }
}

export function preloadAudioBlob(url: string): void {
  if (audioBlobCache.has(url) || pendingFetches.has(url)) return;
  const promise = fetchAudioBlob(url);
  pendingFetches.set(url, promise);
}

export function clearAudioCache(): void {
  for (const entry of audioBlobCache.values()) {
    URL.revokeObjectURL(entry.blobUrl);
  }
  audioBlobCache.clear();
  pendingFetches.clear();
}

function useAudioBlobUrl(url: string | undefined): {
  blobUrl: string | null;
  loading: boolean;
  error: boolean;
  soundStart: number;
} {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [soundStart, setSoundStart] = useState(0);

  useEffect(() => {
    if (!url) {
      setBlobUrl(null);
      setLoading(false);
      setError(false);
      setSoundStart(0);
      return;
    }

    const cached = audioBlobCache.get(url);
    if (cached) {
      setBlobUrl(cached.blobUrl);
      setSoundStart(cached.soundStart);
      setLoading(false);
      setError(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(false);

    const existing = pendingFetches.get(url);
    const promise = existing ?? fetchAudioBlob(url);
    if (!existing) pendingFetches.set(url, promise);

    void promise.then((entry) => {
      if (cancelled) return undefined;
      if (entry) {
        setBlobUrl(entry.blobUrl);
        setSoundStart(entry.soundStart);
        setLoading(false);
      } else {
        setBlobUrl(null);
        setLoading(false);
        setError(true);
      }
      return undefined;
    });

    return () => {
      cancelled = true;
    };
  }, [url]);

  return { blobUrl, loading, error, soundStart };
}

function HeardleGuessIndicator({
  attempts,
  maxAttempts,
  guessHistory
}: {
  attempts: number;
  maxAttempts: number;
  guessHistory: ('wrong' | 'pass')[];
}) {
  const { t } = useTranslation();
  return (
    <HStack gap={2} justifyContent="center" alignItems="center">
      <Text color="fg.muted" fontSize="xs" fontWeight="medium">
        {t('heardle.guesses_label')}
      </Text>
      <HStack gap={1}>
        {Array.from({ length: maxAttempts }).map((_, i) => {
          const historyItem = guessHistory[i];
          const isCurrent = i === attempts && !historyItem;

          const borderColor = isCurrent ? token('colors.fg.default') : token('colors.fg.muted');

          return (
            <Box
              key={i}
              style={{
                border: `2px solid ${borderColor}`,
                backgroundColor:
                  historyItem === 'wrong'
                    ? token('colors.red.9')
                    : historyItem === 'pass'
                      ? '#d97706'
                      : 'transparent'
              }}
              display="flex"
              justifyContent="center"
              alignItems="center"
              borderRadius="md"
              w="24px"
              h="24px"
            >
              {historyItem === 'wrong' && <FaXmark size={14} color="red" />}
              {historyItem === 'pass' && <FaForwardStep size={12} color="white" />}
            </Box>
          );
        })}
      </HStack>
    </HStack>
  );
}

export interface HeardleProps {
  song: Song;
  songInventory: Song[];
  attempts: number;
  maxAttempts: number;
  guessHistory: ('wrong' | 'pass')[];
  audioDuration: number;
  onGuess: (guessedSongId: string) => void;
  onPass: () => void;
  onNoAudio: () => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

export function Heardle({
  song,
  songInventory,
  attempts,
  maxAttempts,
  guessHistory,
  audioDuration,
  onGuess,
  onPass,
  onNoAudio,
  inputRef
}: HeardleProps) {
  const { t } = useTranslation();

  const { blobUrl, loading, error, soundStart } = useAudioBlobUrl(song.wikiAudioUrl);
  const [selectedSong, setSelectedSong] = useState<{ id: string; name: string } | null>(null);
  const [showWrongFeedback, setShowWrongFeedback] = useState(false);
  const submitRef = useRef<HTMLButtonElement | null>(null);
  const comboboxRef = useRef<HeardleSongComboboxHandle | null>(null);

  useEffect(() => {
    if (!song.wikiAudioUrl || error) {
      onNoAudio();
    }
  }, [song.wikiAudioUrl, error, onNoAudio]);

  useEffect(() => {
    setShowWrongFeedback(false);
    setSelectedSong(null);
  }, [song.id]);

  const focusInput = useCallback(() => {
    requestAnimationFrame(() => inputRef?.current?.focus());
  }, [inputRef]);

  const handleSelect = useCallback((songId: string, songName: string) => {
    setSelectedSong({ id: songId, name: songName });
    setShowWrongFeedback(false);
  }, []);

  useEffect(() => {
    if (!selectedSong) return;
    let cancelled = false;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!cancelled) submitRef.current?.focus();
      });
    });
    return () => {
      cancelled = true;
    };
  }, [selectedSong]);

  const clearSelection = useCallback(() => {
    setSelectedSong(null);
    focusInput();
  }, [focusInput]);

  const handleSubmitGuess = useCallback(() => {
    if (!selectedSong) return;
    const isWrong = selectedSong.id !== song.id;
    onGuess(selectedSong.id);
    setSelectedSong(null);
    comboboxRef.current?.clearInput();
    if (isWrong) {
      setShowWrongFeedback(true);
      focusInput();
    }
  }, [selectedSong, song.id, onGuess, focusInput]);

  const handlePass = useCallback(() => {
    onPass();
    setSelectedSong(null);
    setShowWrongFeedback(false);
    comboboxRef.current?.clearInput();
    focusInput();
  }, [onPass, focusInput]);

  if (loading) {
    return (
      <Stack gap={2} alignItems="center" p={4}>
        <Text color="fg.muted">{t('heardle.loading_audio')}</Text>
      </Stack>
    );
  }

  if (!song.wikiAudioUrl || error) {
    return (
      <Stack gap={2} alignItems="center" p={4}>
        <Text color="fg.muted">{t('heardle.no_audio')}</Text>
      </Stack>
    );
  }

  return (
    <Stack gap={3} alignItems="center" w="full" maxW="md" p={2}>
      <HeardleGuessIndicator
        attempts={attempts}
        maxAttempts={maxAttempts}
        guessHistory={guessHistory}
      />

      <Box w="full">
        <HeardleAudioPlayer blobUrl={blobUrl} maxDuration={audioDuration} startTime={soundStart} />
      </Box>

      <Box w="full">
        <HeardleSongCombobox
          songInventory={songInventory}
          onSelect={handleSelect}
          inputRef={inputRef}
          comboboxRef={comboboxRef}
        />
      </Box>

      {selectedSong && (
        <HStack justifyContent="space-between" w="full" px={1}>
          <Text fontSize="sm">
            {t('heardle.selected')} {selectedSong.name}
          </Text>
          <Button
            size="xs"
            variant="ghost"
            onClick={clearSelection}
            aria-label={t('heardle.clear_selection')}
          >
            <FaXmark />
          </Button>
        </HStack>
      )}

      <HStack gap={2} w="full">
        <Button ref={submitRef} disabled={!selectedSong} onClick={handleSubmitGuess} flex={1}>
          {t('heardle.submit_guess')}
        </Button>
        <Button variant="outline" onClick={handlePass} flex={1}>
          {t('heardle.pass')}
        </Button>
      </HStack>

      {showWrongFeedback && (
        <Text color="red.500" fontSize="sm" textAlign="center">
          {t('heardle.wrong_guess')}
        </Text>
      )}
    </Stack>
  );
}
