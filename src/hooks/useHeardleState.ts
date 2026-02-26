import { useCallback, useEffect, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';

// Audio duration progression: 1s, 2s, 4s, 8s, 16s
const AUDIO_DURATIONS = [1, 2, 4, 8, 16] as const;
const MAX_ATTEMPTS = 5;

interface GuessState {
  attempts: number; // 0-5 (includes passes)
  guessHistory: ('wrong' | 'pass')[];
}

export function useHeardleState() {
  // Whole heardle reset on new session
  // 1. Revealed songs (guessed correctly, i.e. you will have to re-heardle songs on new sessions)
  // 2. Failed songs (used all attempts without correct guess, i.e. you will have to re-heardle songs on new sessions)
  // 3. Current guesses (in-progress, i.e. you will have to re-heardle songs on new sessions)
  const [revealedSongs, setRevealedSongs] = useLocalStorage<string[]>('heardle-revealed-songs', []);
  const [failedSongs, setFailedSongs] = useLocalStorage<string[]>('heardle-failed-songs', []);
  const [currentGuesses, setCurrentGuesses] = useLocalStorage<Record<string, GuessState>>(
    'heardle-current-guesses',
    {}
  );

  // Clear all heardle state (called when stopping a session entirely)
  const clearAllHeardleState = useCallback(() => {
    setRevealedSongs([]);
    setFailedSongs([]);
    setCurrentGuesses({});
  }, [setRevealedSongs, setFailedSongs, setCurrentGuesses]);

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

      // Wrong guess — increment attempts inside functional updater to avoid
      // stale-closure issues with rapid interactions.
      // Failure detection (attempts >= MAX_ATTEMPTS) is handled by a useEffect.
      setCurrentGuesses((prev) => {
        const current = prev?.[songId] ?? { attempts: 0, guessHistory: [] };
        if (current.attempts >= MAX_ATTEMPTS) {
          return prev;
        }
        return {
          ...prev,
          [songId]: {
            attempts: current.attempts + 1,
            guessHistory: [...current.guessHistory, 'wrong' as const]
          }
        };
      });

      return false;
    },
    [isSongRevealed, setRevealedSongs, setCurrentGuesses]
  );

  // Pass on a song (skip without guessing) - uses an attempt slot
  const passGuess = useCallback(
    (songId: string): void => {
      // Best-effort guards using closure values; main protection is inside the updater
      if (isSongRevealed(songId) || isSongFailed(songId)) {
        return;
      }

      // All logic inside the functional updater so rapid clicks always see
      // the true current state via `prev`, avoiding stale-closure issues.
      // Failure detection (attempts >= MAX_ATTEMPTS) is handled by a useEffect.
      setCurrentGuesses((prev) => {
        const current = prev?.[songId] ?? { attempts: 0, guessHistory: [] };
        if (current.attempts >= MAX_ATTEMPTS) {
          return prev; // Already at max, don't increment further
        }
        return {
          ...prev,
          [songId]: {
            attempts: current.attempts + 1,
            guessHistory: [...current.guessHistory, 'pass' as const]
          }
        };
      });
    },
    [isSongRevealed, isSongFailed, setCurrentGuesses]
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

  // Reactively detect songs that have reached MAX_ATTEMPTS and move them to failed.
  // This decouples failure detection from passGuess/makeGuess so that rapid calls
  // (which use stale closures for branching) still result in correct failure handling.
  useEffect(() => {
    if (!currentGuesses) return;
    const failedEntries = Object.entries(currentGuesses).filter(
      ([, state]) => state.attempts >= MAX_ATTEMPTS
    );
    if (failedEntries.length === 0) return;

    for (const [songId] of failedEntries) {
      setFailedSongs((prev) => {
        if (prev?.includes(songId)) return prev;
        return [...(prev ?? []), songId];
      });
    }
    setCurrentGuesses((prev) => {
      const next = { ...prev };
      for (const [songId] of failedEntries) {
        delete next[songId];
      }
      return next;
    });
  }, [currentGuesses, setFailedSongs, setCurrentGuesses]);

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
    clearAllHeardleState,

    // Raw data for filtering
    failedSongIds,
    revealedSongIds,

    // Constants
    maxAttempts: MAX_ATTEMPTS
  };
}
