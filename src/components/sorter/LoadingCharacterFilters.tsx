import { Skeleton } from '../ui/styled/skeleton';
import { Stack } from 'styled-system/jsx';

export function LoadingCharacterFilters() {
  return (
    <Stack
      gap="3.5"
      border="1px solid"
      borderColor="border.default"
      rounded="l1"
      width="full"
      p="4"
    >
      <Skeleton width="50%" h="4" />
      <Stack gap="3">
        <Skeleton w="full" h="4" />
        <Skeleton w="full" h="4" />
        <Skeleton w="full" h="4" />
        <Skeleton hideFrom="md" w="full" h="4" />
        <Skeleton hideFrom="sm" w="full" h="4" />
      </Stack>
      <Skeleton width="50%" h="4" />
      <Stack gap="3">
        <Skeleton w="full" h="4" />
        <Skeleton w="full" h="4" />
        <Skeleton w="full" h="4" />
        <Skeleton hideFrom="md" w="full" h="4" />
        <Skeleton hideFrom="md" w="full" h="4" />
        <Skeleton hideFrom="sm" w="full" h="4" />
        <Skeleton hideFrom="sm" w="full" h="4" />
      </Stack>
      <Skeleton width="50%" h="4" />
      <Stack gap="3">
        <Skeleton w="full" h="4" />
        <Skeleton w="full" h="4" />
        <Skeleton w="full" h="4" />
        <Skeleton w="full" h="4" />
        <Skeleton w="full" h="4" />
        <Skeleton hideFrom="md" w="full" h="4" />
        <Skeleton hideFrom="md" w="full" h="4" />
        <Skeleton hideFrom="md" w="full" h="4" />
        <Skeleton hideFrom="md" w="full" h="4" />
        <Skeleton hideFrom="md" w="full" h="4" />
        <Skeleton hideFrom="md" w="full" h="4" />
        <Skeleton hideFrom="sm" w="full" h="4" />
        <Skeleton hideFrom="sm" w="full" h="4" />
        <Skeleton hideFrom="sm" w="full" h="4" />
        <Skeleton hideFrom="sm" w="full" h="4" />
      </Stack>
    </Stack>
  );
}
