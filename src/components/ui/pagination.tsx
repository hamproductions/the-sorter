'use client';
import { Pagination as ArkPagination } from '@ark-ui/react/pagination';
import type { ComponentProps } from 'react';
import { createStyleContext } from 'styled-system/jsx';
import { pagination } from 'styled-system/recipes';

const { withProvider, withContext } = createStyleContext(pagination);

export type RootProps = ComponentProps<typeof Root>;
export const Root = withProvider(ArkPagination.Root, 'root');
export const RootProvider = withProvider(ArkPagination.RootProvider, 'root');
export const Ellipsis = withContext(ArkPagination.Ellipsis, 'ellipsis', {
  defaultProps: { children: '...' }
});
export const Item = withContext(ArkPagination.Item, 'item');
export const PrevTrigger = withContext(ArkPagination.PrevTrigger, 'prevTrigger');
export const NextTrigger = withContext(ArkPagination.NextTrigger, 'nextTrigger');

export { PaginationContext as Context } from '@ark-ui/react/pagination';
