import { describe, expect, it, vi } from 'vitest';
import { SetlistView } from '../SetlistView';
import { render, screen } from '~/__test__/utils';
import type { SetlistPrediction, Performance } from '~/types/setlist-prediction';

vi.mock('~/hooks/useSongData', () => ({
  useSongData: () => [{ id: 'song-1', name: 'Test Song', artists: ['artist-1'] }]
}));

vi.mock('../../../../data/artists-info.json', () => ({
  default: [{ id: 'artist-1', name: 'Test Artist' }]
}));

describe('SetlistView', () => {
  const mockPrediction: SetlistPrediction = {
    id: 'pred-1',
    performanceId: 'perf-1',
    name: 'Test Prediction',
    setlist: {
      id: 'setlist-1',
      performanceId: 'perf-1',
      items: [
        { id: 'item-1', type: 'song', songId: 'song-1', position: 0 },
        { id: 'item-2', type: 'mc', title: 'MC Talk', position: 1 },
        { id: 'item-3', type: 'other', title: '━━ ENCORE ━━', position: 2 },
        { id: 'item-4', type: 'song', songId: 'song-1', position: 3 }
      ],
      sections: []
    },
    createdAt: '2023-01-01',
    updatedAt: '2023-01-01'
  };

  const mockPerformance: Performance = {
    id: 'perf-1',
    name: 'Test Performance',
    date: '2023-01-01',
    venue: 'Test Venue',
    seriesIds: [],
    artistIds: [],
    source: 'custom',
    status: 'upcoming',
    createdAt: '2023-01-01',
    updatedAt: '2023-01-01'
  };

  it('renders correctly with header', async () => {
    await render(<SetlistView prediction={mockPrediction} performance={mockPerformance} />);

    expect(screen.getByText('Test Performance')).toBeInTheDocument();
    expect(screen.getByText('Test Venue', { exact: false })).toBeInTheDocument();
    expect(screen.getAllByText('2 songs', { exact: false })[0]).toBeInTheDocument();
  });

  it('renders without header when showHeader is false', async () => {
    await render(<SetlistView prediction={mockPrediction} showHeader={false} />);

    expect(screen.queryByText('Test Performance')).not.toBeInTheDocument();
  });

  it('renders author name when provided', async () => {
    await render(<SetlistView prediction={mockPrediction} authorName="Test Author" />);

    expect(screen.getByText('by Test Author')).toBeInTheDocument();
  });

  it('renders song items correctly', async () => {
    await render(<SetlistView prediction={mockPrediction} />);

    expect(screen.getAllByText('Test Song')).toHaveLength(2);
    expect(screen.getByText('M01')).toBeInTheDocument();
    expect(screen.getByText('EN01')).toBeInTheDocument();
  });

  it('renders MC items correctly', async () => {
    await render(<SetlistView prediction={mockPrediction} />);

    expect(screen.getByText('MC Talk')).toBeInTheDocument();
    expect(screen.getByText('MC①')).toBeInTheDocument();
  });

  it('renders divider items correctly', async () => {
    await render(<SetlistView prediction={mockPrediction} />);

    expect(screen.getByText('━━ ENCORE ━━')).toBeInTheDocument();
  });

  it('renders custom songs correctly', async () => {
    const predictionWithCustomSong: SetlistPrediction = {
      ...mockPrediction,
      setlist: {
        ...mockPrediction.setlist,
        items: [
          {
            id: 'item-1',
            type: 'song',
            songId: '',
            isCustomSong: true,
            customSongName: 'Custom Song',
            position: 0
          }
        ]
      }
    };

    await render(<SetlistView prediction={predictionWithCustomSong} />);

    expect(screen.getByText('Custom Song')).toBeInTheDocument();
  });

  it('renders in compact mode', async () => {
    await render(<SetlistView prediction={mockPrediction} compact={true} />);

    expect(screen.queryByText(/Total Songs/)).not.toBeInTheDocument();
  });

  it('renders with custom performance', async () => {
    const predictionWithCustomPerf: SetlistPrediction = {
      ...mockPrediction,
      customPerformance: {
        name: 'Custom Performance',
        date: '2023-02-01',
        venue: 'Custom Venue'
      }
    };

    await render(<SetlistView prediction={predictionWithCustomPerf} />);

    expect(screen.getByText('Custom Performance')).toBeInTheDocument();
    expect(screen.getByText('Custom Venue', { exact: false })).toBeInTheDocument();
  });

  it('renders remarks on song items', async () => {
    const predictionWithRemarks: SetlistPrediction = {
      ...mockPrediction,
      setlist: {
        ...mockPrediction.setlist,
        items: [
          { id: 'item-1', type: 'song', songId: 'song-1', position: 0, remarks: 'Special version' }
        ]
      }
    };

    await render(<SetlistView prediction={predictionWithRemarks} />);

    expect(screen.getByText('Special version')).toBeInTheDocument();
  });

  it('renders remarks on non-song items', async () => {
    const predictionWithRemarks: SetlistPrediction = {
      ...mockPrediction,
      setlist: {
        ...mockPrediction.setlist,
        items: [{ id: 'item-1', type: 'mc', title: 'MC', position: 0, remarks: 'Long talk' }]
      }
    };

    await render(<SetlistView prediction={predictionWithRemarks} />);

    expect(screen.getByText('Long talk')).toBeInTheDocument();
  });
});
