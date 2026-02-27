import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useHeardleState } from './useHeardleState';

describe('useHeardleState', () => {
  beforeEach(() => {
    // localStorage is cleared automatically by vitest-setup
  });

  describe('getAudioDuration', () => {
    it('should return 1 second for attempt 0', () => {
      const { result } = renderHook(() => useHeardleState());
      expect(result.current.getAudioDuration(0)).toBe(1);
    });

    it('should return 2 seconds for attempt 1', () => {
      const { result } = renderHook(() => useHeardleState());
      expect(result.current.getAudioDuration(1)).toBe(2);
    });

    it('should return 4 seconds for attempt 2', () => {
      const { result } = renderHook(() => useHeardleState());
      expect(result.current.getAudioDuration(2)).toBe(4);
    });

    it('should return 8 seconds for attempt 3', () => {
      const { result } = renderHook(() => useHeardleState());
      expect(result.current.getAudioDuration(3)).toBe(8);
    });

    it('should return 16 seconds for attempt 4', () => {
      const { result } = renderHook(() => useHeardleState());
      expect(result.current.getAudioDuration(4)).toBe(16);
    });

    it('should cap at 16 seconds for attempts beyond 4', () => {
      const { result } = renderHook(() => useHeardleState());
      expect(result.current.getAudioDuration(5)).toBe(16);
      expect(result.current.getAudioDuration(10)).toBe(16);
    });
  });

  describe('isSongRevealed', () => {
    it('should return false for unrevealed song', () => {
      const { result } = renderHook(() => useHeardleState());
      expect(result.current.isSongRevealed('song-1')).toBe(false);
    });

    it('should return true after song is correctly guessed', () => {
      const { result } = renderHook(() => useHeardleState());

      act(() => {
        result.current.makeGuess('song-1', 'song-1');
      });

      expect(result.current.isSongRevealed('song-1')).toBe(true);
    });

    it('should return true after song is auto-revealed', () => {
      const { result } = renderHook(() => useHeardleState());

      act(() => {
        result.current.autoReveal('song-1');
      });

      expect(result.current.isSongRevealed('song-1')).toBe(true);
    });
  });

  describe('makeGuess', () => {
    it('should return true for correct guess', () => {
      const { result } = renderHook(() => useHeardleState());

      let isCorrect: boolean = false;
      act(() => {
        isCorrect = result.current.makeGuess('song-1', 'song-1');
      });

      expect(isCorrect).toBe(true);
      expect(result.current.isSongRevealed('song-1')).toBe(true);
    });

    it('should return false for wrong guess', () => {
      const { result } = renderHook(() => useHeardleState());

      let isCorrect: boolean = true;
      act(() => {
        isCorrect = result.current.makeGuess('song-1', 'song-2');
      });

      expect(isCorrect).toBe(false);
      expect(result.current.isSongRevealed('song-1')).toBe(false);
    });

    it('should increment attempt count on wrong guess', () => {
      const { result } = renderHook(() => useHeardleState());

      expect(result.current.getAttemptCount('song-1')).toBe(0);

      act(() => {
        result.current.makeGuess('song-1', 'wrong-song');
      });

      expect(result.current.getAttemptCount('song-1')).toBe(1);
    });

    it('should add wrong guess to guess history', () => {
      const { result } = renderHook(() => useHeardleState());

      act(() => {
        result.current.makeGuess('song-1', 'wrong-song');
      });

      expect(result.current.getGuessHistory('song-1')).toEqual(['wrong']);
    });

    it('should mark song as failed after 5 wrong guesses', () => {
      const { result } = renderHook(() => useHeardleState());

      // Each guess needs to be in a separate act() block so state updates between them
      for (let i = 0; i < 5; i++) {
        act(() => {
          result.current.makeGuess('song-1', `wrong-song-${i}`);
        });
      }

      expect(result.current.failedSongIds.has('song-1')).toBe(true);
      expect(result.current.isSongRevealed('song-1')).toBe(false);
    });

    it('should return true if song already revealed', () => {
      const { result } = renderHook(() => useHeardleState());

      act(() => {
        result.current.makeGuess('song-1', 'song-1');
      });

      let isCorrect: boolean = false;
      act(() => {
        isCorrect = result.current.makeGuess('song-1', 'song-1');
      });

      expect(isCorrect).toBe(true);
    });
  });

  describe('passGuess', () => {
    it('should increment attempt count', () => {
      const { result } = renderHook(() => useHeardleState());

      expect(result.current.getAttemptCount('song-1')).toBe(0);

      act(() => {
        result.current.passGuess('song-1');
      });

      expect(result.current.getAttemptCount('song-1')).toBe(1);
    });

    it('should add pass to guess history', () => {
      const { result } = renderHook(() => useHeardleState());

      act(() => {
        result.current.passGuess('song-1');
      });

      expect(result.current.getGuessHistory('song-1')).toEqual(['pass']);
    });

    it('should mark song as failed after 5 passes', () => {
      const { result } = renderHook(() => useHeardleState());

      // Each pass needs to be in a separate act() block so state updates between them
      for (let i = 0; i < 5; i++) {
        act(() => {
          result.current.passGuess('song-1');
        });
      }

      expect(result.current.failedSongIds.has('song-1')).toBe(true);
    });

    it('should handle mixed passes and wrong guesses', () => {
      const { result } = renderHook(() => useHeardleState());

      // Each action needs to be in a separate act() block so state updates between them
      act(() => {
        result.current.passGuess('song-1'); // attempt 1
      });
      act(() => {
        result.current.makeGuess('song-1', 'wrong'); // attempt 2
      });
      act(() => {
        result.current.passGuess('song-1'); // attempt 3
      });
      act(() => {
        result.current.makeGuess('song-1', 'wrong'); // attempt 4
      });
      act(() => {
        result.current.passGuess('song-1'); // attempt 5 - should fail
      });

      expect(result.current.failedSongIds.has('song-1')).toBe(true);
      expect(result.current.getGuessHistory('song-1')).toEqual([]);
    });

    it('should not pass on already revealed song', () => {
      const { result } = renderHook(() => useHeardleState());

      act(() => {
        result.current.makeGuess('song-1', 'song-1');
      });

      act(() => {
        result.current.passGuess('song-1');
      });

      expect(result.current.getAttemptCount('song-1')).toBe(0);
    });
  });

  describe('autoReveal', () => {
    it('should reveal the song', () => {
      const { result } = renderHook(() => useHeardleState());

      act(() => {
        result.current.autoReveal('song-1');
      });

      expect(result.current.isSongRevealed('song-1')).toBe(true);
    });

    it('should not double-reveal an already revealed song', () => {
      const { result } = renderHook(() => useHeardleState());

      act(() => {
        result.current.autoReveal('song-1');
        result.current.autoReveal('song-1');
      });

      expect(result.current.isSongRevealed('song-1')).toBe(true);
      expect(result.current.revealedSongIds.size).toBe(1);
    });
  });

  describe('maxAttempts', () => {
    it('should be 5', () => {
      const { result } = renderHook(() => useHeardleState());
      expect(result.current.maxAttempts).toBe(5);
    });
  });

  describe('clearAllHeardleState', () => {
    it('should clear revealed songs', () => {
      const { result } = renderHook(() => useHeardleState());

      act(() => {
        result.current.makeGuess('song-1', 'song-1');
      });

      expect(result.current.isSongRevealed('song-1')).toBe(true);

      act(() => {
        result.current.clearAllHeardleState();
      });

      expect(result.current.isSongRevealed('song-1')).toBe(false);
      expect(result.current.revealedSongIds.size).toBe(0);
    });

    it('should clear failed songs', () => {
      const { result } = renderHook(() => useHeardleState());

      // Fail a song
      for (let i = 0; i < 5; i++) {
        act(() => {
          result.current.passGuess('song-1');
        });
      }

      expect(result.current.failedSongIds.has('song-1')).toBe(true);

      act(() => {
        result.current.clearAllHeardleState();
      });

      expect(result.current.failedSongIds.size).toBe(0);
    });

    it('should clear current guesses', () => {
      const { result } = renderHook(() => useHeardleState());

      act(() => {
        result.current.makeGuess('song-1', 'wrong');
      });

      expect(result.current.getAttemptCount('song-1')).toBe(1);

      act(() => {
        result.current.clearAllHeardleState();
      });

      expect(result.current.getAttemptCount('song-1')).toBe(0);
      expect(result.current.getGuessHistory('song-1')).toEqual([]);
    });
  });

  describe('localStorage persistence', () => {
    it('should persist revealed songs across re-renders', () => {
      const { result, rerender } = renderHook(() => useHeardleState());

      act(() => {
        result.current.makeGuess('song-1', 'song-1');
      });

      rerender();

      expect(result.current.isSongRevealed('song-1')).toBe(true);
    });

    it('should persist failed songs across re-renders', () => {
      const { result, rerender } = renderHook(() => useHeardleState());

      // Each pass needs separate act() block
      for (let i = 0; i < 5; i++) {
        act(() => {
          result.current.passGuess('song-1');
        });
      }

      rerender();

      expect(result.current.failedSongIds.has('song-1')).toBe(true);
    });
  });
});
