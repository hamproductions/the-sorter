import { describe, expect, it, vi } from 'vitest';
import { AddItemDrawer } from '../AddItemDrawer';
import { render, screen, fireEvent } from '~/__test__/utils';

// Mock SongSearchPanel
vi.mock('../SongSearchPanel', () => ({
  SongSearchPanel: ({ onAddSong, onAddCustomSong }: any) => (
    <div data-testid="song-search-panel">
      <button onClick={() => onAddSong('1', 'Test Song')}>Add Test Song</button>
      <button onClick={() => onAddCustomSong('Custom Song')}>Add Custom Song</button>
    </div>
  )
}));

describe('AddItemDrawer', () => {
  const mockOnClose = vi.fn();
  const mockOnAddSong = vi.fn();
  const mockOnAddCustomSong = vi.fn();
  const mockOnAddQuickItem = vi.fn();

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onAddSong: mockOnAddSong,
    onAddCustomSong: mockOnAddCustomSong,
    onAddQuickItem: mockOnAddQuickItem
  };

  it('renders when open', async () => {
    await render(<AddItemDrawer {...defaultProps} />);
    expect(screen.getByText('Add Item')).toBeInTheDocument();
    expect(screen.getByText('Quick Add')).toBeInTheDocument();
    expect(screen.getByTestId('song-search-panel')).toBeInTheDocument();
  });

  it('calls onAddQuickItem and onClose when MC button is clicked', async () => {
    await render(<AddItemDrawer {...defaultProps} />);

    const mcButton = screen.getByRole('button', { name: /MC/i });
    fireEvent.click(mcButton);

    expect(mockOnAddQuickItem).toHaveBeenCalledWith('MC', 'mc');
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls onAddQuickItem and onClose when Encore button is clicked', async () => {
    await render(<AddItemDrawer {...defaultProps} />);

    const encoreButton = screen.getByRole('button', { name: /Encore/i });
    fireEvent.click(encoreButton);

    expect(mockOnAddQuickItem).toHaveBeenCalledWith('━━ ENCORE ━━', 'other');
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls onAddSong and onClose when song is selected from panel', async () => {
    await render(<AddItemDrawer {...defaultProps} />);

    const addSongButton = screen.getByText('Add Test Song');
    fireEvent.click(addSongButton);

    expect(mockOnAddSong).toHaveBeenCalledWith('1', 'Test Song');
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls onAddCustomSong and onClose when custom song is added from panel', async () => {
    await render(<AddItemDrawer {...defaultProps} />);

    const addCustomButton = screen.getByText('Add Custom Song');
    fireEvent.click(addCustomButton);

    expect(mockOnAddCustomSong).toHaveBeenCalledWith('Custom Song');
    expect(mockOnClose).toHaveBeenCalled();
  });
});
