import '@testing-library/jest-dom/vitest';

import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render } from '../../__test__/utils';

describe('Layout', () => {
  const user = userEvent.setup();

  it('Renders', async () => {
    const { findByText } = render(<></>);
    expect(await findByText('ハムP')).toBeInTheDocument();
  });

  describe('Language Switch', () => {
    it('Render in English', async () => {
      const { findByText } = render(<></>);
      expect(await findByText('Check out source code on')).toBeInTheDocument();
    });

    it('Change language to Japanese', async () => {
      const { findByText, findAllByText } = render(<></>);
      await user.click((await findAllByText('日本語'))[0]);
      expect(await findByText('ソースコードをチェックしてみてね')).toBeInTheDocument();
    });
  });
});
