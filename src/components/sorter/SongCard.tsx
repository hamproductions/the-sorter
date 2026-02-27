import { useTranslation } from 'react-i18next';
import { Text } from '../ui/text';
import type { StackProps } from 'styled-system/jsx';
import { Center, Box, Stack } from 'styled-system/jsx';
import type { Artist, Song } from '~/types/songs';
import { getSongColor } from '~/utils/song';
import { getArtistName, getSongName } from '~/utils/names';
import { useArtistsData } from '~/hooks/useArtistsData';
import { Heardle } from './Heardle';

function formatArtistsWithVariants(
  songArtists: Song['artists'],
  artistsData: Artist[],
  lang: string
): string {
  const grouped = new Map<string, { artist: Artist; variants: (string | null)[] }>();

  for (const sa of songArtists) {
    const artist = artistsData.find((a) => a.id === sa.id);
    if (!artist) continue;

    const existing = grouped.get(sa.id);
    if (existing) {
      existing.variants.push(sa.variant);
    } else {
      grouped.set(sa.id, { artist, variants: [sa.variant] });
    }
  }

  return Array.from(grouped.values())
    .map(({ artist, variants }) => {
      const name = getArtistName(artist.name, lang);
      const nonNullVariants = variants.filter((v): v is string => v !== null);
      if (nonNullVariants.length > 0) {
        return `${name} (${nonNullVariants.join('/')})`;
      }
      return name;
    })
    .join(', ');
}

export interface SongCardProps extends StackProps {
  song?: Song;
  artists?: Artist[];
  heardleMode?: boolean;
  /** Whether the song has been revealed (guessed correctly or auto-revealed) */
  isRevealed?: boolean;
  /** Whether the song has failed (exhausted all guesses) */
  isFailed?: boolean;
  /** Song inventory for Heardle search */
  songInventory?: Song[];
  /** Current attempt count for this song */
  attempts?: number;
  /** Maximum attempts allowed */
  maxAttempts?: number;
  /** Guess history for this song */
  guessHistory?: ('wrong' | 'pass')[];
  /** Audio duration for current attempt */
  audioDuration?: number;
  /** Called when user makes a guess */
  onGuess?: (guessedSongId: string) => void;
  /** Called when user passes */
  onPass?: () => void;
  /** Called when song has no audio */
  onNoAudio?: () => void;
  /** Ref to forward to the Heardle search input */
  heardleInputRef?: React.RefObject<HTMLInputElement | null>;
}

export function SongCard({
  song,
  artists: _artists,
  heardleMode,
  isRevealed,
  isFailed,
  songInventory,
  attempts = 0,
  maxAttempts = 5,
  guessHistory = [],
  audioDuration = 1,
  onGuess,
  onPass,
  onNoAudio,
  heardleInputRef,
  ...rest
}: SongCardProps) {
  const { t, i18n } = useTranslation();
  const artistsData = useArtistsData();

  const lang = i18n.language;

  if (!song) return null;

  // Determine if we should show Heardle or revealed content
  const showHeardle = heardleMode && !isRevealed && songInventory && onGuess && onPass && onNoAudio;
  const showInfo = !heardleMode || isRevealed;

  return (
    <Stack
      style={{
        ['--color' as 'color']: getSongColor(song) ?? undefined,
        borderColor: isFailed && heardleMode ? 'var(--colors-red-300)' : undefined,
        borderWidth: isFailed && heardleMode ? '2px' : undefined
      }}
      position="relative"
      gap={1}
      alignItems="center"
      rounded="l1"
      w="full"
      p={2}
      py={4}
      backgroundColor={{ base: 'bg.default', _hover: 'bg.muted' }}
      shadow="md"
      transition="background-color"
      {...rest}
    >
      {isFailed && heardleMode && (
        <Box
          zIndex={1}
          position="absolute"
          top="2"
          right="2"
          borderRadius="md"
          py="1"
          px="2"
          color="white"
          fontSize="xs"
          fontWeight="bold"
          bg="red.500"
        >
          {t('heardle.failed_badge', { defaultValue: 'FAILED' })}
        </Box>
      )}
      {/* <SchoolBadge character={character} locale={lang} /> */}
      {showHeardle && (
        <Stack flex={1} alignItems="center" w="full">
          <Heardle
            song={song}
            songInventory={songInventory}
            attempts={attempts}
            maxAttempts={maxAttempts}
            guessHistory={guessHistory}
            audioDuration={audioDuration}
            onGuess={onGuess}
            onPass={onPass}
            onNoAudio={onNoAudio}
            inputRef={heardleInputRef}
          />
        </Stack>
      )}
      {!showHeardle && (
        <Stack
          position="relative"
          flex={1}
          alignItems="center"
          w="full"
          minH={{ base: 0, sm: '240px' }}
          overflow="hidden"
        >
          <Center position="absolute" flex={1} w="full" h="full" overflow="hidden">
            <Center w="full" maxW="full" h="full">
              {showInfo && song.musicVideo && (
                <iframe
                  style={{ maxWidth: '100%' }}
                  height="240"
                  src={`https://www.youtube-nocookie.com/embed/${song.musicVideo.videoId}/?start=${song.musicVideo.videoOffset}&html5=1`}
                  title="YouTube video player"
                  //@ts-expect-error wtf
                  frameborder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerpolicy="strict-origin-when-cross-origin"
                  // oxlint-disable-next-line iframe-missing-sandbox shut up linter
                  sandbox="allow-scripts allow-same-origin"
                  allowfullscreen
                ></iframe>
              )}
            </Center>
          </Center>
        </Stack>
      )}
      <Stack gap={0} alignItems="center">
        <Text layerStyle="textStroke" color="var(--color)" fontSize="2xl" fontWeight="bold">
          {showInfo && getSongName(song.name, song.englishName, lang)}
        </Text>
        {showInfo && lang === 'en' && song.englishName && (
          <Text color="fg.muted" fontSize="xs">
            {song.name}
          </Text>
        )}
        <Text fontSize="sm" textAlign="center">
          {showInfo && formatArtistsWithVariants(song.artists, artistsData, lang)}
        </Text>
        {heardleMode && isRevealed && !song.wikiAudioUrl && (
          <Text mt={1} color="fg.muted" fontSize="xs">
            {t('heardle.no_audio_badge', { defaultValue: 'No audio available' })}
          </Text>
        )}
      </Stack>
    </Stack>
  );
}
