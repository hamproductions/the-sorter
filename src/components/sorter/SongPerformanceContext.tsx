import { useTranslation } from 'react-i18next';
import { Stack } from 'styled-system/jsx';
import { Text } from '~/components/ui/text';
import { useData } from '~/hooks/useData';
import type { SetlistOrderEntry } from '~/types/performance-sort';
import type { Song } from '~/types/songs';
import { getDistinctSongPerformanceEntries } from '~/utils/performance-sort';
import { getFullName } from '~/utils/character';
import { getArtistName } from '~/utils/names';

export function SongPerformanceContext({
  song,
  entries
}: {
  song: Song;
  entries: SetlistOrderEntry[];
}) {
  const { t, i18n } = useTranslation();
  const characters = useData();
  return (
    <Stack gap="2" w="full" minW="0" maxW={{ base: '300px', md: 'full' }} textAlign="start">
      {getDistinctSongPerformanceEntries(song, entries).map((entry, index) => (
        <Stack key={index} gap="1" minW="0">
          <Text color="fg.muted" fontSize="xs">
            {[entry.tourName, entry.label, entry.date, entry.venue].filter(Boolean).join(' · ')}
          </Text>
          {entry.customSongName && entry.customSongName !== song.name && (
            <Text fontSize="sm">{entry.customSongName}</Text>
          )}
          {entry.performers?.length ? (
            <Text fontSize="sm">
              {t('performance.performers')}:{' '}
              {entry.performers
                .map((performer) => {
                  if (performer.kind === 'group')
                    return getArtistName(performer.name, i18n.language);
                  const character = characters.find((c) => String(c.id) === performer.characterId);
                  return character ? getFullName(character, i18n.language) : '';
                })
                .filter(Boolean)
                .join(', ')}
            </Text>
          ) : null}
          {entry.remarks && (
            <Text fontSize="sm" overflowWrap="anywhere" whiteSpace="pre-wrap">
              {entry.remarks}
            </Text>
          )}
        </Stack>
      ))}
    </Stack>
  );
}
