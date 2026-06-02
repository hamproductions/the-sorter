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
        date: '2026-05-01',
        venue: 'Tokyo Dome',
        hasSetlist: true
      },
      {
        id: 'perf-2',
        tourName: 'Latest Live',
        performanceName: 'Day 2',
        date: '2026-05-02',
        venue: 'Tokyo Dome',
        hasSetlist: true
      },
      {
        id: 'perf-3',
        tourName: 'Tour Live',
        performanceName: 'Osaka (Day.1)',
        date: '2026-04-01',
        venue: 'Osaka',
        hasSetlist: true
      },
      {
        id: 'perf-4',
        tourName: 'Tour Live',
        performanceName: 'Osaka (Day.2)',
        date: '2026-04-02',
        venue: 'Osaka',
        hasSetlist: true
      },
      {
        id: 'perf-5',
        tourName: 'Other Live',
        performanceName: 'No Setlist',
        date: '2026-05-01',
        venue: 'Nagoya',
        hasSetlist: false
      }
    ],
    loading: false,
    error: null
  }),
  usePerformanceSetlists: (ids: string[]) => ({
    setlistsByPerformanceId: new Map(
      ids.map((id) => [
        id,
        {
          id: `setlist-${id}`,
          performanceId: id,
          items:
            id === 'perf-1'
              ? [
                  { id: 'item-1', type: 'song', songId: '1', position: 0 },
                  { id: 'item-2', type: 'song', songId: '3', position: 1 }
                ]
              : id === 'perf-2'
                ? [
                    { id: 'item-3', type: 'song', songId: '3', position: 0 },
                    { id: 'item-4', type: 'song', songId: '4', position: 1 }
                  ]
                : id === 'perf-3'
                  ? [{ id: 'item-5', type: 'song', songId: '5', position: 0 }]
                  : [{ id: 'item-6', type: 'song', songId: '6', position: 0 }],
          sections: []
        }
      ])
    ),
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
    { id: '3', name: 'Snow halation', englishName: 'Snow halation' },
    { id: '4', name: 'Song Four', englishName: 'Song Four' },
    { id: '5', name: 'Song Five', englishName: 'Song Five' },
    { id: '6', name: 'Song Six', englishName: 'Song Six' }
  ]
}));

describe('PerformancePickerForSortDialog', () => {
  it('renders a stable selection summary before a performance is chosen', async () => {
    await render(
      <PerformancePickerForSortDialog open onOpenChange={vi.fn()} onSelectPerformance={vi.fn()} />
    );

    expect(screen.getByText('Select Performances')).toBeInTheDocument();
    expect(
      screen.getByText('Select performances to preview their setlist songs.')
    ).toBeInTheDocument();
  });

  it('updates the summary after selecting a performance', async () => {
    const user = userEvent.setup();

    await render(
      <PerformancePickerForSortDialog open onOpenChange={vi.fn()} onSelectPerformance={vi.fn()} />
    );

    await user.click(screen.getAllByText('Show details')[0]);
    await user.click(screen.getByLabelText('Latest Live - Day 1'));

    expect(await screen.findByText('2 songs (deduplicated)')).toBeInTheDocument();
  });

  it('collapses event rows by default and expands them on demand', async () => {
    const user = userEvent.setup();

    await render(
      <PerformancePickerForSortDialog open onOpenChange={vi.fn()} onSelectPerformance={vi.fn()} />
    );

    expect(screen.getByLabelText('Latest Live')).toBeInTheDocument();
    expect(screen.queryByLabelText('Latest Live - Day 1')).not.toBeInTheDocument();

    await user.click(screen.getAllByText('Show details')[0]);

    expect(screen.getByLabelText('Latest Live - Day 1')).toBeInTheDocument();
    expect(screen.getByText('Day 1')).toBeInTheDocument();
    expect(screen.queryByText('Latest Live - Day 1')).not.toBeInTheDocument();
  });

  it('selects multiple performances and deduplicates their songs', async () => {
    const onSelectPerformance = vi.fn();
    const onOpenChange = vi.fn();
    const user = userEvent.setup();

    await render(
      <PerformancePickerForSortDialog
        open
        onOpenChange={onOpenChange}
        onSelectPerformance={onSelectPerformance}
      />
    );

    await user.click(screen.getAllByText('Show details')[0]);
    await user.click(screen.getByLabelText('Latest Live - Day 1'));
    await user.click(screen.getByLabelText('Latest Live - Day 2'));

    expect(await screen.findByText('3 songs (deduplicated)')).toBeInTheDocument();

    await user.click(screen.getByText('Confirm'));

    expect(onSelectPerformance).toHaveBeenCalledWith(
      ['1', '3', '4'],
      expect.objectContaining({
        performanceIds: ['perf-1', 'perf-2'],
        selectionLabel: 'Latest Live (2 performances)'
      })
    );
    expect(onOpenChange).toHaveBeenCalledWith({ open: false });
  });

  it('selects a leg and includes every performance in that leg', async () => {
    const onSelectPerformance = vi.fn();
    const user = userEvent.setup();

    await render(
      <PerformancePickerForSortDialog
        open
        onOpenChange={vi.fn()}
        onSelectPerformance={onSelectPerformance}
      />
    );

    await user.click(screen.getAllByText('Show details')[1]);
    await user.click(screen.getByLabelText('Tour Live - Osaka'));
    await user.click(screen.getByText('Confirm'));

    expect(onSelectPerformance).toHaveBeenCalledWith(
      ['5', '6'],
      expect.objectContaining({
        performanceIds: ['perf-3', 'perf-4'],
        selectionLabel: 'Tour Live - Osaka (2 performances)'
      })
    );
  });
});
