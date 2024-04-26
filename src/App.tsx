import { useEffect, useState } from 'react';
import { Container, HStack, Stack } from 'styled-system/jsx';
import { CharacterCard } from './components/sorter/CharacterCard';
import { CharacterFilters, FilterType } from './components/sorter/CharacterFilters';
import { RankingTable } from './components/sorter/RankingTable';
import { Button } from './components/ui/button';
import { Progress } from './components/ui/progress';
import { Switch } from './components/ui/switch';
import { Text } from './components/ui/text';
import { useData } from './hooks/useData';
import { useSorter } from './hooks/useSorter';
import { Character } from './types';
import { groupBy } from 'lodash';

function App() {
  const characters = useData();
  const [seiyuu, setSeiyuu] = useState(false);
  const [filters, setFilters] = useState<FilterType>({ series: {}, units: {}, school: {} });
  const { init, left, right, state, count, tie, undo, progress, reset } = useSorter(
    seiyuu
      ? Object.values(
          groupBy(
            characters.flatMap((c) =>
              c.casts.map(
                (a, idx) =>
                  ({ ...c, id: idx > 0 ? `${c.id}-${idx}` : c.id, casts: [a] }) as Character
              )
            ),
            (d) => d.casts[0].seiyuu
          )
        ).map((d) => d[0])
      : characters
  );

  useEffect(() => {
    reset();
  }, [seiyuu]);

  return (
    <Container>
      <Stack alignItems="center" w="full">
        <Text fontSize="3xl" fontWeight="bold">
          Yet another LL! sorter
        </Text>
        <Switch checked={seiyuu} onCheckedChange={(e) => setSeiyuu(e.checked)}>
          Do you like seiyuu ? (Seiyuu Mode)
        </Switch>
        <CharacterFilters filters={filters} setFilters={setFilters} />
        <Button onClick={() => init()}>Start/ Reset</Button>
        {state && (
          <Stack alignItems="center">
            <Text>Comparasion No. {count}</Text>
            <Progress value={progress} min={0} max={1} defaultValue={0} />
            {state.mergeState &&
              state.mergeState.leftArrIdx !== undefined &&
              state.mergeState.rightArrIdx !== undefined && (
                <HStack alignItems="stretch" width="full">
                  <CharacterCard
                    onClick={() => left()}
                    character={state.mergeState.leftArr?.[state.mergeState?.leftArrIdx]}
                    isSeiyuu={seiyuu}
                  />
                  <CharacterCard
                    onClick={() => right()}
                    character={state.mergeState.rightArr?.[state.mergeState?.rightArrIdx]}
                    isSeiyuu={seiyuu}
                  />
                </HStack>
              )}
            {state.status !== 'end' && (
              <Stack>
                <HStack>
                  <Button onClick={() => tie()}>Tie</Button>
                  <Button onClick={() => undo()}>Undo</Button>
                </HStack>
                <HStack></HStack>
              </Stack>
            )}
            <RankingTable characters={state.arr} isSeiyuu={seiyuu} />
          </Stack>
        )}
        {/* <Text whiteSpace="pre-wrap">{JSON.stringify(state, null, 4)}</Text> */}
      </Stack>
    </Container>
  );
}

export default App;
