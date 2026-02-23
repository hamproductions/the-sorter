import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DndContext } from '@dnd-kit/core';
import { SongSearchPanel } from './SongSearchPanel';
import type { Song } from '~/types/songs';

const mockSongs: Song[] = [
  {
    id: 'song-1',
    name: 'Test Song Alpha',
    seriesIds: []
  },
  {
    id: 'song-2',
    name: 'Test Song Beta',
    seriesIds: []
  }
];

function renderPanel({
  singleClickSelect,
  onAddSong
}: {
  singleClickSelect?: boolean;
  onAddSong?: (songId: string, songTitle: string) => void;
}) {
  const handleAddSong = onAddSong ?? vi.fn();
  return {
    onAddSong: handleAddSong,
    ...render(
      <DndContext>
        <SongSearchPanel
          onAddSong={handleAddSong}
          hideTitle
          songInventory={mockSongs}
          singleClickSelect={singleClickSelect}
        />
      </DndContext>
    )
  };
}

describe('SongSearchPanel single click select', () => {
  it('should call onAddSong on single click when singleClickSelect is true', async () => {
    const user = userEvent.setup();
    const { onAddSong } = renderPanel({ singleClickSelect: true });

    const input = screen.getByPlaceholderText(/search/i);
    await user.type(input, 'Alpha');

    const songItem = await screen.findByText('Test Song Alpha');
    await user.click(songItem);

    expect(onAddSong).toHaveBeenCalledWith('song-1', 'Test Song Alpha');
  });

  it('should NOT call onAddSong on single click when singleClickSelect is false', async () => {
    const user = userEvent.setup();
    const { onAddSong } = renderPanel({ singleClickSelect: false });

    const input = screen.getByPlaceholderText(/search/i);
    await user.type(input, 'Alpha');

    const songItem = await screen.findByText('Test Song Alpha');
    await user.click(songItem);

    expect(onAddSong).not.toHaveBeenCalled();
  });

  it('should call onAddSong on double click when singleClickSelect is false', async () => {
    const user = userEvent.setup();
    const { onAddSong } = renderPanel({ singleClickSelect: false });

    const input = screen.getByPlaceholderText(/search/i);
    await user.type(input, 'Alpha');

    const songItem = await screen.findByText('Test Song Alpha');
    await user.dblClick(songItem);

    expect(onAddSong).toHaveBeenCalledWith('song-1', 'Test Song Alpha');
  });

  it('should call onAddSong on arrow button click regardless of singleClickSelect', async () => {
    const user = userEvent.setup();
    const { onAddSong } = renderPanel({ singleClickSelect: false });

    const input = screen.getByPlaceholderText(/search/i);
    await user.type(input, 'Alpha');

    const addButton = await screen.findByLabelText(/add test song alpha/i);
    await user.click(addButton);

    expect(onAddSong).toHaveBeenCalledWith('song-1', 'Test Song Alpha');
  });
});
