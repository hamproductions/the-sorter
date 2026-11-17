import { useTranslation } from 'react-i18next';
import { Box, Stack, Wrap } from 'styled-system/jsx';
import { Text } from '~/components/ui/text';
import { useData } from '~/hooks/useData';
import type { SetlistOrderEntry } from '~/types/performance-sort';
import type { Song } from '~/types/songs';
import {
  getDistinctSongPerformanceEntries,
  getPerformerSignature,
  getPerformanceVersionNote
} from '~/utils/performance-sort';
import { getFullName } from '~/utils/character';
import { getArtistName } from '~/utils/names';
import { CharacterIcon } from './CharacterIcon';

export function SongPerformanceContext({
  song,
  entries
}: {
  song: Song;
  entries: SetlistOrderEntry[];
}) {
  const { t, i18n } = useTranslation();
  const characters = useData();
  const lineups = new Map<string, SetlistOrderEntry[]>();
  for (const entry of getDistinctSongPerformanceEntries(song, entries)) {
    const key = JSON.stringify([
      getPerformerSignature(entry.performers),
      getPerformanceVersionNote(entry),
      entry.customSongName
    ]);
    lineups.set(key, [...(lineups.get(key) ?? []), entry]);
  }

  return (
    <Stack gap="2" alignItems="center" w="full" minW="0" maxW={{ base: '300px', md: 'full' }}>
      {[...lineups].map(([key, group]) => {
        const entry = group[0];
        const note = getPerformanceVersionNote(entry);
        const labels = group.map((item) => {
          const day = item.performanceName?.match(/Day\.?\s*(\d+)/i)?.[1];
          const position = item.label.match(/(?:M|EN)\d+$/)?.[0] ?? item.label;
          return [day ? `Day ${day}` : item.date, position].filter(Boolean).join(' · ');
        });
        return (
          <Stack key={key} gap="1" alignItems="center" w="full">
            {entry.customSongName && entry.customSongName !== song.name && (
              <Text fontSize="xs">{entry.customSongName}</Text>
            )}
            <Text
              title={group
                .map((item) =>
                  [item.tourName, item.performanceName, item.date, item.venue]
                    .filter(Boolean)
                    .join(' · ')
                )
                .join('\n')}
              color="fg.muted"
              fontSize="xs"
            >
              {labels.join(' / ')}
              {note && entry.performers?.length ? ` · ${note}` : ''}
            </Text>
            <Wrap
              role="group"
              aria-label={t('performance.performers')}
              gap="1"
              justifyContent="center"
              w="full"
              minW="0"
            >
              {entry.performers?.map((performer) => {
                if (performer.kind === 'group')
                  return (
                    <Box
                      key={`group-${performer.id}`}
                      borderRadius="md"
                      borderWidth="1px"
                      py="1"
                      px="2"
                    >
                      <Text fontSize="xs">{getArtistName(performer.name, i18n.language)}</Text>
                    </Box>
                  );
                const character = characters.find(
                  (item) => String(item.id) === performer.characterId
                );
                if (!character) return null;
                const name = getFullName(character, i18n.language);
                return (
                  <Box
                    key={character.id}
                    title={name}
                    style={{ borderColor: character.colorCode ?? undefined }}
                    flexShrink="0"
                    rounded="full"
                    borderWidth="2px"
                    overflow="hidden"
                  >
                    {character.hasIcon ? (
                      <CharacterIcon
                        character={character}
                        locale={i18n.language}
                        alt={name}
                        w="8"
                        h="8"
                      />
                    ) : (
                      <Text px="1" fontSize="xs">
                        {name}
                      </Text>
                    )}
                  </Box>
                );
              })}
            </Wrap>
            {!entry.performers?.length && note && (
              <Text color="fg.muted" fontSize="xs" overflowWrap="anywhere">
                {note}
              </Text>
            )}
          </Stack>
        );
      })}
    </Stack>
  );
}
