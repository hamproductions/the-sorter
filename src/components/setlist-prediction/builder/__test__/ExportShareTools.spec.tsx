import { describe, expect, it, vi } from 'vitest';
import { ExportShareTools } from '../ExportShareTools';
import { render, screen, fireEvent } from '~/__test__/utils';
import type { SetlistPrediction } from '~/types/setlist-prediction';

// Mock dependencies
vi.mock('modern-screenshot', () => ({
  domToPng: vi.fn().mockResolvedValue('data:image/png;base64,fake-data')
}));

vi.mock('~/utils/setlist-prediction/compression', () => ({
  generateShareUrl: vi.fn().mockReturnValue('https://example.com/share'),
  canShareUrl: vi.fn().mockReturnValue(true),
  estimateShareUrlSize: vi.fn().mockReturnValue({ compressed: 100 })
}));

vi.mock('~/utils/setlist-prediction/export', () => ({
  downloadJSON: vi.fn(),
  downloadCSV: vi.fn(),
  copyTextToClipboard: vi.fn().mockResolvedValue(undefined)
}));

vi.mock('~/components/setlist-prediction/SetlistView', () => ({
  SetlistView: () => <div data-testid="setlist-view">Setlist View</div>
}));

// Mock window.getComputedStyle
Object.defineProperty(window, 'getComputedStyle', {
  value: vi.fn().mockReturnValue({ backgroundColor: 'white' })
});

describe('ExportShareTools', () => {
  const mockPrediction: SetlistPrediction = {
    id: 'pred-1',
    performanceId: 'perf-1',
    name: 'Test Prediction',
    setlist: { id: 'setlist-1', items: [], sections: [], performanceId: 'perf-1' },
    createdAt: '2023-01-01',
    updatedAt: '2023-01-01'
  };

  const defaultProps = {
    prediction: mockPrediction
  };

  it('renders correctly', async () => {
    await render(<ExportShareTools {...defaultProps} />);

    expect(screen.getByText('Export & Share')).toBeInTheDocument();
    expect(screen.getByText('Share URL')).toBeInTheDocument();
  });

  it('handles share URL', async () => {
    await render(<ExportShareTools {...defaultProps} />);

    // Ensure clipboard exists (userEvent should have set it up, or we mock it if missing)
    if (!navigator.clipboard) {
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: vi.fn().mockResolvedValue(undefined) },
        writable: true
      });
    }

    const writeTextSpy = vi.spyOn(navigator.clipboard, 'writeText');

    const shareButton = screen.getByText('Share URL');
    fireEvent.click(shareButton);

    // Wait for async action
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(writeTextSpy).toHaveBeenCalledWith('https://example.com/share');
  });

  it('handles copy text', async () => {
    const { copyTextToClipboard } = await import('~/utils/setlist-prediction/export');

    await render(<ExportShareTools {...defaultProps} />);

    const copyButton = screen.getByText('Copy as Text');
    fireEvent.click(copyButton);

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(copyTextToClipboard).toHaveBeenCalled();
  });

  it('handles download JSON', async () => {
    const { downloadJSON } = await import('~/utils/setlist-prediction/export');

    await render(<ExportShareTools {...defaultProps} />);

    const jsonButton = screen.getByText('Export JSON');
    fireEvent.click(jsonButton);

    expect(downloadJSON).toHaveBeenCalledWith(mockPrediction);
  });

  it('handles download CSV', async () => {
    const { downloadCSV } = await import('~/utils/setlist-prediction/export');

    await render(<ExportShareTools {...defaultProps} />);

    const csvButton = screen.getByText('Export CSV');
    fireEvent.click(csvButton);

    expect(downloadCSV).toHaveBeenCalledWith(mockPrediction);
  });

  it('handles export image', async () => {
    const { domToPng } = await import('modern-screenshot');

    await render(<ExportShareTools {...defaultProps} />);

    const imageButton = screen.getByText('Export Image');
    fireEvent.click(imageButton);

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(domToPng).toHaveBeenCalled();
  });

  it('updates author name', async () => {
    await render(<ExportShareTools {...defaultProps} />);

    const input = screen.getByPlaceholderText('Enter your name...');
    fireEvent.change(input, { target: { value: 'Test Author' } });

    expect(input).toHaveValue('Test Author');
  });
});
