import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '~/__test__/utils';
import userEvent from '@testing-library/user-event';
import { PerformancePickerForSortDialog } from '../PerformancePickerForSortDialog';

vi.mock('~/hooks/setlist-prediction/usePerformanceData', () => ({
  usePerformanceData: () => ({
    performances: [
      {
        id: 'perf-1',
        tourName: 'Latest Live',
        performanceName: 'Day 1',
        date: '2026-03-01',
        venue: 'Tokyo Dome',
        hasSetlist: true
      }
    ],
    loading: false,
    error: null
  }),
  usePerformanceSetlist: (id?: string) => ({
    setlist: id
      ? {
          id: `setlist-${id}`,
          items: [
            { id: 'item-1', type: 'song', songId: '1', position: 0 },
            { id: 'item-2', type: 'song', songId: '3', position: 1 }
          ],
          sections: []
        }
      : null,
    loading: false,
    error: null
  })
}));

vi.mock('~/hooks/useSongData', () => ({
  useSongData: () => [
    { id: '1', name: 'Song One', englishName: 'Song One' },
    { id: '3', name: 'Snow halation', englishName: 'Snow halation' }
  ]
}));

describe('PerformancePickerForSortDialog', () => {
  it('renders a stable selection summary before a performance is chosen', async () => {
    await render(
      <PerformancePickerForSortDialog open onOpenChange={vi.fn()} onSelectPerformance={vi.fn()} />
    );

    expect(screen.getByText('Select Performance')).toBeInTheDocument();
    expect(screen.getByText('Select a performance to preview its setlist.')).toBeInTheDocument();
  });

  it('updates the summary after selecting a performance', async () => {
    await render(
      <PerformancePickerForSortDialog open onOpenChange={vi.fn()} onSelectPerformance={vi.fn()} />
    );

    await userEvent.setup().click(screen.getByText('Latest Live - Day 1'));

    expect(await screen.findByText('2 songs (deduplicated)')).toBeInTheDocument();
  });
});
