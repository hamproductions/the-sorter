import { describe, expect, it, vi, beforeEach } from 'vitest';
import { LoadPredictionDialog } from '../LoadPredictionDialog';
import { render, screen, fireEvent, waitFor } from '~/__test__/utils';
import type { SetlistPrediction, Performance } from '~/types/setlist-prediction';

// Mock state that can be modified per test
const mockState = {
  predictions: [] as SetlistPrediction[],
  predictionsReady: true,
  performancesLoading: false,
  performancesMap: {} as Record<string, Performance>
};

vi.mock('~/hooks/setlist-prediction/usePredictionStorage', () => ({
  usePredictionStorage: () => ({
    predictions: mockState.predictions,
    ready: mockState.predictionsReady
  })
}));

vi.mock('~/hooks/setlist-prediction/usePerformanceData', () => ({
  usePerformanceData: () => ({
    loading: mockState.performancesLoading,
    performances: Object.values(mockState.performancesMap)
  }),
  usePerformance: (id: string | undefined) => (id ? mockState.performancesMap[id] : undefined)
}));

describe('LoadPredictionDialog', () => {
  const mockOnOpenChange = vi.fn();
  const mockOnSelectLoadPrediction = vi.fn();
  const mockOnSelectScorePrediction = vi.fn();
  const mockOnDeletePrediction = vi.fn();

  const basePrediction: SetlistPrediction = {
    id: 'pred-1',
    performanceId: 'perf-1',
    name: 'Test Prediction',
    setlist: {
      id: 'setlist-1',
      performanceId: 'perf-1',
      items: [{ id: 'item-1', type: 'song', songId: 'song-1', position: 0 }],
      sections: []
    },
    createdAt: '2023-01-01',
    updatedAt: '2023-01-01'
  };

  const performanceWithSetlist: Performance = {
    id: 'perf-1',
    name: 'Test Performance',
    date: '2023-01-01',
    venue: 'Test Venue',
    seriesIds: [],
    artistIds: [],
    source: 'llfans',
    status: 'completed',
    hasSetlist: true,
    createdAt: '2023-01-01',
    updatedAt: '2023-01-01'
  };

  const performanceWithoutSetlist: Performance = {
    id: 'perf-2',
    name: 'Upcoming Performance',
    date: '2024-06-01',
    venue: 'Future Venue',
    seriesIds: [],
    artistIds: [],
    source: 'llfans',
    status: 'upcoming',
    hasSetlist: false,
    createdAt: '2023-01-01',
    updatedAt: '2023-01-01'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock state
    mockState.predictions = [];
    mockState.predictionsReady = true;
    mockState.performancesLoading = false;
    mockState.performancesMap = {};
  });

  describe('when there are no predictions', () => {
    it('displays no predictions message', async () => {
      await render(
        <LoadPredictionDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSelectLoadPrediction={mockOnSelectLoadPrediction}
          onSelectScorePrediction={mockOnSelectScorePrediction}
        />
      );

      expect(screen.getByText('No predictions yet')).toBeInTheDocument();
    });

    it('does not show Score button when no predictions exist', async () => {
      await render(
        <LoadPredictionDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSelectLoadPrediction={mockOnSelectLoadPrediction}
          onSelectScorePrediction={mockOnSelectScorePrediction}
        />
      );

      // Score button should not be shown when there are no predictions
      expect(screen.queryByText('Score')).not.toBeInTheDocument();
      // Load button should still be visible but disabled
      expect(screen.getByText('Load')).toBeInTheDocument();
    });
  });

  describe('when performanceId is provided', () => {
    it('filters predictions to only show those matching the performanceId', async () => {
      const predictionForPerf1: SetlistPrediction = {
        ...basePrediction,
        id: 'pred-1',
        performanceId: 'perf-1',
        name: 'Prediction for Perf 1'
      };
      const predictionForPerf2: SetlistPrediction = {
        ...basePrediction,
        id: 'pred-2',
        performanceId: 'perf-2',
        name: 'Prediction for Perf 2'
      };
      mockState.predictions = [predictionForPerf1, predictionForPerf2];
      mockState.performancesMap['perf-1'] = performanceWithSetlist;
      mockState.performancesMap['perf-2'] = performanceWithoutSetlist;

      await render(
        <LoadPredictionDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSelectLoadPrediction={mockOnSelectLoadPrediction}
          onSelectScorePrediction={mockOnSelectScorePrediction}
          performanceId="perf-1"
        />
      );

      expect(screen.getByText('Prediction for Perf 1')).toBeInTheDocument();
      expect(screen.queryByText('Prediction for Perf 2')).not.toBeInTheDocument();
    });

    it('shows no predictions message when performanceId has no matching predictions', async () => {
      const predictionForPerf1: SetlistPrediction = {
        ...basePrediction,
        id: 'pred-1',
        performanceId: 'perf-1',
        name: 'Prediction for Perf 1'
      };
      mockState.predictions = [predictionForPerf1];
      mockState.performancesMap['perf-1'] = performanceWithSetlist;

      await render(
        <LoadPredictionDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSelectLoadPrediction={mockOnSelectLoadPrediction}
          onSelectScorePrediction={mockOnSelectScorePrediction}
          performanceId="perf-nonexistent"
        />
      );

      // Verify that no prediction items are rendered (since filter excludes them)
      expect(screen.queryByText('Prediction for Perf 1')).not.toBeInTheDocument();

      // Wait for the component's internal state to sync and show empty state
      await waitFor(() => {
        expect(screen.getByText(/no predictions yet/i)).toBeInTheDocument();
      });
    });
  });

  describe('when performanceId is not provided', () => {
    it('displays all predictions', async () => {
      const predictionForPerf1: SetlistPrediction = {
        ...basePrediction,
        id: 'pred-1',
        performanceId: 'perf-1',
        name: 'Prediction for Perf 1'
      };
      const predictionForPerf2: SetlistPrediction = {
        ...basePrediction,
        id: 'pred-2',
        performanceId: 'perf-2',
        name: 'Prediction for Perf 2'
      };
      mockState.predictions.push(predictionForPerf1, predictionForPerf2);
      mockState.performancesMap['perf-1'] = performanceWithSetlist;
      mockState.performancesMap['perf-2'] = performanceWithoutSetlist;

      await render(
        <LoadPredictionDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSelectLoadPrediction={mockOnSelectLoadPrediction}
          onSelectScorePrediction={mockOnSelectScorePrediction}
        />
      );

      expect(screen.getByText('Prediction for Perf 1')).toBeInTheDocument();
      expect(screen.getByText('Prediction for Perf 2')).toBeInTheDocument();
    });
  });

  describe('score button behavior', () => {
    it('shows Score Prediction button when selected prediction has a performance with setlist', async () => {
      const prediction: SetlistPrediction = {
        ...basePrediction,
        performanceId: 'perf-1',
        name: 'Test Prediction'
      };
      mockState.predictions.push(prediction);
      mockState.performancesMap['perf-1'] = performanceWithSetlist;

      await render(
        <LoadPredictionDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSelectLoadPrediction={mockOnSelectLoadPrediction}
          onSelectScorePrediction={mockOnSelectScorePrediction}
        />
      );

      // Select the prediction
      fireEvent.click(screen.getByText('Test Prediction'));

      await waitFor(() => {
        expect(screen.getByText('Score')).toBeInTheDocument();
      });
    });

    it('shows disabled ghost button when selected prediction has a performance without setlist', async () => {
      const prediction: SetlistPrediction = {
        ...basePrediction,
        id: 'pred-2',
        performanceId: 'perf-2',
        name: 'Upcoming Prediction'
      };
      mockState.predictions.push(prediction);
      mockState.performancesMap['perf-2'] = performanceWithoutSetlist;

      await render(
        <LoadPredictionDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSelectLoadPrediction={mockOnSelectLoadPrediction}
          onSelectScorePrediction={mockOnSelectScorePrediction}
        />
      );

      // Select the prediction
      fireEvent.click(screen.getByText('Upcoming Prediction'));

      await waitFor(() => {
        expect(screen.getByText('This performance has not occurred yet')).toBeInTheDocument();
      });
      expect(screen.queryByText('Score')).not.toBeInTheDocument();
    });

    it('calls onSelectScorePrediction when Score button is clicked', async () => {
      const prediction: SetlistPrediction = {
        ...basePrediction,
        performanceId: 'perf-1',
        name: 'Test Prediction'
      };
      mockState.predictions.push(prediction);
      mockState.performancesMap['perf-1'] = performanceWithSetlist;

      await render(
        <LoadPredictionDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSelectLoadPrediction={mockOnSelectLoadPrediction}
          onSelectScorePrediction={mockOnSelectScorePrediction}
        />
      );

      // Select the prediction
      fireEvent.click(screen.getByText('Test Prediction'));

      await waitFor(() => {
        expect(screen.getByText('Score')).toBeInTheDocument();
      });

      // Click Score button
      fireEvent.click(screen.getByText('Score'));

      expect(mockOnSelectScorePrediction).toHaveBeenCalledWith(prediction);
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('load button behavior', () => {
    it('Load button is disabled when no prediction is selected', async () => {
      const prediction: SetlistPrediction = {
        ...basePrediction,
        name: 'Test Prediction'
      };
      mockState.predictions.push(prediction);
      mockState.performancesMap['perf-1'] = performanceWithSetlist;

      await render(
        <LoadPredictionDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSelectLoadPrediction={mockOnSelectLoadPrediction}
          onSelectScorePrediction={mockOnSelectScorePrediction}
        />
      );

      const loadButton = screen.getByText('Load');
      expect(loadButton).toBeDisabled();
    });

    it('Load button is enabled when a prediction is selected', async () => {
      const prediction: SetlistPrediction = {
        ...basePrediction,
        name: 'Test Prediction'
      };
      mockState.predictions.push(prediction);
      mockState.performancesMap['perf-1'] = performanceWithSetlist;

      await render(
        <LoadPredictionDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSelectLoadPrediction={mockOnSelectLoadPrediction}
          onSelectScorePrediction={mockOnSelectScorePrediction}
        />
      );

      // Select the prediction
      fireEvent.click(screen.getByText('Test Prediction'));

      const loadButton = screen.getByText('Load');
      expect(loadButton).not.toBeDisabled();
    });

    it('calls onSelectLoadPrediction when Load button is clicked', async () => {
      const prediction: SetlistPrediction = {
        ...basePrediction,
        name: 'Test Prediction'
      };
      mockState.predictions.push(prediction);
      mockState.performancesMap['perf-1'] = performanceWithSetlist;

      await render(
        <LoadPredictionDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSelectLoadPrediction={mockOnSelectLoadPrediction}
          onSelectScorePrediction={mockOnSelectScorePrediction}
        />
      );

      // Select the prediction
      fireEvent.click(screen.getByText('Test Prediction'));

      // Click Load button
      fireEvent.click(screen.getByText('Load'));

      expect(mockOnSelectLoadPrediction).toHaveBeenCalledWith(prediction);
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('delete functionality', () => {
    it('shows delete button when onDeletePrediction is provided', async () => {
      const prediction: SetlistPrediction = {
        ...basePrediction,
        name: 'Test Prediction'
      };
      mockState.predictions.push(prediction);
      mockState.performancesMap['perf-1'] = performanceWithSetlist;

      await render(
        <LoadPredictionDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSelectLoadPrediction={mockOnSelectLoadPrediction}
          onSelectScorePrediction={mockOnSelectScorePrediction}
          onDeletePrediction={mockOnDeletePrediction}
        />
      );

      expect(screen.getByText('✕')).toBeInTheDocument();
    });

    it('calls onDeletePrediction when delete button is clicked', async () => {
      const prediction: SetlistPrediction = {
        ...basePrediction,
        name: 'Test Prediction'
      };
      mockState.predictions.push(prediction);
      mockState.performancesMap['perf-1'] = performanceWithSetlist;

      await render(
        <LoadPredictionDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSelectLoadPrediction={mockOnSelectLoadPrediction}
          onSelectScorePrediction={mockOnSelectScorePrediction}
          onDeletePrediction={mockOnDeletePrediction}
        />
      );

      fireEvent.click(screen.getByText('✕'));

      expect(mockOnDeletePrediction).toHaveBeenCalledWith('pred-1');
    });
  });

  describe('cancel functionality', () => {
    it('renders Cancel button', async () => {
      await render(
        <LoadPredictionDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSelectLoadPrediction={mockOnSelectLoadPrediction}
          onSelectScorePrediction={mockOnSelectScorePrediction}
        />
      );

      // Cancel button should be present and clickable
      // Note: DialogCloseTrigger handles the close action internally via Ark UI
      const cancelButton = screen.getByText('Cancel');
      expect(cancelButton).toBeInTheDocument();
    });
  });
});
