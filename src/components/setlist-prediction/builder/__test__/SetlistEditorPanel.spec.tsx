import { describe, expect, it, vi } from 'vitest';
import { SetlistEditorPanel } from '../SetlistEditorPanel';
import { render, screen, fireEvent } from '~/__test__/utils';
import type { SongSetlistItem, NonSongSetlistItem } from '~/types/setlist-prediction';

// Mock dependencies
vi.mock('@dnd-kit/core', () => ({
  useDroppable: () => ({ setNodeRef: vi.fn() })
}));

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: any) => <div>{children}</div>,
  verticalListSortingStrategy: {},
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false
  })
}));

vi.mock('../setlist-editor/SetlistItem', () => ({
  SetlistItem: ({ item, onRemove, onMoveUp, onMoveDown }: any) => (
    <div data-testid={`item-${item.id}`}>
      <span>{item.type === 'song' ? `Song ${item.songId}` : item.title}</span>
      <button onClick={onRemove}>Remove</button>
      <button onClick={onMoveUp}>Up</button>
      <button onClick={onMoveDown}>Down</button>
    </div>
  )
}));

describe('SetlistEditorPanel', () => {
  const mockOnReorder = vi.fn();
  const mockOnRemove = vi.fn();
  const mockOnUpdate = vi.fn();
  const mockOnMoveUp = vi.fn();
  const mockOnMoveDown = vi.fn();
  const mockOnOpenImport = vi.fn();

  const defaultProps = {
    items: [],
    onReorder: mockOnReorder,
    onRemove: mockOnRemove,
    onUpdate: mockOnUpdate,
    onMoveUp: mockOnMoveUp,
    onMoveDown: mockOnMoveDown,
    onOpenImport: mockOnOpenImport
  };

  it('renders empty state when no items', async () => {
    await render(<SetlistEditorPanel {...defaultProps} />);
    expect(screen.getByText('Your setlist is empty')).toBeInTheDocument();
    expect(screen.getByText('Import')).toBeInTheDocument();
  });

  it('calls onOpenImport when import button clicked', async () => {
    await render(<SetlistEditorPanel {...defaultProps} />);
    const importButton = screen.getByText('Import');
    fireEvent.click(importButton);
    expect(mockOnOpenImport).toHaveBeenCalled();
  });

  it('renders items', async () => {
    const items: (SongSetlistItem | NonSongSetlistItem)[] = [
      { id: '1', position: 0, type: 'song', songId: 'song-1', isCustomSong: false },
      { id: '2', position: 1, type: 'mc', title: 'MC 1' }
    ];

    await render(<SetlistEditorPanel {...defaultProps} items={items} />);

    expect(screen.getByText('Your Setlist')).toBeInTheDocument();
    expect(screen.getByText('2 items')).toBeInTheDocument();
    expect(screen.getByTestId('item-1')).toBeInTheDocument();
    expect(screen.getByTestId('item-2')).toBeInTheDocument();
  });

  it('calls onRemove when remove button clicked', async () => {
    const items: SongSetlistItem[] = [
      { id: '1', position: 0, type: 'song', songId: 'song-1', isCustomSong: false }
    ];

    await render(<SetlistEditorPanel {...defaultProps} items={items} />);

    const removeButton = screen.getByText('Remove');
    fireEvent.click(removeButton);

    expect(mockOnRemove).toHaveBeenCalledWith('1');
  });

  it('calls onMoveUp when up button clicked', async () => {
    const items: SongSetlistItem[] = [
      { id: '1', position: 0, type: 'song', songId: 'song-1', isCustomSong: false }
    ];

    await render(<SetlistEditorPanel {...defaultProps} items={items} />);

    const upButton = screen.getByText('Up');
    fireEvent.click(upButton);

    expect(mockOnMoveUp).toHaveBeenCalledWith(0);
  });

  it('calls onMoveDown when down button clicked', async () => {
    const items: SongSetlistItem[] = [
      { id: '1', position: 0, type: 'song', songId: 'song-1', isCustomSong: false }
    ];

    await render(<SetlistEditorPanel {...defaultProps} items={items} />);

    const downButton = screen.getByText('Down');
    fireEvent.click(downButton);

    expect(mockOnMoveDown).toHaveBeenCalledWith(0);
  });
});
