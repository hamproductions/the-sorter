import '@testing-library/jest-dom/vitest';

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { SongSearchPanel } from '../SongSearchPanel';
import { render, screen } from '~/__test__/utils';

// Mock the artists data with englishName fields
vi.mock('../../../../data/artists-info.json', () => ({
  default: [
    { id: '1', name: "μ's", characters: ['1', '2'], seriesIds: [1] },
    { id: '33', name: 'Aqours', characters: ['14', '15'], seriesIds: [2] },
    {
      id: '60',
      name: '虹ヶ咲学園スクールアイドル同好会',
      englishName: 'Nijigasaki High School Idol Club',
      characters: ['25'],
      seriesIds: [3]
    },
    { id: '91', name: 'Liella!', englishName: 'Liella!', characters: ['53'], seriesIds: [4] },
    {
      id: '133',
      name: '蓮ノ空女学院スクールアイドルクラブ',
      englishName: 'Hasu no Sora Jogakuin School Idol Club',
      characters: ['78'],
      seriesIds: [6]
    },
    {
      id: '134',
      name: 'スリーズブーケ',
      englishName: 'Cerise Bouquet',
      characters: ['78', '80'],
      seriesIds: [6]
    },
    // Individual characters for ad-hoc unit testing
    {
      id: '100',
      name: '鬼塚冬毬',
      englishName: 'Wein Margarete',
      characters: ['66'],
      seriesIds: [4]
    },
    {
      id: '101',
      name: '星空凛',
      englishName: 'Onitsuka Tomari',
      characters: ['95'],
      seriesIds: [4]
    },
    // Ad-hoc duo unit
    {
      id: '197',
      name: 'ウィーン・マルガレーテ、鬼塚冬毬',
      englishName: 'Wien Margarete, Tomari Onitsuka',
      characters: ['66', '95'],
      seriesIds: [4]
    }
  ]
}));

