import '@testing-library/jest-dom/vitest';

import { describe, expect, it } from 'vitest';

import userEvent from '@testing-library/user-event';
import { render } from '../../__test__/utils';

describe('Layout', () => {
  const user = userEvent.setup();

  it('Renders', async () => {
    const [{ findByText }] = await render(<></>);
    expect(await findByText('ハムP')).toBeInTheDocument();
  });

  describe('Language Switch', () => {
    it('Render in English', async () => {
      const [{ findByText }] = await render(<></>);
      expect(await findByText('Check out source code on')).toBeInTheDocument();
    });

    it('Change language to Japanese', async () => {
      const [{ queryAllByText, getByText, queryByLabelText, getAllByText }] = await render(<></>);

      let langBtns = queryAllByText('日本語');
      let clicked = false;

      for (const btn of langBtns) {
        try {
          if (!btn.checkVisibility || btn.checkVisibility()) {
            await user.click(btn);
            clicked = true;
            break;
          }
        } catch {}
      }

      if (!clicked) {
        const menuBtn = queryByLabelText('Open Menu');
        if (menuBtn) {
          await user.click(menuBtn);
          langBtns = getAllByText('日本語');
          for (const btn of langBtns) {
            try {
              await user.click(btn);
              clicked = true;
              break;
            } catch {}
          }
        }
      }

      expect(getByText('ソースコードをチェックしてみてね')).toBeInTheDocument();
    });
  });

  describe('Color Mode Switch', () => {
    it('Dark Mode', async () => {
      const [{ queryAllByLabelText, queryByLabelText, getAllByLabelText, container }] =
        await render(<></>);

      let toggleBtns = queryAllByLabelText('Toggle Color Mode');
      let clicked = false;

      // Try clicking any visible button
      for (const btn of toggleBtns) {
        try {
          // Check visibility if possible
          if (!btn.checkVisibility || btn.checkVisibility()) {
            await user.click(btn);
            clicked = true;
            break;
          }
        } catch {
          // Ignore
        }
      }

      // If not clicked, try opening menu
      if (!clicked) {
        const menuBtn = queryByLabelText('Open Menu');
        if (menuBtn) {
          await user.click(menuBtn);
          // Find buttons again as new one might be revealed/rendered
          toggleBtns = getAllByLabelText('Toggle Color Mode');
          for (const btn of toggleBtns) {
            try {
              await user.click(btn);
              clicked = true;
              break;
            } catch {}
          }
        }
      }

      expect(container.parentElement?.parentElement).toHaveClass('dark');

      // Toggle back
      toggleBtns = getAllByLabelText('Toggle Color Mode');
      clicked = false;
      for (const btn of toggleBtns) {
        try {
          await user.click(btn);
          clicked = true;
          break;
        } catch {}
      }
      expect(container.parentElement?.parentElement).not.toHaveClass('dark');
    });
  });
});
