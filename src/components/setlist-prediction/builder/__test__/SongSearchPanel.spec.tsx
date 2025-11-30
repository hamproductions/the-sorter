import '@testing-library/jest-dom/vitest';

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { SongSearchPanel } from '../SongSearchPanel';
import { render, screen } from '~/__test__/utils';

// Mock the useSongData hook
vi.mock('~/hooks/useSongData', () => ({
  useSongData: () => [
    {
      id: '1',
      name: 'Snow halation',
      artists: ['1'], // μ's
      seriesIds: [1]
    },
    {
      id: '2',
      name: 'Aozora Jumping Heart',
      artists: ['33'], // Aqours
      seriesIds: [2]
    },
    {
      id: '234',
      name: 'Aqours Pirate Desire',
      artists: ['33'], // Aqours
      seriesIds: [2]
    },
    {
      id: '123',
      name: 'Heart ni Q',
      artists: ['134'], // Cerise Bouquet
      seriesIds: [6] // Hasu
    },
    {
      id: '3',
      name: 'MOMENT RING',
      artists: ['1'], // μ's
      seriesIds: [1]
    },
    {
      id: '4',
      name: 'SELF CONTROL!!',
      artists: ['60'], // Nijigaku
      seriesIds: [3]
    },
    {
      id: '5',
      name: 'START!! True dreams',
      artists: ['91'], // Liella!
      seriesIds: [4]
    }
  ]
}));

