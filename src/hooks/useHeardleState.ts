import { useCallback, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';

// Audio duration progression: 1s, 2s, 4s, 8s, 16s
const AUDIO_DURATIONS = [1, 2, 4, 8, 16] as const;
const MAX_ATTEMPTS = 5;

interface GuessState {
  attempts: number; // 0-5 (includes passes)
  guessHistory: ('wrong' | 'pass')[];
}

export function useHeardleState() {
  // Revealed songs persist forever (never have to guess again)
  const [revealedSongs, setRevealedSongs] = useLocalStorage<string[]>('heardle-revealed-songs', []);

  // Failed songs and current guesses reset on new session
  const [failedSongs, setFailedSongs] = useLocalStorage<string[]>('heardle-failed-songs', []);
  const [currentGuesses, setCurrentGuesses] = useLocalStorage<Record<string, GuessState>>(
    'heardle-current-guesses',
    {}
  );

  // Reset session-scoped state (called when starting new sort session)
  const resetSession = useCallback(() => {
    setFailedSongs([]);
    setCurrentGuesses({});
  }, [setFailedSongs, setCurrentGuesses]);

  // Get audio duration for current attempt (0-indexed attempts -> 1s, 2s, 4s, 8s, 16s)
  const getAudioDuration = useCallback((attempts: number): number => {
    const index = Math.min(attempts, AUDIO_DURATIONS.length - 1);
    return AUDIO_DURATIONS[index];
  }, []);

  // Get current attempt count for a song (0 if not started)
  const getAttemptCount = useCallback(
    (songId: string): number => {
      return currentGuesses?.[songId]?.attempts ?? 0;
    },
    [currentGuesses]
  );

  // Get guess history for a song
  const getGuessHistory = useCallback(
    (songId: string): ('wrong' | 'pass')[] => {
      return currentGuesses?.[songId]?.guessHistory ?? [];
    },
    [currentGuesses]
  );

  // Check if song is already revealed (guessed correctly)
  const isSongRevealed = useCallback(
    (songId: string): boolean => {
      return revealedSongs?.includes(songId) ?? false;
    },
    [revealedSongs]
  );

  // Check if song has failed (used all attempts without correct guess)
  const isSongFailed = useCallback(
    (songId: string): boolean => {
      return failedSongs?.includes(songId) ?? false;
    },
    [failedSongs]
  );

  // Make a guess - returns true if correct
  const makeGuess = useCallback(
    (songId: string, guessedId: string): boolean => {
      // Already revealed - shouldn't happen but handle gracefully
      if (isSongRevealed(songId)) {
        return true;
      }

      // Correct guess!
      if (songId === guessedId) {
        setRevealedSongs((prev) => [...(prev ?? []), songId]);
        // Clean up current guesses for this song
        setCurrentGuesses((prev) => {
          const next = { ...prev };
          delete next[songId];
          return next;
        });
        return true;
      }

      // Wrong guess - check current attempts and handle accordingly
      const currentAttempts = currentGuesses?.[songId]?.attempts ?? 0;
      const newAttempts = currentAttempts + 1;

      // Check if this was the final attempt
      if (newAttempts >= MAX_ATTEMPTS) {
        // Add to failed songs
        setFailedSongs((prev) => [...(prev ?? []), songId]);
        // Clean up current guesses
        setCurrentGuesses((prev) => {
          const next = { ...prev };
          delete next[songId];
          return next;
        });
      } else {
        // Increment attempts
        setCurrentGuesses((prev) => {
          const current = prev?.[songId] ?? { attempts: 0, guessHistory: [] };
          return {
            ...prev,
            [songId]: {
              attempts: current.attempts + 1,
              guessHistory: [...current.guessHistory, 'wrong' as const]
            }
          };
        });
      }

      return false;
    },
    [isSongRevealed, setRevealedSongs, setCurrentGuesses, setFailedSongs, currentGuesses]
  );

  // Pass on a song (skip without guessing) - uses an attempt slot
  const passGuess = useCallback(
    (songId: string): void => {
      // Already revealed or failed - shouldn't happen
      if (isSongRevealed(songId) || isSongFailed(songId)) {
        return;
      }

      const currentAttempts = currentGuesses?.[songId]?.attempts ?? 0;
      const newAttempts = currentAttempts + 1;

      // Check if this pass will max out attempts
      if (newAttempts >= MAX_ATTEMPTS) {
        // Add to failed songs
        setFailedSongs((prev) => [...(prev ?? []), songId]);
        // Clean up current guesses
        setCurrentGuesses((prev) => {
          const next = { ...prev };
          delete next[songId];
          return next;
        });
      } else {
        // Increment attempts with pass
        setCurrentGuesses((prev) => {
          const current = prev?.[songId] ?? { attempts: 0, guessHistory: [] };
          return {
            ...prev,
            [songId]: {
              attempts: current.attempts + 1,
              guessHistory: [...current.guessHistory, 'pass' as const]
            }
          };
        });
      }
    },
    [isSongRevealed, isSongFailed, currentGuesses, setFailedSongs, setCurrentGuesses]
  );

  // Auto-reveal a song (for songs with no audio)
  const autoReveal = useCallback(
    (songId: string): void => {
      if (!isSongRevealed(songId)) {
        setRevealedSongs((prev) => [...(prev ?? []), songId]);
      }
    },
    [isSongRevealed, setRevealedSongs]
  );

  // Get all failed song IDs
  const failedSongIds = useMemo(() => new Set(failedSongs ?? []), [failedSongs]);

  // Get all revealed song IDs
  const revealedSongIds = useMemo(() => new Set(revealedSongs ?? []), [revealedSongs]);

  return {
    // State checks
    isSongRevealed,
    isSongFailed,
    getAttemptCount,
    getGuessHistory,
    getAudioDuration,

    // Actions
    makeGuess,
    passGuess,
    autoReveal,
    resetSession,

    // Raw data for filtering
    failedSongIds,
    revealedSongIds,

    // Constants
    maxAttempts: MAX_ATTEMPTS
  };
}
