import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaXmark } from 'react-icons/fa6';
import { HStack, Stack } from 'styled-system/jsx';
import { Dialog } from '~/components/ui/dialog';
import { Tabs } from '~/components/ui/tabs';
import { Button } from '~/components/ui/button';
import { IconButton } from '~/components/ui/icon-button';
import { Text } from '~/components/ui/text';
import { getSongName } from '~/utils/names';
import { getSongColor } from '~/utils/song';
import { MiniDots } from './MiniDots';
import type { Song } from '~/types/songs';
import type { GuessResult } from '~/hooks/useHeardleState';

interface HeardleStatsDialogProps {
  guessResults: Record<string, GuessResult>;
  songs: Song[];
  lang: string;
  maxAttempts: number;
}

type TabValue = 'all' | 'correct' | 'failed' | 'passed';

function SongRow({
  song,
  result,
  lang,
  maxAttempts
}: {
  song: Song;
  result: GuessResult;
  lang: string;
  maxAttempts: number;
}) {
  const color = getSongColor(song);
  return (
    <HStack
      style={{ borderLeft: color ? `4px solid ${color}` : undefined }}
      justifyContent="space-between"
      rounded="l2"
      p="2"
      bg="bg.subtle"
    >
      <Text fontSize="sm" fontWeight="medium" lineClamp={1}>
        {getSongName(song.name, song.englishName, lang)}
      </Text>
      {result.result !== 'no-audio' && <MiniDots result={result} maxAttempts={maxAttempts} />}
    </HStack>
  );
}

export function HeardleStatsDialog({
  guessResults,
  songs,
  lang,
  maxAttempts
}: HeardleStatsDialogProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const entries = useMemo(() => {
    return Object.entries(guessResults)
      .map(([songId, result]) => {
        const song = songs.find((s) => s.id === songId);
        return song ? { song, result } : null;
      })
      .filter((e): e is NonNullable<typeof e> => e !== null)
      .toSorted((a, b) => b.result.attempts - a.result.attempts);
  }, [guessResults, songs]);

  const correctCount = entries.filter((e) => e.result.result === 'correct').length;
  const failedCount = entries.filter((e) => e.result.result === 'failed').length;
  const passedCount = entries.filter((e) => e.result.result === 'no-audio').length;
  const total = entries.length;
  const percent = total > 0 ? Math.round((correctCount / total) * 100) : 0;

  const filtered = (tab: TabValue) => {
    if (tab === 'all') return entries;
    const resultType = tab === 'correct' ? 'correct' : tab === 'failed' ? 'failed' : 'no-audio';
    return entries.filter((e) => e.result.result === resultType);
  };

  if (total === 0) return null;

  return (
    <Dialog.Root open={open} onOpenChange={({ open: o }) => setOpen(o)} lazyMount unmountOnExit>
      <Dialog.Trigger asChild>
        <Button variant="outline" size="sm">
          {t('heardle.view_stats')}
        </Button>
      </Dialog.Trigger>
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content w="full" maxW="lg" mx="4">
          <Stack gap="4" p="6">
            <Dialog.Title>{t('heardle.stats_title')}</Dialog.Title>
            <HStack gap="4" flexWrap="wrap">
              <Text color="green.500" fontSize="sm" fontWeight="bold">
                {correctCount} {t('heardle.tab_correct')}
              </Text>
              <Text color="red.500" fontSize="sm" fontWeight="bold">
                {failedCount} {t('heardle.tab_failed')}
              </Text>
              <Text color="fg.muted" fontSize="sm" fontWeight="bold">
                {passedCount} {t('heardle.tab_passed')}
              </Text>
              <Text fontSize="sm">
                {t('heardle.stats_correct', { correct: correctCount, total, percent })}
              </Text>
            </HStack>
            <Tabs.Root defaultValue="all" size="sm">
              <Tabs.List>
                <Tabs.Trigger value="all">
                  {t('heardle.tab_all')} ({total})
                </Tabs.Trigger>
                <Tabs.Trigger value="correct">
                  {t('heardle.tab_correct')} ({correctCount})
                </Tabs.Trigger>
                <Tabs.Trigger value="failed">
                  {t('heardle.tab_failed')} ({failedCount})
                </Tabs.Trigger>
                <Tabs.Trigger value="passed">
                  {t('heardle.tab_passed')} ({passedCount})
                </Tabs.Trigger>
                <Tabs.Indicator />
              </Tabs.List>
              {(['all', 'correct', 'failed', 'passed'] as TabValue[]).map((tab) => (
                <Tabs.Content key={tab} value={tab}>
                  <Stack gap="2" maxH="400px" py="2" overflow="auto">
                    {filtered(tab).length === 0 ? (
                      <Text py="4" color="fg.muted" fontSize="sm" textAlign="center">
                        {t('common.no_items')}
                      </Text>
                    ) : (
                      filtered(tab).map(({ song, result }) => (
                        <SongRow
                          key={song.id}
                          song={song}
                          result={result}
                          lang={lang}
                          maxAttempts={maxAttempts}
                        />
                      ))
                    )}
                  </Stack>
                </Tabs.Content>
              ))}
            </Tabs.Root>
          </Stack>
          <Dialog.CloseTrigger asChild position="absolute" top="2" right="2">
            <IconButton aria-label="Close Dialog" variant="ghost" size="sm">
              <FaXmark />
            </IconButton>
          </Dialog.CloseTrigger>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}
