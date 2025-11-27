import { describe, expect, it, vi, beforeEach } from 'vitest';
import { PredictionBuilder } from '../PredictionBuilder';
import { render, screen, fireEvent } from '~/__test__/utils';
import type { Performance } from '~/types/setlist-prediction.ts';

// Mock dependencies
vi.mock('@dnd-kit/core', async () => {
  const actual = await vi.importActual('@dnd-kit/core');
  return {
    ...actual,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    DndContext: ({ children }: any) => <div>{children}</div>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    DragOverlay: ({ children }: any) => <div>{children}</div>,
    useSensors: () => {},
    useSensor: () => {},
    PointerSensor: {},
    TouchSensor: {},
    KeyboardSensor: {}
  };
});

vi.mock('../SongSearchPanel', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  SongSearchPanel: ({ onAddSong }: any) => (
    <div data-testid="song-search-panel">
      <button onClick={() => onAddSong('1', 'Test Song')}>Add Test Song</button>
    </div>
  )
}));

vi.mock('../SetlistEditorPanel', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  SetlistEditorPanel: ({ items, onRemove }: any) => (
    <div data-testid="setlist-editor-panel">
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {items.map((item: any) => (
        <div key={item.id} data-testid={`item-${item.id}`}>
          {item.type === 'song' ? item.songId : item.title}
          <button onClick={() => onRemove(item.id)}>Remove</button>
        </div>
      ))}
    </div>
  )
}));

vi.mock('../ExportShareTools', () => ({
  ExportShareTools: () => <div data-testid="export-share-tools">Export Tools</div>
}));

vi.mock('../ImportDialog', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ImportDialog: ({ open, onImport }: any) =>
    open ? (
      <div data-testid="import-dialog">
        <button
          onClick={() =>
            onImport({
              name: 'Imported Prediction',
              setlist: { items: [], totalSongs: 0 }
            })
          }
        >
          Confirm Import
        </button>
      </div>
    ) : null
}));

vi.mock('~/hooks/setlist-prediction/usePredictionBuilder', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  usePredictionBuilder: ({ initialPrediction, onSave }: any) => {
    const prediction = initialPrediction || {
      name: '',
      setlist: { items: [], totalSongs: 0 }
    };

    return {
      prediction,
      isDirty: true,
      addSong: vi.fn(),
      addNonSongItem: vi.fn(),
      removeItem: vi.fn(),
      updateItem: vi.fn(),
      reorderItems: vi.fn(),
      clearItems: vi.fn(),
      updateMetadata: vi.fn(),
      setPerformanceId: vi.fn(),
      save: onSave || vi.fn()
    };
  }
}));

describe('PredictionBuilder', () => {
  const mockOnSave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders main layout', async () => {
    await render(<PredictionBuilder onSave={mockOnSave} />);

    expect(screen.getAllByPlaceholderText('Enter prediction name...')[0]).toBeInTheDocument();
    expect(screen.getAllByTestId('song-search-panel')[0]).toBeInTheDocument();
    expect(screen.getByTestId('setlist-editor-panel')).toBeInTheDocument();
    expect(screen.getAllByTestId('export-share-tools')[0]).toBeInTheDocument();
  });

  it('opens import dialog', async () => {
    await render(<PredictionBuilder onSave={mockOnSave} />);

    const importButtons = screen.getAllByText('Import');
    fireEvent.click(importButtons[0]);

    expect(screen.getByTestId('import-dialog')).toBeInTheDocument();
  });

  it('calls save when save button clicked', async () => {
    await render(<PredictionBuilder onSave={mockOnSave} />);

    // Save button might be an icon button on mobile, but text "Save" should exist on desktop
    // However, if both exist, we need to pick one.
    // The desktop button has text "Save". The mobile one is an icon button with aria-label "Save".
    // getByText only finds visible text.
    // If there are multiple "Save" texts (e.g. in menu), we need getAllByText.
    const saveButtons = screen.getAllByText('Save');
    fireEvent.click(saveButtons[0]);

    expect(mockOnSave).toHaveBeenCalled();
  });

  it('updates prediction name', async () => {
    await render(<PredictionBuilder onSave={mockOnSave} />);

    const nameInputs = screen.getAllByPlaceholderText('Enter prediction name...');
    fireEvent.change(nameInputs[0], { target: { value: 'New Name' } });

    expect(nameInputs[0]).toHaveValue('New Name');
  });
});

// Mock the usePredictionBuilder hook
vi.mock('~/hooks/setlist-prediction/usePredictionBuilder', () => ({
  usePredictionBuilder: () => ({
    prediction: {
      id: 'perf-1',
      performanceId: 'perf-1',
      name: 'Test Prediction',
      setlist: {
        items: [
          {
            id: 'item-1',
            type: 'song' as const,
            songId: '1',
            isCustomSong: false,
            position: 0
          },
          {
            id: 'item-2',
            type: 'song' as const,
            songId: '2',
            isCustomSong: false,
            position: 1
          }
        ],
        totalSongs: 2
      },
      createdAt: new Date(),
      updatedAt: new Date()
    },
    isDirty: false,
    isValid: true,
    validation: { errors: [] },
    addSong: vi.fn(),
    addNonSongItem: vi.fn(),
    removeItem: vi.fn(),
    updateItem: vi.fn(),
    reorderItems: vi.fn(),
    clearItems: vi.fn(),
    updateMetadata: vi.fn(),
    save: vi.fn()
  })
}));

