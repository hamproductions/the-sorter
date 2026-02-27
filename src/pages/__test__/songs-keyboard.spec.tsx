import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { waitFor } from '@testing-library/react';
import { render } from '../../__test__/utils';
import { Page } from '../songs/+Page';

const makeSong = (id: string, name: string) => ({
  id,
  name,
  englishName: name,
  artists: [{ id: '1', variant: null }],
  seriesIds: [1],
  musicVideo: { videoId: `v-${id}`, videoOffset: 0 },
  wikiAudioUrl: '',
  discographyIds: [1],
  phoneticName: name.toLowerCase(),
  releasedOn: '2024-01-01'
});

vi.mock('~/hooks/useSongData', () => ({
  useSongData: () => [
    makeSong('s1', 'Song A'),
    makeSong('s2', 'Song B'),
    makeSong('s3', 'Song C'),
    makeSong('s4', 'Song D')
  ]
}));

vi.mock('~/hooks/useHeardleState', () => ({
  useHeardleState: () => ({
    isSongRevealed: () => false,
    isSongFailed: () => false,
    getAttemptCount: () => 0,
    getGuessHistory: () => [],
    getAudioDuration: () => 1,
    makeGuess: vi.fn(),
    passGuess: vi.fn(),
    autoReveal: vi.fn(),
    clearAllHeardleState: vi.fn(),
    failedSongIds: new Set<string>(),
    revealedSongIds: new Set<string>(),
    guessResults: {},
    maxAttempts: 5
  })
}));

vi.mock('~/utils/preloading', () => ({
  getNextItems: () => []
}));

vi.mock('~/components/sorter/SongCard', () => ({
  SongCard: (props: any) => (
    <button type="button" data-testid={`song-card-${props.song?.id}`} onClick={props.onClick}>
      {props.song?.englishName ?? props.song?.name}
    </button>
  )
}));

beforeAll(async () => {
  await import('../../components/sorter/SongFilters');
  await import('../../components/dialog/ConfirmDialog');
});

vi.setConfig({ testTimeout: 15000 });

describe('Songs Page - Keyboard Shortcuts (integration)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const startSort = async () => {
    const [container, user] = await render(<Page />);
    const { findByText, queryByText } = container;
    await user.click(await findByText('Start'));
    document.body.focus();
    await waitFor(() => {
      expect(queryByText('Keyboard Shortcuts')).toBeInTheDocument();
    });
    return [container, user] as const;
  };

  it('ArrowLeft advances sort', async () => {
    const [container, user] = await startSort();
    const textBefore = container.container.textContent;
    await user.keyboard('[ArrowLeft]');
    await waitFor(() => {
      const ended = container.queryByText('Sort Results');
      if (ended) return;
      expect(container.container.textContent).not.toBe(textBefore);
    });
  });

  it('ArrowRight advances sort', async () => {
    const [container, user] = await startSort();
    const textBefore = container.container.textContent;
    await user.keyboard('[ArrowRight]');
    await waitFor(() => {
      const ended = container.queryByText('Sort Results');
      if (ended) return;
      expect(container.container.textContent).not.toBe(textBefore);
    });
  });

  it('ArrowUp undoes (content reverts)', async () => {
    const [container, user] = await startSort();

    const getContent = () => container.container.textContent;
    const textBefore = getContent();

    await user.keyboard('[ArrowLeft]');
    await waitFor(() => {
      expect(container.queryByText('Sort Results')).not.toBeInTheDocument();
      expect(getContent()).not.toBe(textBefore);
    });

    await user.keyboard('[ArrowUp]');
    await waitFor(() => {
      expect(getContent()).toBe(textBefore);
    });
  });

  it('arrow keys ignored when INPUT is focused', async () => {
    const [container, user] = await startSort();
    const textBefore = container.container.textContent;

    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    await user.keyboard('[ArrowLeft]');
    expect(container.container.textContent).toBe(textBefore);

    document.body.removeChild(input);
  });
});
