import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SaveSlotManager } from '../SaveSlotManager';
import * as useSaveSlotsHook from '~/hooks/setlist-prediction/useSaveSlots';
import * as usePredictionStorageHook from '~/hooks/setlist-prediction/usePredictionStorage';

// Mock hooks
vi.mock('~/hooks/setlist-prediction/useSaveSlots');
vi.mock('~/hooks/setlist-prediction/usePredictionStorage');
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    t: (key: string, options?: any) => options?.defaultValue || key
  })
}));

describe('SaveSlotManager', () => {
  const mockGetSlotForPerformance = vi.fn();
  const mockGetPredictionsForPerformance = vi.fn();
  const mockDeletePrediction = vi.fn();
  const mockSetActivePrediction = vi.fn();
  const mockOnSelectPrediction = vi.fn();
  const mockOnCreateNew = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (useSaveSlotsHook.useSaveSlots as any).mockReturnValue({
      getSlotForPerformance: mockGetSlotForPerformance
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (usePredictionStorageHook.usePredictionStorage as any).mockReturnValue({
      getPredictionsForPerformance: mockGetPredictionsForPerformance,
      deletePrediction: mockDeletePrediction,
      activePredictionId: null,
      setActivePrediction: mockSetActivePrediction
    });

    mockGetSlotForPerformance.mockReturnValue({ slot: 1 });
    mockGetPredictionsForPerformance.mockReturnValue([]);
  });

  it('renders empty state correctly', () => {
    render(
      <SaveSlotManager
        performanceId="perf-1"
        onSelectPrediction={mockOnSelectPrediction}
        onCreateNew={mockOnCreateNew}
      />
    );

    expect(screen.getByText('Saved Predictions')).toBeInTheDocument();
    expect(screen.getByText('No predictions yet')).toBeInTheDocument();
    expect(screen.getByText('+ New')).toBeInTheDocument();
  });

  it('renders list of predictions', () => {
    const predictions = [
      {
        id: 'pred-1',
        name: 'Prediction 1',
        setlist: { totalSongs: 10 },
        updatedAt: '2023-01-01T00:00:00Z',
        isFavorite: false
      },
      {
        id: 'pred-2',
        name: 'Prediction 2',
        setlist: { totalSongs: 15 },
        updatedAt: '2023-01-02T00:00:00Z',
        isFavorite: true
      }
    ];
    mockGetPredictionsForPerformance.mockReturnValue(predictions);

    render(
      <SaveSlotManager
        performanceId="perf-1"
        onSelectPrediction={mockOnSelectPrediction}
        onCreateNew={mockOnCreateNew}
      />
    );

    expect(screen.getByText('Prediction 1')).toBeInTheDocument();
    expect(screen.getByText('Prediction 2')).toBeInTheDocument();
    expect(screen.getByText(/10 songs/)).toBeInTheDocument();
    expect(screen.getByText(/15 songs/)).toBeInTheDocument();
  });

  it('calls onSelectPrediction when a prediction is clicked', () => {
    const predictions = [
      {
        id: 'pred-1',
        name: 'Prediction 1',
        setlist: { totalSongs: 10 },
        updatedAt: '2023-01-01T00:00:00Z'
      }
    ];
    mockGetPredictionsForPerformance.mockReturnValue(predictions);

    render(
      <SaveSlotManager
        performanceId="perf-1"
        onSelectPrediction={mockOnSelectPrediction}
        onCreateNew={mockOnCreateNew}
      />
    );

    fireEvent.click(screen.getByText('Prediction 1'));

    expect(mockSetActivePrediction).toHaveBeenCalledWith('pred-1');
    expect(mockOnSelectPrediction).toHaveBeenCalledWith('pred-1');
  });

  it('calls onCreateNew when New button is clicked', () => {
    render(
      <SaveSlotManager
        performanceId="perf-1"
        onSelectPrediction={mockOnSelectPrediction}
        onCreateNew={mockOnCreateNew}
      />
    );

    fireEvent.click(screen.getByText('+ New'));
    expect(mockOnCreateNew).toHaveBeenCalled();
  });

  it('deletes prediction when confirmed', () => {
    const predictions = [
      {
        id: 'pred-1',
        name: 'Prediction 1',
        setlist: { totalSongs: 10 },
        updatedAt: '2023-01-01T00:00:00Z'
      }
    ];
    mockGetPredictionsForPerformance.mockReturnValue(predictions);

    // Mock window.confirm
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(
      <SaveSlotManager
        performanceId="perf-1"
        onSelectPrediction={mockOnSelectPrediction}
        onCreateNew={mockOnCreateNew}
      />
    );

    const deleteButtons = screen.getAllByLabelText('Delete');
    fireEvent.click(deleteButtons[0]);

    expect(confirmSpy).toHaveBeenCalled();
    expect(mockDeletePrediction).toHaveBeenCalledWith('pred-1');

    confirmSpy.mockRestore();
  });

  it('does not delete prediction when cancelled', () => {
    const predictions = [
      {
        id: 'pred-1',
        name: 'Prediction 1',
        setlist: { totalSongs: 10 },
        updatedAt: '2023-01-01T00:00:00Z'
      }
    ];
    mockGetPredictionsForPerformance.mockReturnValue(predictions);

    // Mock window.confirm
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(
      <SaveSlotManager
        performanceId="perf-1"
        onSelectPrediction={mockOnSelectPrediction}
        onCreateNew={mockOnCreateNew}
      />
    );

    const deleteButtons = screen.getAllByLabelText('Delete');
    fireEvent.click(deleteButtons[0]);

    expect(confirmSpy).toHaveBeenCalled();
    expect(mockDeletePrediction).not.toHaveBeenCalled();

    confirmSpy.mockRestore();
  });
});
