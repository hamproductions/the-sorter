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
import { useEffect } from 'react';

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

  const shareUrl = () => {
    const params = new URLSearchParams();
    for (let key of ['series', 'units', 'school'] as const) {
      const list = Object.entries(filters?.[key] ?? {})
        .filter((s) => s[1])
        .map((s) => s[0]);
      if (list.length > 0) {
        list.forEach((item) => params.append(key, item));
      }
    }
    if (seiyuu) {
      params.append('seiyuu', seiyuu.toString());
    }
    const url = `${location.origin}/?${params.toString()}`;
    try {
      navigator.clipboard.writeText(url);
    } catch (e) {
      console.error('oopsie');
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlSeiyuu = params.get('seiyuu');

    setSeiyuu(urlSeiyuu === 'true');
  }, []);

  return (
    <Stack w="full" minH="100vh">
      <Container flex={1} py={4} px={4}>
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
          <HStack>
            <Button onClick={shareUrl} variant="outline">
              Share Current Preset
            </Button>
            <Button onClick={() => init()}>Start/ Reset</Button>
          </HStack>
          {state && (
            <Stack alignItems="center" w="full">
              {state.status !== 'end' && (
                <Stack w="full" h={{ base: '100vh', md: 'auto' }} p="4">
                  <Stack flex="1" alignItems="center" w="full">
                    {currentLeft && currentRight && (
                      <HStack
                        flex={1}
                        flexDirection={{ base: 'column', sm: 'row' }}
                        justifyContent="stretch"
                        width="full"
                      >
                        <Stack flex="1" alignItems="center" w="full">
                          <CharacterCard
                            onClick={() => left()}
                            character={currentLeft}
                            isSeiyuu={seiyuu}
                            flex={1}
                          />
                          <Box>
                            <Kbd>←</Kbd>
                          </Box>
                        </Stack>
                        <Stack flex="1" alignItems="center" w="full">
                          <CharacterCard
                            onClick={() => right()}
                            character={currentRight}
                            isSeiyuu={seiyuu}
                            flex={1}
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
        </Stack>
      </Container>
      <HStack justifyContent="center" w="full" p="4" bgColor="bg.muted">
        Created by ハムP | Inspired by a bunch of other sorters of course | Assets are not mine
      </HStack>
    </Stack>
  );
}

export default App;