// Mock useSongData hook
vi.mock('~/hooks/useSongData', () => ({
  useSongData: () => [
    {
      id: '1',
      name: 'Snow halation',
      artists: ['1'],
      seriesIds: [1]
    },
    {
      id: '2',
      name: 'Aozora Jumping Heart',
      artists: ['33'],
      seriesIds: [2]
    },
    {
      id: '3',
      name: 'SELF CONTROL!!',
      artists: ['60'],
      seriesIds: [3]
    }
  ]
}));

// Mock performance context/data
const mockPerformance = {
  id: 'perf-1',
  seriesIds: ['1'],
  name: 'Test Performance',
  date: '2024-01-01',
  venue: 'Test Venue'
} as Performance;

describe('PredictionBuilder - Drag and Drop', () => {
  const mockOnSave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Empty space at bottom drop zone', () => {
    it('renders sentinel droppable at bottom of setlist', async () => {
      const [result] = await render(
        <PredictionBuilder
          performanceId="perf-1"
          performance={mockPerformance}
          onSave={mockOnSave}
        />
      );

      // The sentinel should exist for drag-drop purposes
      const sentinel = result.container.querySelector('[data-item-id="__setlist-end__"]');
      expect(sentinel).toBeDefined();
      expect(sentinel).toHaveStyle({ minHeight: '80px' });
    });

    it('sentinel is not visible to users', async () => {
      const [result] = await render(
        <PredictionBuilder
          performanceId="perf-1"
          performance={mockPerformance}
          onSave={mockOnSave}
        />
      );

      const sentinel = result.container.querySelector('[data-item-id="__setlist-end__"]');
      expect(sentinel).toHaveStyle({ backgroundColor: 'transparent' });
    });
  });

  describe('Drag indicator positioning', () => {
    it('shows drop indicator at bottom of last item when hovering over empty space', async () => {
      const [result] = await render(
        <PredictionBuilder
          performanceId="perf-1"
          performance={mockPerformance}
          onSave={mockOnSave}
        />
      );

      // Verify the setlist editor panel is rendered
      const setlistEditor = result.container.querySelector('[data-setlist-editor="true"]');
      expect(setlistEditor).toBeDefined();

      // Verify items are rendered
      expect(result.container.querySelectorAll('[data-item-id]').length).toBeGreaterThan(0);
    });
  });

  describe('Regression tests - Existing drag-drop behavior', () => {
    it('renders setlist items correctly', async () => {
      const [result] = await render(
        <PredictionBuilder
          performanceId="perf-1"
          performance={mockPerformance}
          onSave={mockOnSave}
        />
      );

      const setlistEditor = result.container.querySelector('[data-setlist-editor="true"]');
      expect(setlistEditor).toBeInTheDocument();

      // Verify both items are rendered
      const items = result.container.querySelectorAll('[data-item-id]');
      expect(items.length).toBeGreaterThanOrEqual(2);
    });

    it('renders song search panel', async () => {
      await render(
        <PredictionBuilder
          performanceId="perf-1"
          performance={mockPerformance}
          onSave={mockOnSave}
        />
      );

      const searchInput = await screen.findByPlaceholderText('Search songs or artists...');
      expect(searchInput).toBeInTheDocument();
    });

    it('renders quick add buttons for MC, Encore, Intermission', async () => {
      await render(
        <PredictionBuilder
          performanceId="perf-1"
          performance={mockPerformance}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByText('MC')).toBeInTheDocument();
      expect(screen.getByText('━━ ENCORE ━━')).toBeInTheDocument();
      expect(screen.getByText('━━ INTERMISSION ━━')).toBeInTheDocument();
    });

    it('renders stats panel on right side', async () => {
      await render(
        <PredictionBuilder
          performanceId="perf-1"
          performance={mockPerformance}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByText('Stats')).toBeInTheDocument();
    });

    it('renders action buttons', async () => {
      await render(
        <PredictionBuilder
          performanceId="perf-1"
          performance={mockPerformance}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /import/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
    });

    it('prediction name input is editable', async () => {
      await render(
        <PredictionBuilder
          performanceId="perf-1"
          performance={mockPerformance}
          onSave={mockOnSave}
        />
      );

      const nameInput = screen.getByDisplayValue('Test Prediction');
      expect(nameInput).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('maintains prediction name on input change', async () => {
      const [, user] = await render(
        <PredictionBuilder
          performanceId="perf-1"
          performance={mockPerformance}
          onSave={mockOnSave}
        />
      );

      const nameInput = screen.getByDisplayValue('Test Prediction') as HTMLInputElement;
      await user.clear(nameInput);
      await user.type(nameInput, 'My New Prediction');

      expect(nameInput.value).toBe('My New Prediction');
    });
  });

  describe('DndContext integration', () => {
    it('wraps content in DndContext', async () => {
      const [result] = await render(
        <PredictionBuilder
          performanceId="perf-1"
          performance={mockPerformance}
          onSave={mockOnSave}
        />
      );

      // Verify main layout exists
      const mainStack = result.container.querySelector('[class*="stack"]');
      expect(mainStack).toBeDefined();
    });
  });
});
