import '@testing-library/jest-dom/vitest';

import { describe, expect, it, vi } from 'vitest';
import { fireEvent } from '@testing-library/react';
import { render } from '../../__test__/utils';
import { Page } from '../setlist-prediction/+Page';

// Mock the hook using vi.mock with alias
vi.mock('~/hooks/setlist-prediction/usePerformanceData', () => ({
  useFilteredPerformances: () => {
    return {
      performances: [
        {
          id: 'perf-1',
          tourName: 'Test Performance',
          date: '2025-01-01',
          seriesIds: ['series-1'],
          status: 'upcoming',
          performanceName: 'Day 1',
          venue: 'Test Venue',
          description: 'Test Description',
          tags: ['Tag1'],
          artistIds: [],
          source: 'llfans',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
      filteredCount: 1,
      totalCount: 1
    };
  },
  usePerformanceData: () => ({ performances: [], loading: false, error: null }),
  usePerformance: () => null,
  usePerformanceSearch: () => ({ results: [], query: '' })
}));

describe('Setlist Prediction Page', () => {
  it('Renders', async () => {
    const [{ findAllByText, findByText }] = await render(<Page />);
    const titles = await findAllByText('Setlist Prediction');
    expect(titles.length).toBeGreaterThan(0);
    expect(
      await findByText(
        'Fantasy football for Love Live! setlists - Predict performances and compete with friends!'
      )
    ).toBeInTheDocument();
  });

  it('Displays performances', async () => {
    const [{ findByText }] = await render(<Page />);
    expect(await findByText('Day 1')).toBeInTheDocument();
    expect(await findByText(/Test Venue/)).toBeInTheDocument();
  });

  it('Search filter interaction', async () => {
    const [{ findByPlaceholderText }] = await render(<Page />);
    const searchInput = await findByPlaceholderText('Search performances, venues...');
    fireEvent.change(searchInput, { target: { value: 'Test' } });
    expect(searchInput).toHaveValue('Test');

    // Since we mocked the hook to return static data, the list won't actually filter in this test unless we make the mock dynamic or test the hook separately.
    // But we can verify the interaction works without crashing.
  });

  it('Hide completed toggle', async () => {
    const [{ findByText }] = await render(<Page />);
    const label = await findByText(/Hide ended events/i);
    fireEvent.click(label);
    // Verify state change if possible, or just no crash
  });
});
