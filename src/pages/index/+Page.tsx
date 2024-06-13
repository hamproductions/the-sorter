import { Suspense, lazy, useEffect, useState } from 'react';
import { FaShare } from 'react-icons/fa6';
import { CharacterCard } from '../../components/sorter/CharacterCard';
import { CharacterFilters } from '../../components/sorter/CharacterFilters';
import { Button } from '../../components/ui/button';
import { Kbd } from '../../components/ui/kbd';
import { Link } from '../../components/ui/link';
import { Progress } from '../../components/ui/progress';
import { Switch } from '../../components/ui/switch';
import { Text } from '../../components/ui/text';
import { useToaster } from '../../context/ToasterContext';
import { useData } from '../../hooks/useData';
import { useSortData } from '../../hooks/useSortData';
import { Character, WithRank } from '../../types';
import { getCurrentItem } from '../../utils/sort';
import { getAssetUrl } from '~/utils/assets';
import { Box, Container, HStack, Stack, Wrap } from 'styled-system/jsx';

const ResultsView = lazy(() =>
  import('../../components/sorter/ResultsView').then((m) => ({ default: m.ResultsView }))
);

export function Page() {
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
  const [showSettings, setShowSettings] = useState(false);

  const getCharaFromId = (id: string): Character | undefined => {
    const [charaId, castId] = id.split('-');
    const chara = data.find((i) => i.id === charaId);
    if (!chara) {
      return undefined;
    }
    return {
      ...chara,
      id,
      //@ts-expect-error TODO: will fix
      casts: chara.casts.filter((_, idx) => idx === (castId !== undefined ? Number(castId) : 0))
    };
  };

  const charaList = (state?.arr
    .flatMap((ids, idx, arr) => {
      const startRank = arr.slice(0, idx).reduce((p, c) => p + c.length, 1);
      if (Array.isArray(ids)) {
        return ids
          .map((id) => ({ rank: startRank, ...getCharaFromId(id) }))
          .filter((d) => 'id' in d);
      } else {
        const chara = data.find((i) => i.id === (ids as string));
        if (!chara) return [];
        return [{ rank: startRank, ...chara }];
      }
    })
    .filter((c) => !!c) ?? []) as WithRank<Character>[];

  const { left: leftItem, right: rightItem } =
    (state && getCurrentItem(state)) || ({} as { left: string[]; right: string[] });

  const currentLeft = leftItem && listToSort.find((l) => l.id === leftItem[0]);
  const currentRight = rightItem && listToSort.find((l) => l.id === rightItem[0]);

  const getTitlePrefix = () => {
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

    if (seriesName.length + schoolName.length + unitName.length > 1) return;
    if (seriesName.length === 1) {
      return seriesName[0];
    }
    if (schoolName.length === 1) {
      return schoolName[0];
    }
    if (unitName.length === 1) {
      return unitName[0];
    }
    return;
  };

  const title = `${getTitlePrefix() ?? 'Yet another LL!'} sorter`;

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

    if (urlSeiyuu !== null) {
      setSeiyuu(urlSeiyuu === 'true');
    }
  }, []);

  const handleStart = () => {
    init();
    setShowSettings(false);
  };

  // useEffect(() => {
  //   if (state === undefined) setShowSettings(true);
  // }, [state]);

  return (
    <Stack position="relative" w="full" minH="100vh">
      <Box
        style={{
          ['--bg-image' as 'backgroundImage']: `url('${getAssetUrl('/assets/bg.webp')}')`
        }}
        zIndex="0"
        position="fixed"
        top="0"
        left="0"
        w="100vw"
        h="100vh"
        opacity="0.05"
        backgroundPosition="center"
        backgroundAttachment="fixed"
        backgroundImage="var(--bg-image)"
        backgroundSize="cover"
      />
      <Container zIndex="1" flex={1} w="full" py={4} px={4}>
        <Stack alignItems="center" w="full">
          <Text textAlign="center" fontSize="3xl" fontWeight="bold">
            {title}
          </Text>
          <Text>ヒトリダケナンテエラベナイヨーの時に役に立てるかも</Text>
          <Text fontSize="sm" fontWeight="bold">
            {listCount} to be sorted
          </Text>
          <CharacterFilters
            isOpen={showSettings}
            setOpen={(isOpen) => setShowSettings(isOpen)}
            filters={filters}
            setFilters={setFilters}
          />
          <Switch checked={seiyuu} onCheckedChange={(e) => setSeiyuu(e.checked)}>
            Do you like seiyuu ? (Seiyuu Mode)
          </Switch>
          <Wrap>
            <Button onClick={() => void shareUrl()} variant="outline">
              <FaShare /> Share Current Settings
            </Button>
            <Button onClick={() => handleStart()}>
              {!state || state?.status === 'end' ? 'Start' : 'Reset'}
            </Button>
          </Wrap>
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
                          <Box hideBelow="sm">
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
                          <Box hideBelow="sm">
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
                    <Stack hideBelow="sm" gap="1">
                      <Text fontWeight="bold">Keyboard Shortcuts</Text>
                      <Wrap>
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
                      </Wrap>
                    </Stack>
                  </Stack>
                  <Text>Comparison No. {count}</Text>
                  <Progress value={progress} min={0} max={1} defaultValue={0} />
                </Stack>
              )}
              {charaList && progress === 1 && (
                <Suspense>
                  <ResultsView
                    titlePrefix={getTitlePrefix()}
                    characters={charaList}
                    isSeiyuu={seiyuu}
                    w="full"
                  />
                </Suspense>
              )}
            </Stack>
          )}
        </Stack>
      </Container>
      <Stack
        zIndex="1"
        gap="1"
        justifyContent="center"
        w="full"
        p="4"
        textAlign="center"
        bgColor="bg.muted"
      >
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
