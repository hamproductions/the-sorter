import type { UserEvent } from '@testing-library/user-event';
import type { RenderResult } from './index';

export const pickLeft = async (user: UserEvent) => {
  await user.keyboard('[ArrowLeft]');
};

export const pickRight = async (user: UserEvent) => {
  await user.keyboard('[ArrowRight]');
};

export const pickTie = async (user: UserEvent) => {
  await user.keyboard('[ArrowDown]');
};

export const pickUndo = async (user: UserEvent) => {
  await user.keyboard('[ArrowUp]');
};

export const resolveSort = async (
  container: RenderResult,
  user: UserEvent,
  strategy: 'left' | 'right' | 'random' = 'left'
) => {
  const { queryByText } = container;
  while (queryByText('Keyboard Shortcuts')) {
    if (strategy === 'left') {
      await pickLeft(user);
    } else if (strategy === 'right') {
      await pickRight(user);
    } else {
      if (Math.random() > 0.5) {
        await pickLeft(user);
      } else {
        await pickRight(user);
      }
    }
    // Small delay might be needed if animations are involved, but usually not in tests
  }
};

export const selectPreset = async (
  container: RenderResult,
  user: UserEvent,
  presetName: string
) => {
  const { findByText } = container;
  await user.click(await findByText(presetName, {}, { timeout: 2000 }));
};
