import { useCallback, useEffect, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';

const AUDIO_DURATIONS = [1, 2, 4, 8, 16] as const;
const MAX_ATTEMPTS = 5;

interface GuessState {
  attempts: number;
  guessHistory: ('wrong' | 'pass')[];
}

export interface GuessResult {
  attempts: number;
  result: 'correct' | 'failed' | 'no-audio';
  guessHistory: ('wrong' | 'pass')[];
}

export function useHeardleState() {
  const [revealedSongs, setRevealedSongs] = useLocalStorage<string[]>('heardle-revealed-songs', []);
  const [failedSongs, setFailedSongs] = useLocalStorage<string[]>('heardle-failed-songs', []);
  const [currentGuesses, setCurrentGuesses] = useLocalStorage<Record<string, GuessState>>(
    'heardle-current-guesses',
    {}
  );
  const [guessResults, setGuessResults] = useLocalStorage<Record<string, GuessResult>>(
    'heardle-guess-results',
    {}
  );

  const clearAllHeardleState = useCallback(() => {
    setRevealedSongs([]);
    setFailedSongs([]);
    setCurrentGuesses({});
    setGuessResults({});
  }, [setRevealedSongs, setFailedSongs, setCurrentGuesses, setGuessResults]);

  const getAudioDuration = useCallback((attempts: number): number => {
    const index = Math.min(attempts, AUDIO_DURATIONS.length - 1);
    return AUDIO_DURATIONS[index];
  }, []);

  const getAttemptCount = useCallback(
    (songId: string): number => {
      return currentGuesses?.[songId]?.attempts ?? 0;
    },
    [currentGuesses]
  );

  const getGuessHistory = useCallback(
    (songId: string): ('wrong' | 'pass')[] => {
      return currentGuesses?.[songId]?.guessHistory ?? [];
    },
    [currentGuesses]
  );

  const isSongRevealed = useCallback(
    (songId: string): boolean => {
      return revealedSongs?.includes(songId) ?? false;
    },
    [revealedSongs]
  );

  const isSongFailed = useCallback(
    (songId: string): boolean => {
      return failedSongs?.includes(songId) ?? false;
    },
    [failedSongs]
  );

  const makeGuess = useCallback(
    (songId: string, guessedId: string): boolean => {
      if (isSongRevealed(songId)) {
        return true;
      }

      if (songId === guessedId) {
        const current = currentGuesses?.[songId];
        const attempts = (current?.attempts ?? 0) + 1;
        const history = current?.guessHistory ?? [];
        setGuessResults((prev) => ({
          ...prev,
          [songId]: { attempts, result: 'correct', guessHistory: history }
        }));
        setRevealedSongs((prev) => [...(prev ?? []), songId]);
        setCurrentGuesses((prev) => {
          const next = { ...prev };
          delete next[songId];
          return next;
        });
        return true;
      }

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
    [isSongRevealed, currentGuesses, setRevealedSongs, setCurrentGuesses, setGuessResults]
  );

  const passGuess = useCallback(
    (songId: string): void => {
      if (isSongRevealed(songId) || isSongFailed(songId)) {
        return;
      }

      setCurrentGuesses((prev) => {
        const current = prev?.[songId] ?? { attempts: 0, guessHistory: [] };
        if (current.attempts >= MAX_ATTEMPTS) {
          return prev;
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

  const autoReveal = useCallback(
    (songId: string): void => {
      if (!isSongRevealed(songId)) {
        setGuessResults((prev) => ({
          ...prev,
          [songId]: { attempts: 0, result: 'no-audio', guessHistory: [] }
        }));
        setRevealedSongs((prev) => [...(prev ?? []), songId]);
      }
    },
    [isSongRevealed, setRevealedSongs, setGuessResults]
  );

  useEffect(() => {
    if (!currentGuesses) return;
    const failedEntries = Object.entries(currentGuesses).filter(
      ([, state]) => state.attempts >= MAX_ATTEMPTS
    );
    if (failedEntries.length === 0) return;

    for (const [songId, state] of failedEntries) {
      setGuessResults((prev) => ({
        ...prev,
        [songId]: {
          attempts: MAX_ATTEMPTS,
          result: 'failed',
          guessHistory: state.guessHistory
        }
      }));
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
  }, [currentGuesses, setFailedSongs, setCurrentGuesses, setGuessResults]);

  const failedSongIds = useMemo(() => new Set(failedSongs ?? []), [failedSongs]);
  const revealedSongIds = useMemo(() => new Set(revealedSongs ?? []), [revealedSongs]);

  return {
    isSongRevealed,
    isSongFailed,
    getAttemptCount,
    getGuessHistory,
    getAudioDuration,

    makeGuess,
    passGuess,
    autoReveal,
    clearAllHeardleState,

    failedSongIds,
    revealedSongIds,
    guessResults: guessResults ?? {},

    maxAttempts: MAX_ATTEMPTS
  };
}