describe('SongSearchPanel', () => {
  const mockOnAddSong = vi.fn();
  const mockOnAddCustomSong = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the search bar with placeholder text', async () => {
    await render(
      <SongSearchPanel onAddSong={mockOnAddSong} onAddCustomSong={mockOnAddCustomSong} />
    );

    const searchInput = await screen.findByPlaceholderText('Search songs or artists...');
    expect(searchInput).toBeInTheDocument();
  });

  it('shows initial empty search results', async () => {
    await render(
      <SongSearchPanel onAddSong={mockOnAddSong} onAddCustomSong={mockOnAddCustomSong} />
    );

    expect(
      await screen.findByText('Start typing to search for songs or artists...')
    ).toBeInTheDocument();
  });

  describe('Song name search', () => {
    it('filters songs by name', async () => {
      const [, user] = await render(
        <SongSearchPanel onAddSong={mockOnAddSong} onAddCustomSong={mockOnAddCustomSong} />
      );

      const searchInput = await screen.findByPlaceholderText('Search songs or artists...');
      await user.type(searchInput, 'Snow');

      expect(await screen.findByText('Snow halation')).toBeInTheDocument();
      expect(screen.queryByText('Aozora Jumping Heart')).toBeNull();
    });

    it('shows multiple song matches', async () => {
      const [, user] = await render(
        <SongSearchPanel onAddSong={mockOnAddSong} onAddCustomSong={mockOnAddCustomSong} />
      );

      const searchInput = await screen.findByPlaceholderText('Search songs or artists...');
      await user.type(searchInput, 'Heart');

      expect(await screen.findByText('Aozora Jumping Heart')).toBeInTheDocument();
      expect(await screen.findByText('Heart ni Q')).toBeInTheDocument();
      expect(await screen.findByText('Showing 2 results')).toBeInTheDocument();
    });

    it('is case insensitive', async () => {
      const [, user] = await render(
        <SongSearchPanel onAddSong={mockOnAddSong} onAddCustomSong={mockOnAddCustomSong} />
      );

      const searchInput = await screen.findByPlaceholderText('Search songs or artists...');
      await user.type(searchInput, 'snow');

      expect(await screen.findByText('Snow halation')).toBeInTheDocument();
    });
  });

  describe('Artist/Group search', () => {
    it('finds songs by artist name', async () => {
      const [, user] = await render(
        <SongSearchPanel onAddSong={mockOnAddSong} onAddCustomSong={mockOnAddCustomSong} />
      );

      const searchInput = await screen.findByPlaceholderText('Search songs or artists...');
      await user.type(searchInput, 'Liella');

      expect(await screen.findByText('START!! True dreams')).toBeInTheDocument();
      expect(screen.queryByText('Songs by matching artists/groups')).not.toBeInTheDocument();
    });

    it('shows artist matches section when both song and artist matches exist', async () => {
      const [, user] = await render(
        <SongSearchPanel onAddSong={mockOnAddSong} onAddCustomSong={mockOnAddCustomSong} />
      );

      const searchInput = await screen.findByPlaceholderText('Search songs or artists...');
      await user.type(searchInput, 'Aqours');

      expect(await screen.findByText('Aqours Pirate Desire')).toBeInTheDocument();
      expect(screen.getByText('Songs by matching artists/groups')).toBeInTheDocument();
    });
  });

  describe('Deduplication', () => {
    it('does not show duplicate songs in both sections', async () => {
      const [, user] = await render(
        <SongSearchPanel onAddSong={mockOnAddSong} onAddCustomSong={mockOnAddCustomSong} />
      );

      const searchInput = await screen.findByPlaceholderText('Search songs or artists...');
      await user.type(searchInput, 'Aqours');

      await screen.findByText('Aqours Pirate Desire');
      const aqoursPirateDesireElements = screen.getAllByText('Aqours Pirate Desire');
      expect(aqoursPirateDesireElements).toHaveLength(1);
    });
  });

  describe('No results', () => {
    it('shows no results message when nothing matches', async () => {
      const [, user] = await render(
        <SongSearchPanel onAddSong={mockOnAddSong} onAddCustomSong={mockOnAddCustomSong} />
      );

      const searchInput = await screen.findByPlaceholderText('Search songs or artists...');
      await user.type(searchInput, 'NonexistentSong123');

      expect(screen.getByText('No songs found')).toBeInTheDocument();
    });

    it('shows add custom song button when no results', async () => {
      const [, user] = await render(
        <SongSearchPanel onAddSong={mockOnAddSong} onAddCustomSong={mockOnAddCustomSong} />
      );

      const searchInput = await screen.findByPlaceholderText('Search songs or artists...');
      await user.type(searchInput, 'CustomSong');

      expect(screen.getByText('Add "CustomSong" as custom song')).toBeInTheDocument();
    });

    it('calls onAddCustomSong when add custom song button is clicked', async () => {
      const [, user] = await render(
        <SongSearchPanel onAddSong={mockOnAddSong} onAddCustomSong={mockOnAddCustomSong} />
      );

      const searchInput = await screen.findByPlaceholderText('Search songs or artists...');
      await user.type(searchInput, 'CustomSong');

      const addButton = await screen.findByText('Add "CustomSong" as custom song');
      await user.click(addButton);

      expect(mockOnAddCustomSong).toHaveBeenCalledWith('CustomSong');
    });
  });

  describe('Result count', () => {
    it('shows correct result count', async () => {
      const [, user] = await render(
        <SongSearchPanel onAddSong={mockOnAddSong} onAddCustomSong={mockOnAddCustomSong} />
      );

      const searchInput = await screen.findByPlaceholderText('Search songs or artists...');
      await user.type(searchInput, 'Snow');

      expect(await screen.findByText('Showing 1 results')).toBeInTheDocument();
    });
  });

  describe('Double-click interaction', () => {
    it('calls onAddSong when song item is double-clicked', async () => {
      const [, user] = await render(
        <SongSearchPanel onAddSong={mockOnAddSong} onAddCustomSong={mockOnAddCustomSong} />
      );

      const searchInput = await screen.findByPlaceholderText('Search songs or artists...');
      await user.type(searchInput, 'Snow');

      const songItem = await screen.findByText('Snow halation');
      await user.dblClick(songItem);

      expect(mockOnAddSong).toHaveBeenCalledWith('1', 'Snow halation');
    });
  });
});
