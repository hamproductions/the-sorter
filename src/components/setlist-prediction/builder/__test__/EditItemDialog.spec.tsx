import { describe, expect, it, vi, beforeEach } from 'vitest';
import { EditItemDialog } from '../EditItemDialog';
import { render, screen, fireEvent } from '~/__test__/utils';
import type { SongSetlistItem, NonSongSetlistItem } from '~/types/setlist-prediction';

// Mock useSongData
vi.mock('~/hooks/useSongData', () => ({
  useSongData: () => [
    { id: '1', name: 'Snow halation', artists: ['1'] },
    { id: '2', name: 'Aozora Jumping Heart', artists: ['33'] }
  ]
}));

// Mock artists data
vi.mock('../../../../data/artists-info.json', () => ({
  default: [
    { id: '1', name: "μ's" },
    { id: '33', name: 'Aqours' }
  ]
}));

describe('EditItemDialog', () => {
  const mockOnOpenChange = vi.fn();
  const mockOnSave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const songItem: SongSetlistItem = {
    id: 'item-1',
    position: 0,
    type: 'song',
    songId: '1',
    isCustomSong: false
  };

  const customSongItem: SongSetlistItem = {
    id: 'item-2',
    position: 1,
    type: 'song',
    songId: 'custom-1',
    isCustomSong: true,
    customSongName: 'My Custom Song'
  };

  const mcItem: NonSongSetlistItem = {
    id: 'item-3',
    position: 2,
    type: 'mc',
    title: 'MC 1'
  };

  it('renders song item details', async () => {
    await render(
      <EditItemDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        item={songItem}
        onSave={mockOnSave}
      />
    );

    expect(screen.getByText('Edit Item')).toBeInTheDocument();
    expect(screen.getByText('Current Song')).toBeInTheDocument();
    expect(screen.getByText('Snow halation')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search songs or artists...')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Ver., Acoustic, Special notes...')).toBeInTheDocument();
  });

  it('renders custom song details', async () => {
    await render(
      <EditItemDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        item={customSongItem}
        onSave={mockOnSave}
      />
    );

    expect(screen.getByText('Current Song')).toBeInTheDocument();
    expect(screen.getByDisplayValue('My Custom Song')).toBeInTheDocument();
  });

  it('renders non-song item details', async () => {
    await render(
      <EditItemDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        item={mcItem}
        onSave={mockOnSave}
      />
    );

    expect(screen.getByDisplayValue('MC 1')).toBeInTheDocument();
    expect(screen.queryByText('Current Song')).not.toBeInTheDocument();
  });

  it('updates remarks', async () => {
    await render(
      <EditItemDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        item={songItem}
        onSave={mockOnSave}
      />
    );

    const remarksInput = screen.getByPlaceholderText('Ver., Acoustic, Special notes...');
    fireEvent.change(remarksInput, { target: { value: 'Acoustic Ver.' } });

    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    expect(mockOnSave).toHaveBeenCalledWith({
      remarks: 'Acoustic Ver.'
    });
  });

  it('updates custom song name', async () => {
    await render(
      <EditItemDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        item={customSongItem}
        onSave={mockOnSave}
      />
    );

    const nameInput = screen.getByDisplayValue('My Custom Song');
    fireEvent.change(nameInput, { target: { value: 'Updated Song Name' } });

    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    expect(mockOnSave).toHaveBeenCalledWith({
      remarks: undefined,
      customSongName: 'Updated Song Name'
    });
  });

  it('updates non-song title', async () => {
    await render(
      <EditItemDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        item={mcItem}
        onSave={mockOnSave}
      />
    );

    const titleInput = screen.getByDisplayValue('MC 1');
    fireEvent.change(titleInput, { target: { value: 'Updated MC' } });

    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    expect(mockOnSave).toHaveBeenCalledWith({
      remarks: undefined,
      title: 'Updated MC'
    });
  });

  it('changes song via search', async () => {
    await render(
      <EditItemDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        item={songItem}
        onSave={mockOnSave}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search songs or artists...');
    fireEvent.change(searchInput, { target: { value: 'Aozora' } });

    const result = await screen.findByText('Aozora Jumping Heart');
    fireEvent.click(result);

    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    expect(mockOnSave).toHaveBeenCalledWith({
      remarks: undefined,
      songId: '2',
      isCustomSong: false
    });
  });

  it('closes on cancel', async () => {
    await render(
      <EditItemDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        item={songItem}
        onSave={mockOnSave}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });
});
