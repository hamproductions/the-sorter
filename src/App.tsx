import { Box, Container, Divider, HStack, Stack } from 'styled-system/jsx';
import { CharacterCard } from './components/sorter/CharacterCard';
import { CharacterFilters } from './components/sorter/CharacterFilters';
import { RankingTable } from './components/sorter/RankingTable';
import { Button } from './components/ui/button';
import { Progress } from './components/ui/progress';
import { Switch } from './components/ui/switch';
import { Text } from './components/ui/text';
import { useSortData } from './hooks/useSortData';
import { Heading } from './components/ui/heading';
import { Kbd } from './components/ui/kbd';
import { useData } from './hooks/useData';
import { Character } from './types';

function App() {
  const data = useData();
  const {
    seiyuu,
    setSeiyuu,
    init,
    left,
    right,
    state,
    count,
    tie,
    undo,
    progress,
    filters,
    setFilters,
    listToSort,
    listCount
  } = useSortData();

  const charaList = (state?.arr.map((l) => data.find((i) => i.id === l)).filter((c) => !!c) ??
    []) as Character[];

  const currentLeft =
    state &&
    state.mergeState?.leftArrIdx !== undefined &&
    listToSort.find(
      (l) => l.id === state.mergeState?.leftArr?.[state.mergeState?.leftArrIdx as number]
    );
  const currentRight =
    state &&
    state.mergeState?.rightArrIdx !== undefined &&
    listToSort.find(
      (l) => l.id === state.mergeState?.rightArr?.[state.mergeState?.rightArrIdx as number]
    );

  return (
    <Container py={4} px={4}>
      <Stack alignItems="center" w="full">
        <Text fontSize="3xl" fontWeight="bold">
          Yet another LL! sorter
        </Text>
        <Switch checked={seiyuu} onCheckedChange={(e) => setSeiyuu(e.checked)}>
          Do you like seiyuu ? (Seiyuu Mode)
        </Switch>
        <CharacterFilters filters={filters} setFilters={setFilters} />
        <Text fontSize="sm" fontWeight="bold">
          {listCount} to be sorted
        </Text>
        <Button onClick={() => init()}>Start/ Reset</Button>
        {state && (
          <Stack alignItems="center" w="full">
            {state.status !== 'end' && (
              <Stack w="full" h="100vh" p="4">
                <Stack flex="1" alignItems="center" w="full">
                  {currentLeft && currentRight && (
                    <HStack
                      flexDirection={{ base: 'column', sm: 'row' }}
                      alignItems="stretch"
                      width="full"
                    >
                      <Stack flex="1" alignItems="center">
                        <CharacterCard
                          onClick={() => left()}
                          character={currentLeft}
                          isSeiyuu={seiyuu}
                        />
                        <Box>
                          <Kbd>←</Kbd>
                        </Box>
                      </Stack>
                      <Stack flex="1" alignItems="center">
                        <CharacterCard
                          onClick={() => right()}
                          character={currentRight}
                          isSeiyuu={seiyuu}
                        />
                        <Box>
                          <Kbd>→</Kbd>
                        </Box>
                      </Stack>
                    </HStack>
                  )}
                  <HStack justifyContent="center">
                    <Button onClick={() => tie()}>Tie</Button>
                    <Button variant="outline" onClick={() => undo()}>
                      Undo
                    </Button>
                  </HStack>
                </Stack>
                <Text>Comparasion No. {count}</Text>
                <Progress value={progress} min={0} max={1} defaultValue={0} />
              </Stack>
            )}
            <Divider />
            {state.status !== 'end' && (
              <Heading fontSize="2xl" fontWeight="bold">
                Tentative Ranking
              </Heading>
            )}
            {charaList && <RankingTable characters={charaList} isSeiyuu={seiyuu} />}
          </Stack>
        )}
        {/* <Text whiteSpace="pre-wrap">{JSON.stringify(state, null, 4)}</Text> */}
      </Stack>
    </Container>
  );
}

export default App;
