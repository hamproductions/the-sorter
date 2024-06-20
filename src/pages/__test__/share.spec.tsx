import '@testing-library/jest-dom/vitest';

import { describe, expect, it } from 'vitest';
import { render } from '../../__test__/utils';
import { Page } from '../share/+Page';

describe('Shared Page', () => {
  it('Renders', async () => {
    const { findByText } = render(<Page />);
    expect(await findByText('LoveLive! Sorter')).toBeInTheDocument();
  });
});
