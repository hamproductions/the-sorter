'use client';
import type { Assign, SwitchRootProps } from '@ark-ui/react';
import { Switch as ArkSwitch } from '@ark-ui/react/switch';
import { type SwitchRecipeVariantProps, switchRecipe } from 'styled-system/recipes';
import type { ComponentProps, HTMLStyledProps, JsxStyleProps } from 'styled-system/types';
import { createStyleContext } from './utils/create-style-context';
import { forwardRef } from 'react';
import { cx, css } from 'styled-system/css';
import { splitCssProps } from 'styled-system/jsx';

const { withProvider, withContext } = createStyleContext(switchRecipe);

export type RootProviderProps = ComponentProps<typeof RootProvider>;
export const RootProvider = withProvider<
  HTMLLabelElement,
  Assign<
    Assign<HTMLStyledProps<'label'>, ArkSwitch.RootProviderBaseProps>,
    SwitchRecipeVariantProps
  >
>(ArkSwitch.RootProvider, 'root');

export type RootProps = ComponentProps<typeof Root>;
export const Root = withProvider<
  HTMLLabelElement,
  Assign<Assign<HTMLStyledProps<'label'>, ArkSwitch.RootBaseProps>, SwitchRecipeVariantProps>
>(ArkSwitch.Root, 'root');

export const Control = withContext<
  HTMLSpanElement,
  Assign<HTMLStyledProps<'span'>, ArkSwitch.ControlBaseProps>
>(ArkSwitch.Control, 'control');

export const Label = withContext<
  HTMLSpanElement,
  Assign<HTMLStyledProps<'span'>, ArkSwitch.LabelBaseProps>
>(ArkSwitch.Label, 'label');

export const Thumb = withContext<
  HTMLSpanElement,
  Assign<HTMLStyledProps<'span'>, ArkSwitch.ThumbBaseProps>
>(ArkSwitch.Thumb, 'thumb');

export interface SwitchProps
  extends Assign<JsxStyleProps, SwitchRootProps>,
    SwitchRecipeVariantProps {}

export { SwitchContext as Context, SwitchHiddenInput as HiddenInput } from '@ark-ui/react/switch';

export const Switch = forwardRef<HTMLLabelElement, SwitchProps>((props, ref) => {
  const [variantProps, switchProps] = switchRecipe.splitVariantProps(props);
  const [cssProps, localProps] = splitCssProps(switchProps);
  const { children, className, ...rootProps } = localProps;
  const styles = switchRecipe(variantProps);

  return (
    <ArkSwitch.Root className={cx(styles.root, css(cssProps), className)} ref={ref} {...rootProps}>
      <ArkSwitch.Control className={styles.control}>
        <ArkSwitch.Thumb className={styles.thumb} />
      </ArkSwitch.Control>
      {children && <ArkSwitch.Label className={styles.label}>{children}</ArkSwitch.Label>}
      <ArkSwitch.HiddenInput />
    </ArkSwitch.Root>
  );
});
