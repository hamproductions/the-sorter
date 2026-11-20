import { useTranslation } from 'react-i18next';
import { FaChevronDown } from 'react-icons/fa6';
import { Box, HStack, Stack, Wrap } from 'styled-system/jsx';
import { Text } from '~/components/ui/text';
import { useData } from '~/hooks/useData';
import type { SetlistOrderEntry } from '~/types/performance-sort';
import type { Song } from '~/types/songs';
import { getSongPerformanceLineups } from '~/utils/performance-sort';
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

  return (
    <Stack gap="2" alignItems="center" w="full" minW="0" maxW={{ base: '300px', md: 'full' }}>
      {getSongPerformanceLineups(song, entries).map(({ key, group, labels, note, performers }) => {
        const entry = group[0];
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
            {performers.length > 0 && (
              <Box
                as="details"
                onClick={(event) => event.stopPropagation()}
                onKeyDown={(event) => event.stopPropagation()}
                w="full"
              >
                <Box
                  as="summary"
                  cursor="pointer"
                  display="flex"
                  gap="1"
                  justifyContent="center"
                  alignItems="center"
                  rounded="sm"
                  minH={{ base: '11', md: '8' }}
                  color="fg.muted"
                  fontSize="xs"
                  listStyleType="none"
                  _focusVisible={{
                    outline: '2px solid',
                    outlineColor: 'border.outline',
                    outlineOffset: '2px'
                  }}
                >
                  <FaChevronDown aria-hidden="true" size={10} />
                  <Box
                    as="span"
                    display="inline-flex"
                    gap="1.5"
                    alignItems="center"
                    verticalAlign="middle"
                    flexWrap="wrap"
                  >
                    <Text as="span" fontSize="xs" whiteSpace="nowrap">
                      {t('performance.performers')} ({performers.length})
                    </Text>
                    {performers.map((performer) => {
                      if (performer.kind === 'group')
                        return (
                          <Text as="span" key={`group-${performer.id}`} fontSize="xs">
                            {getArtistName(performer.name, i18n.language)}
                          </Text>
                        );
                      const character = characters.find(
                        (item) => String(item.id) === performer.characterId
                      );
                      return character?.hasIcon ? (
                        <CharacterIcon
                          key={character.id}
                          character={character}
                          locale={i18n.language}
                          alt=""
                          aria-hidden="true"
                          flexShrink="0"
                          w="5"
                          h="5"
                        />
                      ) : null;
                    })}
                  </Box>
                </Box>
                <Wrap
                  role="group"
                  aria-label={t('performance.performers')}
                  gap="1"
                  justifyContent="center"
                  w="full"
                  minW="0"
                  mt="2"
                >
                  {performers.map((performer) => {
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
                      <HStack
                        key={character.id}
                        title={name}
                        style={{ borderColor: character.colorCode ?? undefined }}
                        gap="1"
                        rounded="full"
                        borderWidth="1px"
                        py="0.5"
                        pl="1"
                        pr="2"
                        bg="bg.canvas"
                      >
                        {character.hasIcon && (
                          <CharacterIcon
                            character={character}
                            locale={i18n.language}
                            alt={name}
                            flexShrink="0"
                            w="5"
                            h="5"
                          />
                        )}
                        <Text fontSize="xs">{name}</Text>
                      </HStack>
                    );
                  })}
                </Wrap>
              </Box>
            )}
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
