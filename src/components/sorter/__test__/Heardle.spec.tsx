import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render } from '../../../__test__/utils';
import { Heardle } from '../Heardle';
import type { Song } from '~/types/songs';
import { waitFor } from '@testing-library/react';

// Mock HeardleAudioPlayer to isolate
vi.mock('../HeardleAudioPlayer', () => ({
  HeardleAudioPlayer: ({
    blobUrl,
    maxDuration
  }: {
    blobUrl: string | null;
    maxDuration: number;
  }) => (
    <div data-testid="audio-player" data-blob={blobUrl} data-duration={maxDuration}>
      Audio Player
    </div>
  )
}));

// Mock SongSearchPanel to expose clickable add buttons
vi.mock('../../setlist-prediction/builder/SongSearchPanel', () => ({
  SongSearchPanel: ({ onAddSong }: { onAddSong: (id: string, name: string) => void }) => (
    <div data-testid="song-search">
      <button data-testid="select-song-1" onClick={() => onAddSong('song-1', 'Song One')}>
        Select Song 1
      </button>
      <button data-testid="select-song-2" onClick={() => onAddSong('song-2', 'Song Two')}>
        Select Song 2
      </button>
    </div>
  )
}));

// Create mock song objects
const createMockSong = (overrides: Partial<Song> = {}): Song =>
  ({
    id: 'song-1',
    name: 'Test Song',
    englishName: 'Test Song EN',
    phoneticName: 'test',
    seriesIds: [1],
    releasedOn: '2024-01-01',
    musicVideo: { videoId: 'abc123', videoOffset: 0 },
    artists: [{ id: '1', variant: null }],
    discographyIds: [1],
    wikiAudioUrl: 'https://example.com/audio.ogg',
    ...overrides
  }) as unknown as Song;

const mockSongWithAudio = createMockSong();
const mockSongNoAudio = createMockSong({ id: 'song-no-audio', wikiAudioUrl: '' });
const songInventory = [mockSongWithAudio, createMockSong({ id: 'song-2', name: 'Song Two' })];

