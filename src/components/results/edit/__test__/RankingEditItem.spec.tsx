import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { RankingEditItem } from '../RankingEditItem';

describe('RankingEditItem', () => {
  it('renders without crashing', () => {
    const { container } = render(<RankingEditItem />);
    expect(container).toBeEmptyDOMElement();
  });
});
