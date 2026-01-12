import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '~/__test__/utils';
import type { SetlistPrediction } from '~/types/setlist-prediction';

// Store mock return values that can be modified per test
let mockPrediction: SetlistPrediction | null = null;
let mockPerformance: ReturnType<typeof createMockPerformance> | null = null;

const createMockPerformance = () => ({
  id: 'perf-1',
  name: 'Test Performance',
  date: '2025-01-01',
  seriesIds: [],
  status: 'completed' as const,
  hasSetlist: true
});

// Mock usePageContext
vi.mock('vike-react/usePageContext', () => ({
  usePageContext: () => ({
    routeParams: { prediction: 'test-pred-id' }
  })
}));

// Mock song data
vi.mock('~/hooks/useSongData', () => ({
  useSongData: () => [
    { id: 'song-1', name: 'Song One', artists: [{ id: 'artist-1' }] },
    { id: 'song-2', name: 'Song Two', artists: [{ id: 'artist-1' }] },
    { id: 'song-3', name: 'Song Three', artists: [{ id: 'artist-1' }] }
  ]
}));

// Mock artists data
vi.mock('../../../../../data/artists-info.json', () => ({
  default: [{ id: 'artist-1', name: 'Test Artist' }]
}));

// Mock prediction storage - uses the mockPrediction variable
vi.mock('~/hooks/setlist-prediction/usePredictionStorage', () => ({
  usePredictionStorage: () => ({
    getPrediction: () => mockPrediction,
    savePrediction: vi.fn()
  })
}));

// Mock performance data hooks
vi.mock('~/hooks/setlist-prediction/usePerformanceData', () => ({
  usePerformance: () => mockPerformance,
  usePerformanceSetlist: () => ({ setlist: null })
}));

// Helper to create a mock prediction
const createMockPrediction = (overrides?: Partial<SetlistPrediction>): SetlistPrediction => ({
  id: 'test-pred-id',
  performanceId: 'perf-1',
  name: 'Test Prediction',
  setlist: {
    id: 'setlist-1',
    performanceId: 'perf-1',
    items: [
      { id: 'pred-item-1', type: 'song', songId: 'song-1', position: 0 },
      { id: 'pred-item-2', type: 'song', songId: 'song-2', position: 1 },
      { id: 'pred-item-3', type: 'mc', title: 'MC Talk', position: 2 }
    ],
    sections: []
  },
  createdAt: '2025-01-01',
  updatedAt: '2025-01-01',
  ...overrides
});

// Import Page component after mocks are set up
import { Page } from '../@prediction/+Page';

describe('Marking Mode Page', () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockPrediction = null;
    mockPerformance = createMockPerformance();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Edge cases - Missing data', () => {
    it('shows "Prediction not found" when prediction does not exist', async () => {
      mockPrediction = null;

      await render(<Page />);

      expect(screen.getByText('Prediction not found')).toBeInTheDocument();
    });

    it('shows import section when actual setlist does not exist', async () => {
      mockPrediction = createMockPrediction();

      await render(<Page />);

      expect(screen.getByText('Import Actual Setlist')).toBeInTheDocument();
    });

    it('shows parse setlist button when no actual setlist', async () => {
      mockPrediction = createMockPrediction();

      await render(<Page />);

      expect(screen.getByText('Parse Setlist')).toBeInTheDocument();
    });
  });

  describe('Basic rendering', () => {
    it('renders the marking mode header', async () => {
      mockPrediction = createMockPrediction();

      await render(<Page />);

      expect(screen.getByText('Marking Mode')).toBeInTheDocument();
    });

    it('displays performance info when available', async () => {
      mockPrediction = createMockPrediction();
      mockPerformance = createMockPerformance();

      await render(<Page />);

      expect(screen.getByText(/Test Performance/)).toBeInTheDocument();
      expect(screen.getByText(/Song One/)).toBeInTheDocument();
    });

    it('displays performance date when available', async () => {
      mockPrediction = createMockPrediction();
      mockPerformance = createMockPerformance();

      await render(<Page />);

      // Date should be formatted and displayed (format depends on locale)
      // Just check that the performance info section is rendered
      expect(screen.getByText(/Test Performance/)).toBeInTheDocument();
      expect(screen.getByText(/2025/)).toBeInTheDocument();
    });
  });

  describe('Textarea for importing setlist', () => {
    it('renders textarea for pasting actual setlist', async () => {
      mockPrediction = createMockPrediction();

      await render(<Page />);

      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeInTheDocument();
    });
  });
});
