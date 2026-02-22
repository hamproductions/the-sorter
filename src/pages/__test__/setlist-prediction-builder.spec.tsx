import '@testing-library/jest-dom/vitest';

import { describe, it, vi, expect } from 'vitest';
import { render } from '../../__test__/utils';
import { Page } from '../setlist-prediction/builder/+Page';

// Mock dependencies
vi.mock('~/hooks/setlist-prediction/usePerformanceData', () => ({
  usePerformance: () => ({
    id: 'perf-1',
    tourName: 'Test Performance',
    date: '2025-01-01',
    venue: 'Test Venue',
    seriesIds: ['series-1'],
    status: 'upcoming',
    artistIds: [],
    source: 'llfans',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }),
  usePerformanceData: () => ({ performances: [], loading: false, error: null })
}));

vi.mock('~/hooks/setlist-prediction/usePredictionStorage', () => ({
  usePredictionStorage: () => ({
    savePrediction: vi.fn(),
    getPrediction: vi.fn(),
    deletePrediction: vi.fn(),
    predictions: [],
    predictionsById: {}
  })
}));

vi.mock('~/hooks/useSongData', () => ({
  useSongData: () => []
}));

vi.mock('~/hooks/setlist-prediction/usePredictionBuilder', () => ({
  usePredictionBuilder: () => ({
    prediction: {
      id: 'pred-1',
      name: 'Test Prediction',
      performanceId: 'perf-1',
      setlist: {
        items: [],
        totalSongs: 0
      },
      updatedAt: new Date().toISOString()
    },
    isDirty: false,
    addSong: vi.fn(),
    addNonSongItem: vi.fn(),
    removeItem: vi.fn(),
    updateItem: vi.fn(),
    reorderItems: vi.fn(),
    clearItems: vi.fn(),
    updateMetadata: vi.fn(),
    setPerformanceId: vi.fn(),
    save: vi.fn()
  })
}));

describe('Setlist Prediction Builder Page', () => {
  it('Renders', async () => {
    // Mock URL param for performance
    const url = '/?performance=perf-1';
    window.history.pushState({}, 'Test Page', url);

    const [{ findAllByText }] = await render(<Page />, { skipLanguageCheck: true });

    // Check for text that should appear when a performance is selected
    const titles = await findAllByText('Test Performance');
    expect(titles.length).toBeGreaterThan(0);
  });
});
