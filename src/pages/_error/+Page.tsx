import { Center, Stack } from 'styled-system/jsx';
import { Link } from '~/components/ui/styled/link';
import { Text } from '~/components/ui/styled/text';

export { Page };

/* Or:
import { usePageContext } from 'vike-vue/usePageContext'
import { usePageContext } from 'vike-solid/usePageContext'
*/

function Page() {
  return (
    <Center w="100vw" h="100vh">
      <Stack>
        <Text>Something went wrong lah, you shouldn't be here.</Text>
        <Link href="/">Go Back</Link>
      </Stack>
    </Center>
  );
}
