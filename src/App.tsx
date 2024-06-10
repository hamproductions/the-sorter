import { Box, Container, Divider, HStack, Stack, Wrap } from 'styled-system/jsx';
import { CharacterCard } from './components/sorter/CharacterCard';
import { CharacterFilters } from './components/sorter/CharacterFilters';

import { useEffect } from 'react';
import { Button } from './components/ui/button';
import { Kbd } from './components/ui/kbd';
import { Progress } from './components/ui/progress';
import { Switch } from './components/ui/switch';
import { Text } from './components/ui/text';
import { useData } from './hooks/useData';
import { useSortData } from './hooks/useSortData';
import { Character, WithRank } from './types';

import { ResultsView } from './components/sorter/ResultsView';
import { Link } from './components/ui/link';
import { useToaster } from './context/ToasterContext';

function App() {
  const data = useData();
  const { toast } = useToaster();
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

  const charaList = (state?.arr
    .flatMap((ids, idx, arr) => {
      const startRank = arr.slice(0, idx).reduce((p, c) => p + c.length, 1);
      if (Array.isArray(ids)) {
        return ids.map((id) => ({ rank: startRank, ...data.find((i) => i.id === id) }));
      } else {
        return [{ rank: startRank, ...data.find((i) => i.id === (ids as string)) }];
      }
    })
    .filter((c) => !!c) ?? []) as WithRank<Character>[];

  const currentLeft =
    state &&
    state.mergeState?.leftArrIdx !== undefined &&
    listToSort.find(
      (l) => l.id === state.mergeState?.leftArr?.[state.mergeState?.leftArrIdx as number][0]
    );
  const currentRight =
    state &&
    state.mergeState?.rightArrIdx !== undefined &&
    listToSort.find(
      (l) => l.id === state.mergeState?.rightArr?.[state.mergeState?.rightArrIdx as number][0]
    );

  const getTitle = () => {
    const seriesName = Object.entries(filters?.series ?? {})
      .filter((e) => e[1])
      .map((e) => e[0]);
    const schoolName = Object.entries(filters?.school ?? {})
      .filter((e) => e[1])
      .map((e) => e[0]);
    const unitName = Object.entries(filters?.units ?? {})
      .filter((e) => e[1])
      .map(
        (e) =>
          data.find((d) => d.units.find((u) => u.id === e[0]))?.units.find((u) => u.id === e[0])
            ?.name
      );

    if (seriesName.length + schoolName.length + unitName.length > 1)
      return 'Yet another LL! sorter';
    if (seriesName.length === 1) {
      return `${seriesName[0]} Sorter`;
    }
    if (schoolName.length === 1) {
      return `${schoolName[0]} Sorter`;
    }
    if (unitName.length === 1) {
      return `${unitName[0]} Sorter`;
    }
    return 'Yet another LL! sorter';
  };
  const title = getTitle();

  const shareUrl = async () => {
    const params = new URLSearchParams();
    for (const key of ['series', 'units', 'school'] as const) {
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
    const url = `${location.origin}${location.pathname}?${params.toString()}`;
    try {
      await navigator.clipboard.writeText(url);
      toast?.('URL Copied to Clipboard');
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
      <Container flex={1} w="full" py={4} px={4}>
        <Stack alignItems="center" w="full">
          <Text fontSize="3xl" fontWeight="bold">
            {title}
          </Text>
          <Text>ヒトリダケナンテエラベナイヨーの時に手伝ってくれるかも</Text>
          <Text fontSize="sm" fontWeight="bold">
            {listCount} to be sorted
          </Text>
          <Wrap>
            <Button onClick={() => void shareUrl()} variant="outline">
              Share Current Preset
            </Button>
            <Button onClick={() => init()}>Start/ Reset</Button>
          </Wrap>
          <CharacterFilters filters={filters} setFilters={setFilters} />
          <Switch checked={seiyuu} onCheckedChange={(e) => setSeiyuu(e.checked)}>
            Do you like seiyuu ? (Seiyuu Mode)
          </Switch>
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
                    <Stack gap="1">
                      <Text fontWeight="bold">Keyboard Shortcuts</Text>
                      <Text>
                        <Kbd>←</Kbd>: Pick Left
                      </Text>
                      <Text>
                        <Kbd>→</Kbd>: Pick Right
                      </Text>
                      <Text>
                        <Kbd>↓</Kbd>: Tie/ Skip
                      </Text>
                      <Text>
                        <Kbd>↑</Kbd>: Undo
                      </Text>
                    </Stack>
                  </Stack>
                  <Text>Comparison No. {count}</Text>
                  <Progress value={progress} min={0} max={1} defaultValue={0} />
                </Stack>
              )}
              <Divider />
              {charaList && <ResultsView characters={charaList} isSeiyuu={seiyuu} w="full" />}
            </Stack>
          )}
        </Stack>
      </Container>
      <Stack gap="1" justifyContent="center" w="full" p="4" textAlign="center" bgColor="bg.muted">
        <Text>
          Created by{' '}
          <Link href="https://ham-san.net/namecard" target="_blank">
            ハムP
          </Link>{' '}
          | Inspired by a bunch of other sorters of course, Assets are not mine
        </Text>
        <Text>
          Check out source code on{' '}
          <Link href="https://github.com/hamproductions/the-sorter" target="_blank">
            GitHub
          </Link>
        </Text>
      </Stack>
    </Stack>
  );
}

export default App;
