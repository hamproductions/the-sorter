import '@testing-library/jest-dom/vitest';

import type { UserEvent } from '@testing-library/user-event';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import type { RenderResult } from '../../__test__/utils';
import { render, waitForElementToBeRemoved } from '../../__test__/utils';
import { Page } from '../index/+Page';

beforeAll(async () => {
  await import('../../components/sorter/CharacterFilters');
  await import('../../components/dialog/ConfirmDialog');
});

const selectPreset = async (container: RenderResult, user: UserEvent) => {
  const { findByText } = container;
  await user.click(await findByText('Cerise Bouquet'));
  expect(await findByText('3 to be sorted')).toBeInTheDocument();
};

const selectCurrentItem = async (
  container: RenderResult,
  user: UserEvent,
  sortOrder = ['Nirei', 'Hanamiya', 'Sakurai']
) => {
  const { findAllByText } = container;
  const divs = await findAllByText(/(Nirei|Hanamiya|Sakurai)/i);
  expect(divs).toHaveLength(2);
  const index =
    sortOrder.findIndex((name) => divs[0].textContent?.includes(name)) >
    sortOrder.findIndex((name) => divs[1].textContent?.includes(name))
      ? 1
      : 0;
  await user.click(divs[index]);
  return divs;
};

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
        expect(await findByText('11 to be sorted')).toBeInTheDocument();
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

      it('DD mode selection', async () => {
        const [container, user] = await render(<Page />);
        const { findByText } = container;
        await selectPreset(container, user);
        await user.click(await findByText('No DD Allowed Mode (Hard)', {}, {}));
        await user.click(await findByText('Start', {}, {}));
        expect(await findByText('Tie')).toBeDisabled();
        expect(await findByText('0%')).toBeVisible();
        await user.keyboard('[ArrowDown]');
        expect(await findByText('0%')).toBeVisible();
      });
    });
  });

  describe('Sorting Process', () => {
    it('Sort Normally', async () => {
      const [container, user] = await render(<Page />);
      const { findByText, findAllByText, queryByText } = container;
      await selectPreset(container, user);
      await user.click(await findByText('Start', {}, {}));

      while (queryByText('Keyboard Shortcuts')) {
        await selectCurrentItem(container, user);
      }
      expect(await findByText('Sort Results')).toBeInTheDocument();
      expect(await findAllByText(/(Nirei|Hanamiya|Sakurai)/i)).toHaveLength(3);
      expect(await findAllByText('1')).toHaveLength(1);
    });

    it('Sort with Ties', async () => {
      const [container, user] = await render(<Page />);
      const { findByText, findAllByText, queryByText } = container;
      await selectPreset(container, user);
      await user.click(await findByText('Start', {}, {}));
      while (queryByText('Keyboard Shortcuts')) {
        await user.click(await findByText('Tie'));
      }
      expect(await findByText('Sort Results')).toBeInTheDocument();
      expect(await findAllByText(/(Nirei|Hanamiya|Sakurai)/i)).toHaveLength(3);
      expect(await findAllByText('1')).toHaveLength(3);
    });

    it('Undo', async () => {
      const [container, user] = await render(<Page />);
      const { findByText, findAllByText } = container;
      await selectPreset(container, user);
      await user.click(await findByText('Start', {}, {}));
      const divs = await selectCurrentItem(container, user);
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
      const [container, user] = await render(<Page />);
      const { findByText } = container;
      await selectPreset(container, user);
      await user.click(await findByText('Start', {}, {}));
      await selectCurrentItem(container, user);

      await user.click(await findByText('Start Over'));
      const modalTitle = await findByText('Sorting in progress');
      expect(modalTitle).toBeVisible();
      await user.click(await findByText('Cancel'));
      try {
        await waitForElementToBeRemoved(modalTitle);
      } catch {}

      await user.click(await findByText('Start Over'));
      expect(await findByText('Sorting in progress')).toBeVisible();
      await user.click(await findByText('Proceed'));
      expect(await findByText('0%')).toBeVisible();
    });

    it('Abort', async () => {
      const [container, user] = await render(<Page />);
      const { findByText, queryByText } = container;
      await selectPreset(container, user);
      await user.click(await findByText('Start', {}, {}));
      await selectCurrentItem(container, user);
      expect(queryByText('0%')).toBeNull();

      await user.click(await findByText('Stop'));
      const modalTitle = await findByText('Sorting in progress');
      expect(modalTitle).toBeVisible();
      await user.click(await findByText('Cancel'));
      try {
        await waitForElementToBeRemoved(modalTitle);
      } catch {}

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

    describe('Result Editing', () => {
      it('Shows edit modal', async () => {
        const [container, user] = await render(<Page />);
        const { findByText, findAllByText, queryByText } = container;
        await selectPreset(container, user);
        await user.click(await findByText('Start', {}, {}));

        while (queryByText('Keyboard Shortcuts')) {
          await selectCurrentItem(container, user);
        }
        expect(await findByText('Sort Results')).toBeInTheDocument();

        const before = await findAllByText(/(Nirei|Hanamiya|Sakurai)/i);
        expect(before).toHaveLength(3);
        expect(before[0].textContent).toMatch(/Nozomi Nirei/i);
        expect(before[1].textContent).toMatch(/Nina Hanamiya/i);
        expect(before[2].textContent).toMatch(/Hina Sakurai/i);

        await user.click(await findByText('Edit Results (Experimental)'));
        await user.keyboard('[Space][ArrowDown]');
        await user.keyboard('[Space]');

        await user.click(await findByText('Save'));

        //TODO: Continue Testing The results
        // const after = await findAllByText(/(Nirei|Hanamiya|Sakurai)/i);
        // expect(after).toHaveLength(3);
        // expect(after[0].textContent).toMatch(/Nina Hanamiya/i);
        // expect(after[1].textContent).toMatch(/Nozomi Nirei/i);
        // expect(after[2].textContent).toMatch(/Hina Sakurai/i);
      });
    });

    describe.todo('Share');

    describe.todo('CharacterInfo');

    describe.todo('Start Over');
  });
});
