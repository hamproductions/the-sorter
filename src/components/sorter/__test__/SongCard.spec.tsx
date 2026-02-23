import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '../../../__test__/utils';
import { SongCard } from '../SongCard';
import type { Song } from '~/types/songs';

// Mock Heardle component
vi.mock('../Heardle', () => ({
  Heardle: (props: any) => (
    <div data-testid="heardle-component" data-song-id={props.song?.id}>
      Heardle Component
    </div>
  )
}));

const createMockSong = (overrides: Partial<Song> = {}): Song =>
  ({
    id: 'song-1',
    name: 'Test Song',
    phoneticName: 'test',
    seriesIds: [1],
    releasedOn: '2024-01-01',
    musicVideo: { videoId: 'abc123', videoOffset: 0 },
    artists: [{ id: '1', variant: null }],
    discographyIds: [1],
    wikiAudioUrl: 'https://example.com/audio.ogg',
    ...overrides
  }) as unknown as Song;

describe('SongCard', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders song name and YouTube iframe in normal mode', async () => {
    const song = createMockSong();

    const [{ getByText, container }] = await render(<SongCard song={song} heardleMode={false} />);

    // In English mode, getSongName returns name (no englishName set)
    expect(getByText('Test Song')).toBeInTheDocument();
    const iframe = container.querySelector('iframe');
    expect(iframe).toBeInTheDocument();
    expect(iframe?.src).toContain('abc123');
  });

  it('returns null when no song provided', async () => {
    const [{ container }] = await render(<SongCard />);

    // The component should render nothing meaningful
    // Check that the SongCard stack is not present
    expect(container.querySelector('[class*="shadow"]')).not.toBeInTheDocument();
  });

  it('renders Heardle component when all heardle props provided and isRevealed=false', async () => {
    const song = createMockSong();

    const [{ getByTestId }] = await render(
      <SongCard
        song={song}
        heardleMode
        isRevealed={false}
        songInventory={[song]}
        onGuess={vi.fn()}
        onPass={vi.fn()}
        onNoAudio={vi.fn()}
      />
    );

    expect(getByTestId('heardle-component')).toBeInTheDocument();
  });

  it('hides song name and iframe when in heardle mode and not revealed', async () => {
    const song = createMockSong();

    const [{ queryByText, container }] = await render(
      <SongCard
        song={song}
        heardleMode
        isRevealed={false}
        songInventory={[song]}
        onGuess={vi.fn()}
        onPass={vi.fn()}
        onNoAudio={vi.fn()}
      />
    );

    // Song name should not be visible (showInfo = false)
    expect(queryByText('Test Song')).not.toBeInTheDocument();
    // iframe should not be present
    expect(container.querySelector('iframe')).not.toBeInTheDocument();
  });

  it('shows song info and iframe after reveal', async () => {
    const song = createMockSong();

    const [{ getByText, container }] = await render(
      <SongCard
        song={song}
        heardleMode
        isRevealed
        songInventory={[song]}
        onGuess={vi.fn()}
        onPass={vi.fn()}
        onNoAudio={vi.fn()}
      />
    );

    // When revealed, showInfo = true, showHeardle = false
    expect(getByText('Test Song')).toBeInTheDocument();
    expect(container.querySelector('iframe')).toBeInTheDocument();
  });

  it('shows red border and FAILED badge when isFailed=true in heardle mode', async () => {
    const song = createMockSong();

    const [{ getByText }] = await render(<SongCard song={song} heardleMode isRevealed isFailed />);

    expect(getByText('FAILED')).toBeInTheDocument();
  });

  it('does not show FAILED badge when not in heardle mode even if isFailed=true', async () => {
    const song = createMockSong();

    const [{ queryByText }] = await render(<SongCard song={song} heardleMode={false} isFailed />);

    expect(queryByText('FAILED')).not.toBeInTheDocument();
  });
});
