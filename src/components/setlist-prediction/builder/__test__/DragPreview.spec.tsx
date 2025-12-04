import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { DragPreview } from '../DragPreview';

describe('DragPreview', () => {
  it('returns null when activeData is null', () => {
    const { container } = render(<DragPreview activeData={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders song name and artist', () => {
    const activeData = {
      songName: 'Test Song',
      artist: 'Test Artist'
    };
    render(<DragPreview activeData={activeData} />);
    expect(screen.getByText('Test Song')).toBeInTheDocument();
    expect(screen.getByText('Test Artist')).toBeInTheDocument();
  });

  it('renders title from title prop if songName missing', () => {
    const activeData = {
      title: 'Test Title'
    };
    render(<DragPreview activeData={activeData} />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('renders default title if no name provided', () => {
    const activeData = {};
    render(<DragPreview activeData={activeData} />);
    expect(screen.getByText('Item')).toBeInTheDocument();
  });
});
