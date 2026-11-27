import { Portal } from '@ark-ui/react/portal';
import { useRef, type ComponentProps, type ReactElement, type ReactNode } from 'react';
import { Box, Stack } from 'styled-system/jsx';
import { getClosestDialog } from './closest-dialog';
import { Menu } from '~/components/ui/menu';
import { Text } from '~/components/ui/text';

export interface ActionItem {
  id: string;
  label: string;
  icon: ReactNode;
  onSelect: () => void;
}

export function ExportMenu({
  trigger,
  children,
  placement = 'bottom-start',
  ...props
}: Omit<ComponentProps<typeof Menu.Root>, 'children'> & {
  trigger: ReactElement;
  children: ReactNode;
  placement?: 'bottom-start' | 'bottom-end';
}) {
  const containerRef = useRef<HTMLElement | null>(null);

  return (
    <Menu.Root lazyMount unmountOnExit positioning={{ strategy: 'fixed', placement }} {...props}>
      <Menu.Trigger
        ref={(node) => {
          containerRef.current = getClosestDialog(node);
        }}
        asChild
      >
        {trigger}
      </Menu.Trigger>
      <Portal container={containerRef}>
        <Menu.Positioner
          data-export-menu=""
          css={{
            smDown: {
              display: 'flex!',
              position: 'fixed!',
              inset: '0!',
              minW: '0!',
              transform: 'none!',
              alignItems: 'flex-end',
              bg: 'black.a8'
            }
          }}
        >
          <Menu.Content
            borderColor="border.default"
            borderWidth="1px"
            w="340px"
            maxW="calc(100vw - 2rem)"
            maxH="var(--available-height)"
            textAlign="start"
            bg="bg.muted"
            overflowY="auto"
            css={{
              '& [data-part=separator]': {
                borderColor: 'fg.subtle'
              },
              '&:focus-visible [data-highlighted]': {
                outline: '2px solid',
                outlineColor: 'accent.text',
                outlineOffset: '-2px'
              },
              smDown: {
                borderBottomRadius: '0',
                borderTopRadius: '2xl',
                w: 'full',
                maxW: 'full',
                maxH: '85dvh',
                pt: '2',
                pb: 'calc(env(safe-area-inset-bottom) + 1rem)',
                _before: {
                  content: '""',
                  alignSelf: 'center',
                  flexShrink: '0',
                  borderRadius: 'full',
                  w: '9',
                  h: '1',
                  bg: 'border.default'
                }
              }
            }}
          >
            {children}
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
}

export function ExportMenuGroup({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <Menu.ItemGroup>
      {label && <Menu.ItemGroupLabel>{label}</Menu.ItemGroupLabel>}
      {children}
    </Menu.ItemGroup>
  );
}

export function ExportMenuItemBody({
  icon,
  label,
  description
}: {
  icon: ReactNode;
  label: string;
  description?: ReactNode;
}) {
  return (
    <>
      <Box aria-hidden="true" flexShrink="0" mt="0.5">
        {icon}
      </Box>
      <Stack gap="0.5" minW="0">
        <Text as="span" fontSize="sm" fontWeight="semibold">
          {label}
        </Text>
        {description && (
          <Text as="span" color="fg.muted" fontSize="xs" overflowWrap="anywhere">
            {description}
          </Text>
        )}
      </Stack>
    </>
  );
}

export function ExportMenuItem({
  icon,
  label,
  description,
  ...props
}: ComponentProps<typeof Menu.Item> & ComponentProps<typeof ExportMenuItemBody>) {
  return (
    <Menu.Item
      cursor="pointer"
      gap="2.5"
      alignItems="flex-start"
      h="auto"
      minH={{ base: '12', sm: '10' }}
      py="2.5"
      _highlighted={{ bg: 'bg.emphasized' }}
      {...props}
    >
      <ExportMenuItemBody icon={icon} label={label} description={description} />
    </Menu.Item>
  );
}
