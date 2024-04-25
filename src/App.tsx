import { Container, HStack, Stack } from 'styled-system/jsx';
import { Button } from './components/ui/button';
import { Text } from './components/ui/text';
import { useSorter } from './hooks/useSorter';
import { useData } from './hooks/useData';
import { Switch } from './components/ui/switch';
import { useState } from 'react';
import { RankingTable } from './components/sorter/RankingTable';
import { CharacterFilters, FilterType } from './components/sorter/CharacterFilters';

function App() {
  const characters = useData();
  const [seiyuu, setSeiyuu] = useState(false);
  const [filters, setFilters] = useState<FilterType>({ series: {}, units: {}, school: {} });
  const { init, left, right, state, count, tie, undo } = useSorter(characters);

  const getName = (character?: (typeof characters)[0]) => {
    if (!character) return '';
    return seiyuu ? character.seiyuu : character.fullName;
  };

  console.log(filters);

  return (
    <Container>
      <Stack alignItems="center" w="full">
        <Text fontSize="3xl" fontWeight="bold">
          Yet another LL! sorter
        </Text>
        <Switch checked={seiyuu} onCheckedChange={(e) => setSeiyuu(e.checked)}>
          Do you like seiyuu ?
        </Switch>
        <CharacterFilters filters={filters} setFilters={setFilters} />
        <Button onClick={() => init()}>Start/ Reset</Button>
        {state && (
          <Stack alignItems="center">
            <Text>Comparasion No. {count}</Text>
            {state.mergeState &&
              state.mergeState.leftArrIdx !== undefined &&
              state.mergeState.rightArrIdx !== undefined && (
                <HStack fontSize="2xl" fontWeight="bold">
                  <Text>{getName(state.mergeState.leftArr?.[state.mergeState?.leftArrIdx])}</Text>
                  <Text>{getName(state.mergeState.rightArr?.[state.mergeState?.rightArrIdx])}</Text>
                </HStack>
              )}
            {state.status !== 'end' && (
              <Stack>
                <HStack>
                  <Button onClick={() => left()}>Left</Button>
                  <Button onClick={() => tie()}>Tie</Button>
                  <Button onClick={() => right()}>Right</Button>
                </HStack>
                <HStack>
                  <Button onClick={() => undo()}>Undo</Button>
                </HStack>
              </Stack>
            )}
            <RankingTable characters={state.arr} />
          </Stack>
        )}
        {/* <Text whiteSpace="pre-wrap">{JSON.stringify(state, null, 4)}</Text> */}
      </Stack>
    </Container>
  );
}

export default App;
