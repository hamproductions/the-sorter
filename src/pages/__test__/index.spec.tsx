import '@testing-library/jest-dom/vitest';

import { beforeAll, describe, expect, it, vi } from 'vitest';
import { render, screen, waitForElementToBeRemoved } from '../../__test__/utils';
import { Page } from '../index/+Page';

beforeAll(async () => {
  await import('../../components/sorter/CharacterFilters');
  await import('../../components/dialog/ConfirmDialog');
  vi.timeout;
});

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

      it('share filters', async () => {
        const [{ findByText, findAllByText }, user] = await render(<Page />);
        await user.click(await findByText('Cerise Bouquet', {}, { timeout: 2000 }));
        await user.click(await findByText("Hasunosora Girls' High School"));
        await user.click((await findAllByText("Hasunosora Girls' High School Idol Club"))[0]);
        expect(await findByText('9 to be sorted')).toBeInTheDocument();
        const mockCopy = vi.spyOn(global.window.navigator.clipboard, 'writeText');
        await user.click(await findByText('Share current settings'));
        expect(mockCopy).toBeCalledWith(
          'http://localhost/?series=%E8%93%AE%E3%83%8E%E7%A9%BA%E5%A5%B3%E5%AD%A6%E9%99%A2%E3%82%B9%E3%82%AF%E3%83%BC%E3%83%AB%E3%82%A2%E3%82%A4%E3%83%89%E3%83%AB%E3%82%AF%E3%83%A9%E3%83%96&school=%E8%93%AE%E3%83%8E%E7%A9%BA%E5%A5%B3%E5%AD%A6%E9%99%A2&units=134'
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

  describe('Sorting Process', () => {
    it('Sort Normally', async () => {
      const [{ findByText, findAllByText, queryByText }, user] = await render(<Page />);
      await user.click(await findByText('Cerise Bouquet'));
      expect(await findByText('3 to be sorted')).toBeInTheDocument();
      await user.click(await findByText('Start', {}, {}));
      const sortOrder = ['Nirei', 'Hanamiya', 'Sakurai'];
      while (!!queryByText('Keyboard Shortcuts')) {
        const divs = await findAllByText(/(Nirei|Hanamiya|Sakurai)/i);
        expect(divs).toHaveLength(2);
        const index =
          sortOrder.findIndex((name) => divs[0].textContent?.includes(name)) >
          sortOrder.findIndex((name) => divs[1].textContent?.includes(name))
            ? 1
            : 0;
        await user.click(divs[index]);
      }
      expect(await findByText('Sort Results')).toBeInTheDocument();
      expect(await findAllByText(/(Nirei|Hanamiya|Sakurai)/i)).toHaveLength(3);
      expect(await findAllByText('1')).toHaveLength(1);
    });

    it('Sort with Ties', async () => {
      const [{ findByText, findAllByText, queryByText }, user] = await render(<Page />);
      await user.click(await findByText('Cerise Bouquet'));
      expect(await findByText('3 to be sorted')).toBeInTheDocument();
      await user.click(await findByText('Start', {}, {}));
      while (!!queryByText('Keyboard Shortcuts')) {
        await user.click(await findByText('Tie'));
      }
      expect(await findByText('Sort Results')).toBeInTheDocument();
      expect(await findAllByText(/(Nirei|Hanamiya|Sakurai)/i)).toHaveLength(3);
      expect(await findAllByText('1')).toHaveLength(3);
    });

    it('Undo', async () => {
      const [{ findByText, findAllByText }, user] = await render(<Page />);
      await user.click(await findByText('Cerise Bouquet'));
      expect(await findByText('3 to be sorted')).toBeInTheDocument();
      await user.click(await findByText('Start', {}, {}));
      const sortOrder = ['Nirei', 'Hanamiya', 'Sakurai'];
      const divs = await findAllByText(/(Nirei|Hanamiya|Sakurai)/i);
      expect(divs).toHaveLength(2);
      const index =
        sortOrder.findIndex((name) => divs[0].textContent?.includes(name)) >
        sortOrder.findIndex((name) => divs[1].textContent?.includes(name))
          ? 1
          : 0;
      await user.click(divs[index]);
      const newDivs = await findAllByText(/(Nirei|Hanamiya|Sakurai)/i);
      expect(
        newDivs[0].textContent !== divs[0].textContent ||
          newDivs[1].textContent !== divs[1].textContent
      ).toEqual(true);
      await user.click(await findByText('Undo'));
      const returnedDiv = await findAllByText(/(Nirei|Hanamiya|Sakurai)/i);
      expect(
        returnedDiv[0].textContent === divs[0].textContent &&
          returnedDiv[1].textContent === divs[1].textContent
      ).toEqual(true);
    });

    it('Start Over', async () => {
      const [{ findByText, findAllByText }, user] = await render(<Page />);
      await user.click(await findByText('Cerise Bouquet'));
      expect(await findByText('3 to be sorted')).toBeVisible();
      await user.click(await findByText('Start', {}, {}));
      const sortOrder = ['Nirei', 'Hanamiya', 'Sakurai'];
      const divs = await findAllByText(/(Nirei|Hanamiya|Sakurai)/i);
      expect(divs).toHaveLength(2);
      expect(await findByText('Comparison No. 1')).toBeVisible();
      const index =
        sortOrder.findIndex((name) => divs[0].textContent?.includes(name)) >
        sortOrder.findIndex((name) => divs[1].textContent?.includes(name))
          ? 1
          : 0;
      await user.click(divs[index]);

      await user.click(await findByText('Start Over'));
      const modalTitle = await findByText('Sorting in progress');
      expect(modalTitle).toBeVisible();
      await user.click(await findByText('Cancel'));
      await waitForElementToBeRemoved(modalTitle);

      await user.click(await findByText('Start Over'));
      expect(await findByText('Sorting in progress')).toBeVisible();
      await user.click(await findByText('Proceed'));
      expect(await findByText('0%')).toBeVisible();
    });

    it('Abort', async () => {
      const [{ findByText, findAllByText, queryByText }, user] = await render(<Page />);
      await user.click(await findByText('Cerise Bouquet'));
      expect(await findByText('3 to be sorted')).toBeVisible();
      await user.click(await findByText('Start', {}, {}));
      const sortOrder = ['Nirei', 'Hanamiya', 'Sakurai'];
      const divs = await findAllByText(/(Nirei|Hanamiya|Sakurai)/i);
      expect(divs).toHaveLength(2);
      expect(await findByText('0%')).toBeVisible();
      const index =
        sortOrder.findIndex((name) => divs[0].textContent?.includes(name)) >
        sortOrder.findIndex((name) => divs[1].textContent?.includes(name))
          ? 1
          : 0;
      await user.click(divs[index]);
      expect(queryByText('0%')).toBeNull();

      await user.click(await findByText('Stop'));
      const modalTitle = await findByText('Sorting in progress');
      expect(modalTitle).toBeVisible();
      await user.click(await findByText('Cancel'));
      await waitForElementToBeRemoved(modalTitle);

      await user.click(await findByText('Stop'));
      expect(await findByText('Sorting in progress')).toBeVisible();
      await user.click(await findByText('Proceed'));
      expect(await findByText('Start')).toBeVisible();
    });
  });

  describe('Results', () => {
    describe('Results View', () => {
      describe.todo('Ranking View');
      describe.todo('Table View');
      describe.todo('Grid View');
      describe.todo('Tier list');
    });
    describe.todo('Share');

    describe.todo('CharacterInfo');

    describe.todo('Start Over');
  });
});
