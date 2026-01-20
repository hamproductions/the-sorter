'use client';
import type { Assign, SelectRootProps } from '@ark-ui/react';
import { ark } from '@ark-ui/react/factory';
import { Select as ArkSelect, useSelectItemContext } from '@ark-ui/react/select';
import { FaCheck, FaSort } from 'react-icons/fa6';
import { forwardRef, type RefAttributes } from 'react';
import { createStyleContext } from 'styled-system/jsx';
import { type SelectVariantProps, select } from 'styled-system/recipes';
import type { HTMLStyledProps } from 'styled-system/types';

const { withProvider, withContext } = createStyleContext(select);

type StyleProps = SelectVariantProps & HTMLStyledProps<'div'>;

export type RootProps<T> = Assign<SelectRootProps<T>, StyleProps> & RefAttributes<HTMLDivElement>;

export const Root = withProvider(ArkSelect.Root, 'root') as ArkSelect.RootComponent<StyleProps>;

export const ClearTrigger = withContext(ArkSelect.ClearTrigger, 'clearTrigger');
export const Content = withContext(ArkSelect.Content, 'content');
export const Control = withContext(ArkSelect.Control, 'control');
export const IndicatorGroup = withContext(ark.div, 'indicatorGroup');
export const Item = withContext(ArkSelect.Item, 'item');
export const ItemGroup = withContext(ArkSelect.ItemGroup, 'itemGroup');
export const ItemGroupLabel = withContext(ArkSelect.ItemGroupLabel, 'itemGroupLabel');
export const ItemText = withContext(ArkSelect.ItemText, 'itemText');
export const Label = withContext(ArkSelect.Label, 'label');
export const List = withContext(ArkSelect.List, 'list');
export const Positioner = withContext(ArkSelect.Positioner, 'positioner');
export const Trigger = withContext(ArkSelect.Trigger, 'trigger');
export const ValueText = withContext(ArkSelect.ValueText, 'valueText');
export const Indicator = withContext(ArkSelect.Indicator, 'indicator', {
  defaultProps: { children: <FaSort /> }
});
export const HiddenSelect = ArkSelect.HiddenSelect;

export {
  SelectContext as Context,
  SelectItemContext as ItemContext,
  type SelectValueChangeDetails as ValueChangeDetails,
  createListCollection
} from '@ark-ui/react/select';

const StyledItemIndicator = withContext(ArkSelect.ItemIndicator, 'itemIndicator');

export const ItemIndicator = forwardRef<HTMLDivElement, HTMLStyledProps<'div'>>(
  function ItemIndicator(props, ref) {
    const item = useSelectItemContext();

    return item.selected ? (
      <StyledItemIndicator ref={ref} {...props}>
        <FaCheck />
      </StyledItemIndicator>
    ) : (
      <svg aria-hidden="true" focusable="false" />
    );
  }
);
