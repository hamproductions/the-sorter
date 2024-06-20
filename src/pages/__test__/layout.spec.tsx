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
      const { findByText } = render(<></>);
      await user.click(await findByText('日本語'));
      expect(await findByText('ソースコードをチェックしてみてね')).toBeInTheDocument();
    });
  });

  describe('Color Mode Switch', () => {
    it('Dark Mode', async () => {
      const { findByLabelText, container } = render(<></>);
      await user.click(await findByLabelText('Toggle Color Mode'));
      expect(container.parentElement?.parentElement).toHaveClass('dark');
      await user.click(await findByLabelText('Toggle Color Mode'));
      expect(container.parentElement?.parentElement).not.toHaveClass('dark');
    });
  });
});
