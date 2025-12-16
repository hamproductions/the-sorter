import type { UserEvent } from '@testing-library/user-event';
import { waitFor } from '@testing-library/react';
import { expect } from 'vitest';
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
  const { findByText, queryByText } = container;

  await waitFor(() => {
    expect(queryByText('Keyboard Shortcuts')).toBeInTheDocument();
  });

  let sorting = true;
  while (sorting) {
    try {
      await findByText('Keyboard Shortcuts', {}, { timeout: 200 });
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
    } catch {
      sorting = false;
    }
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
