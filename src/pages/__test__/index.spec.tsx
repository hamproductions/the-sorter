import '@testing-library/jest-dom/vitest';

import { describe, expect, it } from 'vitest';
import { render } from '../../__test__/utils';
import { Page } from '../index/+Page';

describe('Home Page', () => {
  it('Renders', async () => {
    const [{ findByText }] = await render(<Page />);
    expect(await findByText('LoveLive! Sorter')).toBeInTheDocument();
  });

  describe('Sort Feature', () => {
    describe('Preset Selection', () => {
      it('select filters', async () => {
        const [{ findByText }, user] = await render(<Page />);
        await user.click(await findByText('Cerise Bouquet', {}, { timeout: 2000 }));
        expect(await findByText('3 to be sorted')).toBeInTheDocument();
        await user.click(await findByText('DOLLCHESTRA'));
        expect(await findByText('6 to be sorted')).toBeInTheDocument();
        await user.click(await findByText('Mira-Cra Park!'));
        expect(await findByText('9 to be sorted')).toBeInTheDocument();
        expect(window.localStorage.getItem('filters')).toEqual(
          JSON.stringify({
            series: [],
            school: [],
            units: ['134', '135', '136']
          })
        );
      });

      it('seiyuu mode selection', async () => {
        const [{ findByText, findByLabelText }, user] = await render(<Page />);
        await user.click(await findByLabelText('A・ZU・NA'));
        expect(await findByText('3 to be sorted')).toBeInTheDocument();
        await user.click(await findByLabelText('Do you like seiyuu ? (Seiyuu Mode)'));
        expect(await findByText('4 to be sorted')).toBeInTheDocument();
      });
    });
  });
});
