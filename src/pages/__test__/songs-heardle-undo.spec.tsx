import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { fireEvent, waitFor } from '@testing-library/react';
import { render } from '../../__test__/utils';
import { Page } from '../songs/+Page';

const makeSong = (id: string, name: string, hasAudio = true) => ({
  id,
  name,
  englishName: name,
  artists: [{ id: '1', variant: null }],
  seriesIds: [1],
  musicVideo: { videoId: `v-${id}`, videoOffset: 0 },
  wikiAudioUrl: hasAudio ? `https://example.com/${id}.ogg` : '',
  discographyIds: [1],
  phoneticName: name.toLowerCase(),
  releasedOn: '2024-01-01'
});

const testSongs = [
  makeSong('s1', 'Song A'),
  makeSong('s2', 'Song B'),
  makeSong('s3', 'Song C'),
  makeSong('s4', 'Song D')
];

vi.mock('~/hooks/useSongData', () => ({
  useSongData: () => testSongs
}));

vi.mock('~/hooks/useArtistsData', () => ({
  useArtistsData: () => [{ id: '1', name: 'Test Artist', characters: ['1'], seriesIds: [1] }]
}));

vi.mock('~/utils/preloading', () => ({
  getNextItems: () => []
}));

vi.mock('~/components/sorter/Heardle', () => ({
  Heardle: (props: any) => (
    <div data-testid={`heardle-${props.song?.id}`}>
      <button
        type="button"
        data-testid={`guess-correct-${props.song?.id}`}
        onClick={() => props.onGuess?.(props.song?.id)}
      >
        Guess Correct
      </button>
      <button
        type="button"
        data-testid={`pass-${props.song?.id}`}
        onClick={() => props.onPass?.()}
      >
        Pass
      </button>
    </div>
  ),
  preloadAudioBlob: vi.fn()
}));

vi.mock('~/components/sorter/SongCard', () => ({
  SongCard: (props: any) => (
    <div data-testid={`song-card-${props.song?.id}`}>
      <button type="button" data-testid={`click-${props.song?.id}`} onClick={props.onClick}>
        {props.song?.englishName ?? props.song?.name}
      </button>
      {props.heardleMode && !props.isRevealed && !props.isFailed && (
        <div>
          <button
            type="button"
            data-testid={`guess-correct-${props.song?.id}`}
            onClick={() => props.onGuess?.(props.song?.id)}
          >
            Guess Correct
          </button>
          <button
            type="button"
            data-testid={`pass-${props.song?.id}`}
            onClick={() => props.onPass?.()}
          >
            Pass
          </button>
        </div>
      )}
      {props.isRevealed && <span data-testid={`revealed-${props.song?.id}`}>Revealed</span>}
      {props.isFailed && <span data-testid={`failed-${props.song?.id}`}>Failed</span>}
    </div>
  )
}));

beforeAll(async () => {
  await import('../../components/sorter/SongFilters');
  await import('../../components/dialog/ConfirmDialog');
});

vi.setConfig({ testTimeout: 15000 });

describe('Songs Page - Heardle Undo Behavior', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('heardle-mode', 'true');
  });

  const startSort = async () => {
    const [container, user] = await render(<Page />);
    const { findByText, queryByText, getByText } = container;
    await user.click(await findByText('Start'));
    await waitFor(() => {
      expect(queryByText('Keyboard Shortcuts')).toBeInTheDocument();
    });
    return { container, user, getByText, queryByText, findByText };
  };

  const getCurrentSongIds = () => {
    const cards = document.querySelectorAll('[data-testid^="song-card-"]');
    return Array.from(cards).map((c) => c.getAttribute('data-testid')?.replace('song-card-', ''));
  };

  it('undo with empty history does nothing (no crash)', async () => {
    const { getByText } = await startSort();
    const songsBefore = getCurrentSongIds();

    fireEvent.click(getByText('Undo'));

    const songsAfter = getCurrentSongIds();
    expect(songsAfter).toEqual(songsBefore);
  });

  it('undo after sorting restores previous pair', async () => {
    const { getByText, container } = await startSort();
    const pairBefore = getCurrentSongIds();

    // Guess both songs correctly to reveal them
    const [leftId, rightId] = pairBefore;
    if (leftId) {
      const guessBtn = container.queryByTestId(`guess-correct-${leftId}`);
      if (guessBtn) fireEvent.click(guessBtn);
    }
    if (rightId) {
      const guessBtn = container.queryByTestId(`guess-correct-${rightId}`);
      if (guessBtn) fireEvent.click(guessBtn);
    }

    await waitFor(() => {
      const leftRevealed = container.queryByTestId(`revealed-${leftId}`);
      const rightRevealed = container.queryByTestId(`revealed-${rightId}`);
      expect(leftRevealed || rightRevealed).toBeTruthy();
    });

    // Click left song to sort
    const leftClick = container.queryByTestId(`click-${leftId}`);
    if (leftClick) fireEvent.click(leftClick);

    await waitFor(() => {
      const newPair = getCurrentSongIds();
      expect(newPair).not.toEqual(pairBefore);
    });

    // Undo
    fireEvent.click(getByText('Undo'));

    await waitFor(() => {
      const restoredPair = getCurrentSongIds();
      expect(restoredPair).toEqual(pairBefore);
    });
  });

  it('undo via ArrowUp key works in heardle mode when songs revealed', async () => {
    const { user, container } = await startSort();
    const pairBefore = getCurrentSongIds();

    const [leftId, rightId] = pairBefore;
    if (leftId) {
      const guessBtn = container.queryByTestId(`guess-correct-${leftId}`);
      if (guessBtn) fireEvent.click(guessBtn);
    }
    if (rightId) {
      const guessBtn = container.queryByTestId(`guess-correct-${rightId}`);
      if (guessBtn) fireEvent.click(guessBtn);
    }

    await waitFor(() => {
      expect(
        container.queryByTestId(`revealed-${leftId}`) ||
          container.queryByTestId(`revealed-${rightId}`)
      ).toBeTruthy();
    });

    const leftClick = container.queryByTestId(`click-${leftId}`);
    if (leftClick) fireEvent.click(leftClick);

    await waitFor(() => {
      expect(getCurrentSongIds()).not.toEqual(pairBefore);
    });

    document.body.focus();
    await user.keyboard('[ArrowUp]');

    await waitFor(() => {
      expect(getCurrentSongIds()).toEqual(pairBefore);
    });
  });
});
