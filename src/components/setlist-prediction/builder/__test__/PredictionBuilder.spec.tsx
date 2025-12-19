import { describe, expect, it, vi, beforeEach } from 'vitest';
import { PredictionBuilder } from '../PredictionBuilder';
import { render, screen, fireEvent } from '~/__test__/utils';

// Mock dependencies
vi.mock('@dnd-kit/core', async () => {
  const actual = await vi.importActual('@dnd-kit/core');
  return {
    ...actual,

    DndContext: ({ children }: any) => <div>{children}</div>,

    DragOverlay: ({ children }: any) => <div>{children}</div>,
    useSensors: () => {},
    useSensor: () => {},
    PointerSensor: {},
    TouchSensor: {},
    KeyboardSensor: {}
  };
});

vi.mock('../SongSearchPanel', () => ({
  SongSearchPanel: ({ onAddSong }: any) => (
    <div data-testid="song-search-panel">
      <button onClick={() => onAddSong('1', 'Test Song')}>Add Test Song</button>
    </div>
  )
}));

vi.mock('../SetlistEditorPanel', () => ({
  SetlistEditorPanel: ({ items, onRemove }: any) => (
    <div data-testid="setlist-editor-panel">
      {}
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
  ImportDialog: ({ open, onImport }: any) =>
    open ? (
      <div data-testid="import-dialog">
        <button
          onClick={() =>
            onImport({
              name: 'Imported Prediction',
              setlist: { items: [] }
            })
          }
        >
          Confirm Import
        </button>
      </div>
    ) : null
}));

vi.mock('~/hooks/setlist-prediction/usePredictionBuilder', () => ({
  usePredictionBuilder: ({ initialPrediction, onSave }: any) => {
    const prediction = initialPrediction || {
      name: '',
      setlist: { items: [] }
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
