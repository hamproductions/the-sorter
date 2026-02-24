import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaXmark, FaForwardStep } from 'react-icons/fa6';
import { Box, HStack, Stack } from 'styled-system/jsx';
import { token } from 'styled-system/tokens';
import type { Song } from '~/types/songs';
import { detectSoundStartFromBlob } from '~/utils/intro-don/detectSoundStart';
import { Button } from '../ui/button';
import { Text } from '../ui/text';
import { HeardleAudioPlayer } from './HeardleAudioPlayer';
import { SongSearchPanel } from '../setlist-prediction/builder/SongSearchPanel';

// Hook to fetch audio and create blob URL
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

    let cancelled = false;
    let objectUrl: string | null = null;
    setLoading(true);
    setError(false);

    fetch(url, { referrerPolicy: 'no-referrer' })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.blob();
      })
      .then(async (blob) => {
        if (cancelled) return undefined;
        // Re-create blob with explicit audio MIME type — Wikia CDN returns
        // "application/ogg" which browsers may not recognise as playable audio.
        const audioBlob = new Blob([blob], { type: 'audio/ogg' });

        // Detect the first audible sound to skip leading silence
        let offset = 0;
        try {
          const detected = await detectSoundStartFromBlob(audioBlob);
          if (detected !== null) {
            offset = detected;
          }
        } catch {
          // Detection failed — fall back to 0
        }

        if (cancelled) return undefined;

        objectUrl = URL.createObjectURL(audioBlob);
        setBlobUrl(objectUrl);
        setSoundStart(offset);
        setLoading(false);
        return undefined;
      })
      .catch((err) => {
        console.error('Failed to fetch audio:', err);
        if (!cancelled) {
          setBlobUrl(null);
          setLoading(false);
          setError(true);
        }
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url]);

  return { blobUrl, loading, error, soundStart };
}

// Guess indicator component (like Wordle boxes)
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
        {t('heardle.guesses_label', { defaultValue: 'Guesses:' })}
      </Text>
      <HStack gap={1}>
        {Array.from({ length: maxAttempts }).map((_, i) => {
          const historyItem = guessHistory[i];
          const isCurrent = i === attempts && !historyItem;

          const borderColor = isCurrent
            ? token('colors.accent.default')
            : historyItem
              ? token('colors.fg.muted')
              : token('colors.fg.muted');

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
  /** Song inventory for search (typically listToSort) */
  songInventory: Song[];
  /** Current number of attempts (0-4, 5 means failed) */
  attempts: number;
  /** Maximum attempts allowed */
  maxAttempts: number;
  /** History of previous guesses */
  guessHistory: ('wrong' | 'pass')[];
  /** Audio duration for current attempt in seconds */
  audioDuration: number;
  /** Called when user makes a guess */
  onGuess: (guessedSongId: string) => void;
  /** Called when user passes */
  onPass: () => void;
  /** Called when song has no audio and needs auto-reveal */
  onNoAudio: () => void;
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
  onNoAudio
}: HeardleProps) {
  const { t } = useTranslation();

  const { blobUrl, loading, error, soundStart } = useAudioBlobUrl(song.wikiAudioUrl);
  const [selectedSong, setSelectedSong] = useState<{ id: string; name: string } | null>(null);
  const [showWrongFeedback, setShowWrongFeedback] = useState(false);

  // Auto-reveal songs without audio
  useEffect(() => {
    if (!song.wikiAudioUrl || error) {
      onNoAudio();
    }
  }, [song.wikiAudioUrl, error, onNoAudio]);

  // Reset selection when song changes
  useEffect(() => {
    setSelectedSong(null);
    setShowWrongFeedback(false);
  }, [song.id]);

  // Handle song selection from search
  const handleSongSelect = useCallback((songId: string, songTitle: string) => {
    setSelectedSong({ id: songId, name: songTitle });
    setShowWrongFeedback(false);
  }, []);

  // Handle guess submission
  const handleSubmitGuess = useCallback(() => {
    if (!selectedSong) return;

    // Check if correct
    if (selectedSong.id === song.id) {
      onGuess(selectedSong.id);
    } else {
      // Wrong guess - show feedback and trigger callback
      setShowWrongFeedback(true);
      onGuess(selectedSong.id);
      setSelectedSong(null);
    }
  }, [selectedSong, song.id, onGuess]);

  // Loading state
  if (loading) {
    return (
      <Stack gap={2} alignItems="center" p={4}>
        <Text color="fg.muted">
          {t('heardle.loading_audio', { defaultValue: 'Loading audio...' })}
        </Text>
      </Stack>
    );
  }

  // No audio available - should trigger auto-reveal
  if (!song.wikiAudioUrl || error) {
    return (
      <Stack gap={2} alignItems="center" p={4}>
        <Text color="fg.muted">
          {t('heardle.no_audio', { defaultValue: 'No audio available - Song revealed!' })}
        </Text>
      </Stack>
    );
  }

  return (
    <Stack gap={3} w="full" p={2}>
      {/* Attempt indicator */}
      <HeardleGuessIndicator
        attempts={attempts}
        maxAttempts={maxAttempts}
        guessHistory={guessHistory}
      />

      {/* Audio player with duration limit */}
      <HeardleAudioPlayer blobUrl={blobUrl} maxDuration={audioDuration} startTime={soundStart} />

      {/* Song search */}
      <Box maxH="360px" overflow="auto">
        <SongSearchPanel
          onAddSong={handleSongSelect}
          onAddCustomSong={undefined}
          hideTitle
          songInventory={songInventory}
          singleClickSelect
          maxH="340px"
        />
      </Box>

      {/* Selected song display */}
      {selectedSong && (
        <HStack
          justifyContent="space-between"
          alignItems="center"
          borderRadius="md"
          p={2}
          bg="bg.subtle"
        >
          <Text fontSize="sm" fontWeight="medium">
            {t('heardle.selected', { defaultValue: 'Selected:' })} {selectedSong.name}
          </Text>
          <Button
            size="xs"
            variant="ghost"
            onClick={() => setSelectedSong(null)}
            aria-label="Clear selection"
          >
            <FaXmark />
          </Button>
        </HStack>
      )}

      {/* Action buttons */}
      <HStack gap={2}>
        <Button variant="solid" onClick={handleSubmitGuess} disabled={!selectedSong} flex={1}>
          {t('heardle.submit_guess', { defaultValue: 'Submit Guess' })}
        </Button>
        <Button variant="outline" onClick={onPass} flex={1}>
          {t('heardle.pass', { defaultValue: 'Pass (Skip)' })}
        </Button>
      </HStack>

      {/* Wrong guess feedback */}
      {showWrongFeedback && (
        <Text color="red.500" fontSize="sm" textAlign="center">
          {t('heardle.wrong_guess', { defaultValue: 'Wrong! Try again.' })}
        </Text>
      )}
    </Stack>
  );
}