// Mock the useSongData hook
vi.mock('~/hooks/useSongData', () => ({
  useSongData: () => [
    {
      id: '1',
      name: 'Snow halation',
      phoneticName: 'すのーはれーしょん',
      artists: ['1'], // μ's
      seriesIds: [1]
    },
    {
      id: '2',
      name: 'Aozora Jumping Heart',
      phoneticName: 'あおぞらじゃんぴんぐはーと',
      artists: ['33'], // Aqours
      seriesIds: [2]
    },
    {
      id: '234',
      name: 'Aqours Pirate Desire',
      phoneticName: 'あくあぱいれーとでざいあ',
      artists: ['33'], // Aqours
      seriesIds: [2]
    },
    {
      id: '123',
      name: 'Heart ni Q',
      phoneticName: 'はーとにきゅー',
      artists: ['134'], // Cerise Bouquet
      seriesIds: [6] // Hasu
    },
    {
      id: '3',
      name: 'MOMENT RING',
      phoneticName: 'もーめんとりんぐ',
      artists: ['1'], // μ's
      seriesIds: [1]
    },
    {
      id: '5',
      name: 'START!! True dreams',
      phoneticName: 'すたーととぅるーどりーむず',
      artists: ['91'], // Liella!
      seriesIds: [4]
    },
    {
      id: '567',
      name: '千変万華',
      phoneticName: 'せんぺんばんか',
      artists: ['134'], // Cerise Bouquet
      seriesIds: [6] // Hasu
    },
    {
      id: '999',
      name: '11th moon',
      phoneticName: 'いれぶんすむーん',
      artists: ['197'], // Tomari + Margarete
      seriesIds: [1]
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

  describe('Romaji search with spaces', () => {
    it('finds songs when searching romaji with spaces', async () => {
      const [, user] = await render(
        <SongSearchPanel onAddSong={mockOnAddSong} onAddCustomSong={mockOnAddCustomSong} />
      );

      const searchInput = await screen.findByPlaceholderText('Search songs or artists...');
      await user.type(searchInput, 'senpen banka');

      expect(await screen.findByText('千変万華')).toBeInTheDocument();
    });

    it('is case insensitive for romaji searches', async () => {
      const [, user] = await render(
        <SongSearchPanel onAddSong={mockOnAddSong} onAddCustomSong={mockOnAddCustomSong} />
      );

      const searchInput = await screen.findByPlaceholderText('Search songs or artists...');
      await user.type(searchInput, 'SENPEN BANKA');

      expect(await screen.findByText('千変万華')).toBeInTheDocument();
    });
  });

  describe('English artist name search', () => {
    it('finds songs by English group name', async () => {
      const [, user] = await render(
        <SongSearchPanel onAddSong={mockOnAddSong} onAddCustomSong={mockOnAddCustomSong} />
      );

      const searchInput = await screen.findByPlaceholderText('Search songs or artists...');
      await user.type(searchInput, 'Cerise Bouquet');

      expect(await screen.findByText('Heart ni Q')).toBeInTheDocument();
    });

    it('finds songs by partial English group name', async () => {
      const [, user] = await render(
        <SongSearchPanel onAddSong={mockOnAddSong} onAddCustomSong={mockOnAddCustomSong} />
      );

      const searchInput = await screen.findByPlaceholderText('Search songs or artists...');
      await user.type(searchInput, 'Cerise');

      expect(await screen.findByText('Heart ni Q')).toBeInTheDocument();
    });
  });

  describe('Character name search for ad-hoc units', () => {
    it('finds songs from ad-hoc units when searching by English character name', async () => {
      const [, user] = await render(
        <SongSearchPanel onAddSong={mockOnAddSong} onAddCustomSong={mockOnAddCustomSong} />
      );

      const searchInput = await screen.findByPlaceholderText('Search songs or artists...');
      await user.type(searchInput, 'Tomari Onitsuka');

      // Should find the ad-hoc duo song
      expect(await screen.findByText('11th moon')).toBeInTheDocument();
    });

    it('finds songs from ad-hoc units when searching by Japanese character name', async () => {
      const [, user] = await render(
        <SongSearchPanel onAddSong={mockOnAddSong} onAddCustomSong={mockOnAddCustomSong} />
      );

      const searchInput = await screen.findByPlaceholderText('Search songs or artists...');
      await user.type(searchInput, '鬼塚冬毬');

      // Should find the ad-hoc duo song
      expect(await screen.findByText('11th moon')).toBeInTheDocument();
    });

    it('finds songs from ad-hoc units for both members of a duo', async () => {
      const [, user] = await render(
        <SongSearchPanel onAddSong={mockOnAddSong} onAddCustomSong={mockOnAddCustomSong} />
      );

      const searchInput = await screen.findByPlaceholderText('Search songs or artists...');

      // Search for first member
      await user.type(searchInput, 'Tomari Onitsuka');
      expect(await screen.findByText('11th moon')).toBeInTheDocument();

      // Clear and search for second member
      await user.clear(searchInput);
      await user.type(searchInput, 'Wein Margarete');
      expect(await screen.findByText('11th moon')).toBeInTheDocument();
    });

    // Tests for single clicking on arrow button to add
    describe('Click arrow to add song search results', () => {
      it('adds songs when clicking once on the arrow', async () => {
        const [, user] = await render(
          <SongSearchPanel onAddSong={mockOnAddSong} onAddCustomSong={mockOnAddCustomSong} />
        );

        // Standard flow to search for a song
        const searchInput = await screen.findByPlaceholderText('Search songs or artists...');
        await user.type(searchInput, 'Aozora Jumping Heart');

        expect(await screen.findByText('Aozora Jumping Heart')).toBeInTheDocument();

        // Now click the right arrow button
      });
    });
  });

  it('adds different songs when clicking different arrows', async () => {
    const [, user] = await render(
      <SongSearchPanel onAddSong={mockOnAddSong} onAddCustomSong={mockOnAddCustomSong} />
    );

    const searchInput = await screen.findByPlaceholderText('Search songs or artists...');
    await user.type(searchInput, 'Heart');

    // Wait for multiple results
    expect(await screen.findByText('Aozora Jumping Heart')).toBeInTheDocument();
    expect(await screen.findByText('Heart ni Q')).toBeInTheDocument();

    // Click the arrow for "Heart ni Q"
    const arrowButton = await screen.findByRole('button', {
      name: 'Add Heart ni Q to setlist'
    });
    await user.click(arrowButton);

    expect(mockOnAddSong).toHaveBeenCalledWith('123', 'Heart ni Q');
    expect(mockOnAddSong).toHaveBeenCalledTimes(1);
  });

  it('does not trigger double-click handler when clicking arrow once', async () => {
    const [, user] = await render(
      <SongSearchPanel onAddSong={mockOnAddSong} onAddCustomSong={mockOnAddCustomSong} />
    );

    const searchInput = await screen.findByPlaceholderText('Search songs or artists...');
    await user.type(searchInput, 'Snow');

    expect(await screen.findByText('Snow halation')).toBeInTheDocument();

    // Click the arrow button once
    const arrowButton = await screen.findByRole('button', {
      name: 'Add Snow halation to setlist'
    });
    await user.click(arrowButton);

    // Should only be called once (not multiple times from double-click)
    expect(mockOnAddSong).toHaveBeenCalledWith('1', 'Snow halation');
    expect(mockOnAddSong).toHaveBeenCalledTimes(1);
  });

  it('does not trigger parent double-click when double-clicking arrow button', async () => {
    const [, user] = await render(
      <SongSearchPanel onAddSong={mockOnAddSong} onAddCustomSong={mockOnAddCustomSong} />
    );

    const searchInput = await screen.findByPlaceholderText('Search songs or artists...');
    await user.type(searchInput, 'Snow');

    expect(await screen.findByText('Snow halation')).toBeInTheDocument();

    // Double-click the arrow button
    const arrowButton = await screen.findByRole('button', {
      name: 'Add Snow halation to setlist'
    });
    await user.dblClick(arrowButton);

    // Should only be called twice (once for each click), not 3 times
    // (the parent's double-click handler should not be triggered)
    expect(mockOnAddSong).toHaveBeenCalledWith('1', 'Snow halation');
    expect(mockOnAddSong).toHaveBeenCalledTimes(2);
  });
});
