import { describe, expect, it, vi } from 'vitest';
import { SetlistItem } from '../SetlistItem';
import { render, screen } from '~/__test__/utils';
import type { SongSetlistItem, NonSongSetlistItem } from '~/types/setlist-prediction';

// Mock dependencies
vi.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    setActivatorNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false
  }),
  CSS: {
    Transform: {
      toString: vi.fn()
    }
  }
}));

vi.mock('../../EditItemDialog', () => ({
  // eslint-disable-next-line
  EditItemDialog: ({ open, onSave }: any) =>
    open ? (
      <div data-testid="edit-dialog">
        <button onClick={() => onSave({ remarks: 'Updated' })}>Save Edit</button>
      </div>
    ) : null
}));

vi.mock('~/hooks/useSongData', () => ({
  useSongData: () => [{ id: 'song-1', name: 'Test Song', artists: [{ id: 'artist-1' }] }]
}));

vi.mock('../../../../../../data/artists-info.json', () => ({
  default: [{ id: 'artist-1', name: 'Test Artist' }]
}));

describe('SetlistItem', () => {
  const mockOnRemove = vi.fn();
  const mockOnUpdate = vi.fn();
  const mockOnMoveUp = vi.fn();
  const mockOnMoveDown = vi.fn();

  const defaultProps = {
    index: 0,
    onRemove: mockOnRemove,
    onUpdate: mockOnUpdate,
    onMoveUp: mockOnMoveUp,
    onMoveDown: mockOnMoveDown,
    isFirst: false,
    isLast: false
  };

  it('renders song item correctly', async () => {
    const item: SongSetlistItem = {
      id: '1',
      position: 0,
      type: 'song',
      songId: 'song-1',
      isCustomSong: false
    };

    await render(<SetlistItem {...defaultProps} item={item} />);

    expect(screen.getByText('Test Song')).toBeInTheDocument();
    expect(screen.getByText('Test Artist')).toBeInTheDocument();
  });

  it('renders custom song item correctly', async () => {
    const item: SongSetlistItem = {
      id: '1',
      position: 0,
      type: 'song',
      songId: 'custom-1',
      isCustomSong: true,
      customSongName: 'Custom Song'
    };

    await render(<SetlistItem {...defaultProps} item={item} />);

    expect(screen.getByText('Custom Song')).toBeInTheDocument();
  });

  it('renders non-song item correctly', async () => {
    const item: NonSongSetlistItem = {
      id: '1',
      position: 0,
      type: 'mc',
      title: 'MC 1'
    };

    await render(<SetlistItem {...defaultProps} item={item} />);

    expect(screen.getByText('MC 1')).toBeInTheDocument();
  });

  it('calls onRemove when delete button clicked', async () => {
    const item: SongSetlistItem = {
      id: '1',
      position: 0,
      type: 'song',
      songId: 'song-1',
      isCustomSong: false
    };

    const [, user] = await render(<SetlistItem {...defaultProps} item={item} />);

    const deleteButton = screen.getByLabelText('Delete');
    await user.click(deleteButton);

    expect(mockOnRemove).toHaveBeenCalled();
  });

  it('calls onMoveUp when move up button clicked', async () => {
    const item: SongSetlistItem = {
      id: '1',
      position: 0,
      type: 'song',
      songId: 'song-1',
      isCustomSong: false
    };

    const [, user] = await render(<SetlistItem {...defaultProps} item={item} />);

    const moveUpButton = screen.getByLabelText('Move up');
    await user.click(moveUpButton);

    expect(mockOnMoveUp).toHaveBeenCalled();
  });

  it('calls onMoveDown when move down button clicked', async () => {
    const item: SongSetlistItem = {
      id: '1',
      position: 0,
      type: 'song',
      songId: 'song-1',
      isCustomSong: false
    };

    const [, user] = await render(<SetlistItem {...defaultProps} item={item} />);

    const moveDownButton = screen.getByLabelText('Move down');
    await user.click(moveDownButton);

    expect(mockOnMoveDown).toHaveBeenCalled();
  });

  it('opens edit dialog when edit button clicked', async () => {
    const item: SongSetlistItem = {
      id: '1',
      position: 0,
      type: 'song',
      songId: 'song-1',
      isCustomSong: false
    };

    const [, user] = await render(<SetlistItem {...defaultProps} item={item} />);

    const editButton = screen.getByLabelText('Edit item');
    await user.click(editButton);

    expect(screen.getByTestId('edit-dialog')).toBeInTheDocument();
  });

  it('displays correct numbering for songs', async () => {
    const item: SongSetlistItem = {
      id: '1',
      position: 0,
      type: 'song',
      songId: 'song-1',
      isCustomSong: false
    };

    // Regular song
    const [res] = await render(<SetlistItem {...defaultProps} item={item} songNumber={5} />);
    expect(screen.getByText('M05')).toBeInTheDocument();

    // Encore song
    res.rerender(<SetlistItem {...defaultProps} item={item} encoreNumber={2} />);
    expect(screen.getByText('EN02')).toBeInTheDocument();
  });

  it('displays correct numbering for MCs', async () => {
    const item: NonSongSetlistItem = {
      id: '1',
      position: 0,
      type: 'mc',
      title: 'MC'
    };

    await render(<SetlistItem {...defaultProps} item={item} mcNumber={1} />);
    expect(screen.getByText('MC①')).toBeInTheDocument();
  });
});
