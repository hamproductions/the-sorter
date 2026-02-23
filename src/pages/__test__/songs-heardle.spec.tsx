import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { fireEvent, waitFor } from '@testing-library/react';
import { render } from '../../__test__/utils';
import { Page } from '../songs/+Page';

// Spy references we can control per test
const leftFn = vi.fn();
const rightFn = vi.fn();
const tieFn = vi.fn();
const clearAllHeardleStateFn = vi.fn();
const initFn = vi.fn();
const clearFn = vi.fn();

let mockHeardleMode = true;
let mockState: any = { status: 'sorting', arr: [] };

vi.mock('~/hooks/useSongsSortData', () => ({
  useSongsSortData: () => ({
    state: mockState,
    listToSort: [
      {
        id: 'song-1',
        name: 'Song One',
        englishName: 'Song One',
        artists: [{ id: '1', variant: null }],
        seriesIds: [1],
        musicVideo: { videoId: 'v1', videoOffset: 0 },
        wikiAudioUrl: 'https://example.com/1.ogg',
        discographyIds: [1],
        phoneticName: 'song one',
        releasedOn: '2024-01-01'
      },
      {
        id: 'song-2',
        name: 'Song Two',
        englishName: 'Song Two',
        artists: [{ id: '1', variant: null }],
        seriesIds: [1],
        musicVideo: { videoId: 'v2', videoOffset: 0 },
        wikiAudioUrl: 'https://example.com/2.ogg',
        discographyIds: [1],
        phoneticName: 'song two',
        releasedOn: '2024-01-01'
      }
    ],
    listCount: 2,
    noTieMode: false,
    heardleMode: mockHeardleMode,
    setHeardleMode: vi.fn(),
    setNoTieMode: vi.fn(),
    init: initFn,
    left: leftFn,
    right: rightFn,
    tie: tieFn,
    undo: vi.fn(),
    progress: 0.5,
    comparisonsCount: 1,
    isEstimatedCount: false,
    maxComparisons: 3,
    songFilters: {},
    setSongFilters: vi.fn(),
    clear: clearFn,
    isEnded: false
  })
}));

let mockIsSongRevealed: (id: string) => boolean = () => false;
let mockIsSongFailed: (id: string) => boolean = () => false;

vi.mock('~/hooks/useHeardleState', () => ({
  useHeardleState: () => ({
    isSongRevealed: (id: string) => mockIsSongRevealed(id),
    isSongFailed: (id: string) => mockIsSongFailed(id),
    getAttemptCount: () => 0,
    getGuessHistory: () => [],
    getAudioDuration: () => 1,
    makeGuess: vi.fn(),
    passGuess: vi.fn(),
    autoReveal: vi.fn(),
    resetSession: vi.fn(),
    clearAllHeardleState: clearAllHeardleStateFn,
    failedSongIds: new Set<string>(),
    revealedSongIds: new Set<string>(),
    maxAttempts: 5
  })
}));

vi.mock('../../utils/sort', () => ({
  getCurrentItem: () => ({ left: ['song-1'], right: ['song-2'] }),
  step: vi.fn()
}));

vi.mock('~/utils/preloading', () => ({
  getNextItems: () => []
}));

// Mock SongCard to simplify
vi.mock('~/components/sorter/SongCard', () => ({
  SongCard: (props: any) => (
    <div
      data-testid={`song-card-${props.song?.id}`}
      data-revealed={props.isRevealed}
      data-failed={props.isFailed}
      onClick={props.onClick}
    >
      {props.song?.name}
    </div>
  )
}));

beforeAll(async () => {
  await import('../../components/sorter/SongFilters');
  await import('../../components/dialog/ConfirmDialog');
});

describe('Songs Page - Heardle Mode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHeardleMode = true;
    mockState = { status: 'sorting', arr: [] };
    mockIsSongRevealed = () => false;
    mockIsSongFailed = () => false;
  });

  it('SongCard onClick is undefined when not both revealed', async () => {
    mockIsSongRevealed = () => false;

    const [{ getByTestId }] = await render(<Page />);

    const card = getByTestId('song-card-song-1');
    fireEvent.click(card);

    expect(leftFn).not.toHaveBeenCalled();
  });

  it('SongCard onClick fires left() when both songs revealed', async () => {
    mockIsSongRevealed = () => true;

    const [{ getByTestId }] = await render(<Page />);

    const card = getByTestId('song-card-song-1');
    fireEvent.click(card);

    expect(leftFn).toHaveBeenCalled();
  });

  it('Tie button disabled when not both revealed', async () => {
    mockIsSongRevealed = () => false;

    const [{ getByText }] = await render(<Page />);

    const tieBtn = getByText('Tie');
    expect(tieBtn.closest('button')).toBeDisabled();
  });

  it('Tie button enabled when both revealed', async () => {
    mockIsSongRevealed = () => true;

    const [{ getByText }] = await render(<Page />);

    const tieBtn = getByText('Tie');
    expect(tieBtn.closest('button')).not.toBeDisabled();
  });

  it('ArrowLeft/Right/Down do not fire sort actions when not both revealed', async () => {
    mockIsSongRevealed = () => false;

    const [, user] = await render(<Page />);

    await user.keyboard('[ArrowLeft]');
    await user.keyboard('[ArrowRight]');
    await user.keyboard('[ArrowDown]');

    expect(leftFn).not.toHaveBeenCalled();
    expect(rightFn).not.toHaveBeenCalled();
    expect(tieFn).not.toHaveBeenCalled();
  });

  it('does not block ArrowLeft/Right/Down when both revealed', async () => {
    mockIsSongRevealed = () => true;

    await render(<Page />);

    // When both revealed, no capture-phase interceptor is registered.
    // We verify the default event is not prevented by checking the event
    // is not stopped (the mock useSongsSortData doesn't register keyboard
    // handlers, so we verify the page's blocking interceptor is absent).
    const event = new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true });
    document.dispatchEvent(event);

    // If the interceptor were active, defaultPrevented would be true
    expect(event.defaultPrevented).toBe(false);
  });

  it('shows "Guess both songs to enable ranking" when not both revealed', async () => {
    mockIsSongRevealed = () => false;

    const [{ getByText }] = await render(<Page />);

    expect(getByText('Guess both songs to enable ranking')).toBeInTheDocument();
  });

  it('shows "Song failed!" message and Continue calls right() when left failed', async () => {
    mockIsSongRevealed = (id: string) => id === 'song-2';
    mockIsSongFailed = (id: string) => id === 'song-1';

    const [{ getByText }, user] = await render(<Page />);

    expect(getByText(/Song failed!/)).toBeInTheDocument();

    const continueBtn = getByText('Continue');
    await user.click(continueBtn);

    // Left failed => right() should be called (other song wins)
    expect(rightFn).toHaveBeenCalled();
  });

  it('shows "Both songs failed!" and Continue calls tie()', async () => {
    mockIsSongFailed = () => true;

    const [{ getByText }, user] = await render(<Page />);

    expect(getByText(/Both songs failed!/)).toBeInTheDocument();

    const continueBtn = getByText('Continue');
    await user.click(continueBtn);

    expect(tieFn).toHaveBeenCalled();
  });

  it('calls clearAllHeardleState() when starting a new sort from not-sorting state', async () => {
    mockState = null; // not sorting

    const [{ getByText }, user] = await render(<Page />);

    const startBtn = getByText('Start');
    await user.click(startBtn);

    expect(clearAllHeardleStateFn).toHaveBeenCalled();
    expect(initFn).toHaveBeenCalled();
  });
});