describe('Heardle', () => {
  let mockFetch: Mock;

  beforeEach(() => {
    vi.restoreAllMocks();

    // Mock successful fetch by default
    mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(new Blob(['audio'], { type: 'audio/ogg' }))
    });
    vi.stubGlobal('fetch', mockFetch);

    // Mock URL.createObjectURL / revokeObjectURL without replacing the URL constructor
    URL.createObjectURL = vi.fn(() => 'blob:test/1');
    URL.revokeObjectURL = vi.fn();
  });

  const defaultProps = {
    song: mockSongWithAudio,
    songInventory,
    attempts: 0,
    maxAttempts: 5,
    guessHistory: [] as ('wrong' | 'pass')[],
    audioDuration: 1,
    onGuess: vi.fn(),
    onPass: vi.fn(),
    onNoAudio: vi.fn()
  };

  it('shows loading state while fetching audio', async () => {
    // Make fetch hang
    mockFetch.mockReturnValue(new Promise(() => {}));

    const [{ getByText }] = await render(<Heardle {...defaultProps} />);

    expect(getByText('Loading audio...')).toBeInTheDocument();
  });

  it('fetches audio with referrerPolicy no-referrer', async () => {
    await render(<Heardle {...defaultProps} />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(mockSongWithAudio.wikiAudioUrl, {
        referrerPolicy: 'no-referrer'
      });
    });
  });

  it('passes blob URL to audio player after successful fetch', async () => {
    const [{ findByTestId }] = await render(<Heardle {...defaultProps} />);

    const player = await findByTestId('audio-player');
    expect(player).toHaveAttribute('data-blob', 'blob:test/1');
  });

  it('calls onNoAudio when song has no wikiAudioUrl', async () => {
    const onNoAudio = vi.fn();

    await render(<Heardle {...defaultProps} song={mockSongNoAudio} onNoAudio={onNoAudio} />);

    await waitFor(() => {
      expect(onNoAudio).toHaveBeenCalled();
    });
  });

  it('shows "No audio available" text when song has no wikiAudioUrl', async () => {
    const [{ getByText }] = await render(<Heardle {...defaultProps} song={mockSongNoAudio} />);

    expect(getByText('No audio available - Song revealed!')).toBeInTheDocument();
  });

  it('calls onNoAudio when fetch fails', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));
    const onNoAudio = vi.fn();

    // Suppress console.error for the expected fetch failure
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await render(<Heardle {...defaultProps} onNoAudio={onNoAudio} />);

    await waitFor(() => {
      expect(onNoAudio).toHaveBeenCalled();
    });
  });

  it('renders guess indicator and guess counter text', async () => {
    const [{ getByText }] = await render(
      <Heardle {...defaultProps} attempts={0} maxAttempts={5} />
    );

    await waitFor(() => {
      expect(getByText('Guess 1/5')).toBeInTheDocument();
    });
  });

  it('shows selected song name after selection from search panel', async () => {
    const [{ findByTestId, findByText }, user] = await render(<Heardle {...defaultProps} />);

    const selectBtn = await findByTestId('select-song-1');
    await user.click(selectBtn);

    expect(await findByText(/Song One/)).toBeInTheDocument();
  });

  it('Submit Guess button disabled when no song selected, enabled after selection', async () => {
    const [{ findByText, findByTestId }, user] = await render(<Heardle {...defaultProps} />);

    const submitBtn = await findByText('Submit Guess');
    expect(submitBtn).toBeDisabled();

    await user.click(await findByTestId('select-song-1'));

    expect(submitBtn).not.toBeDisabled();
  });

  it('clears selection when clear button clicked', async () => {
    const [{ findByTestId, findByLabelText, queryByText }, user] = await render(
      <Heardle {...defaultProps} />
    );

    // Select a song
    await user.click(await findByTestId('select-song-1'));
    expect(queryByText(/Song One/)).toBeInTheDocument();

    // Clear selection
    const clearBtn = await findByLabelText('Clear selection');
    await user.click(clearBtn);

    expect(queryByText(/Song One/)).not.toBeInTheDocument();
  });

  it('calls onGuess with correct song ID for correct guess', async () => {
    const onGuess = vi.fn();

    const [{ findByTestId, findByText }, user] = await render(
      <Heardle {...defaultProps} onGuess={onGuess} />
    );

    // Select the correct song (same ID as the song prop)
    await user.click(await findByTestId('select-song-1'));
    await user.click(await findByText('Submit Guess'));

    expect(onGuess).toHaveBeenCalledWith('song-1');
  });

  it('calls onGuess, clears selection, shows "Wrong! Try again." for wrong guess', async () => {
    const onGuess = vi.fn();

    const [{ findByTestId, findByText, queryByText }, user] = await render(
      <Heardle {...defaultProps} onGuess={onGuess} />
    );

    // Select a wrong song
    await user.click(await findByTestId('select-song-2'));
    await user.click(await findByText('Submit Guess'));

    expect(onGuess).toHaveBeenCalledWith('song-2');
    // Selection should be cleared
    expect(queryByText(/Song Two/)).not.toBeInTheDocument();
    // Wrong feedback should be shown
    expect(await findByText('Wrong! Try again.')).toBeInTheDocument();
  });

  it('calls onPass when Pass button clicked', async () => {
    const onPass = vi.fn();

    const [{ findByText }, user] = await render(<Heardle {...defaultProps} onPass={onPass} />);

    await user.click(await findByText('Pass (Skip)'));

    expect(onPass).toHaveBeenCalled();
  });

  it('shows guess counter text', async () => {
    const [{ getByText }] = await render(
      <Heardle {...defaultProps} attempts={2} maxAttempts={5} />
    );

    await waitFor(() => {
      expect(getByText('Guess 3/5')).toBeInTheDocument();
    });
  });

  it('displays guess history entries', async () => {
    const [{ findByText }] = await render(
      <Heardle {...defaultProps} guessHistory={['wrong', 'pass']} attempts={2} />
    );

    expect(await findByText('Wrong')).toBeInTheDocument();
    expect(await findByText('Passed')).toBeInTheDocument();
  });

  it('resets selection and feedback when song prop changes', async () => {
    const [{ findByTestId, findByText, queryByText, rerender }, user] = await render(
      <Heardle {...defaultProps} />
    );

    // Select a wrong song and submit
    await user.click(await findByTestId('select-song-2'));
    await user.click(await findByText('Submit Guess'));

    expect(queryByText('Wrong! Try again.')).toBeInTheDocument();

    // Change the song prop
    const newSong = createMockSong({ id: 'song-3', name: 'New Song' });
    rerender(<Heardle {...defaultProps} song={newSong} />);

    await waitFor(() => {
      expect(queryByText('Wrong! Try again.')).not.toBeInTheDocument();
      expect(queryByText(/Song Two/)).not.toBeInTheDocument();
    });
  });
});
