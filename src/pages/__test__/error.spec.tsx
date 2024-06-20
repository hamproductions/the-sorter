import '@testing-library/jest-dom/vitest';

import { describe, expect, it } from 'vitest';
import { render } from '../../__test__/utils';
import { Page } from '../_error/+Page';

describe('Shared Page', () => {
  it('Renders', async () => {
    const [{ findByText }] = await render(<Page />);
    expect(
      await findByText("Something went wrong lah, you shouldn't be here.")
    ).toBeInTheDocument();
  });
});
