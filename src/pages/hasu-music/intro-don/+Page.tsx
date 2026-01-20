import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { HasuSongFilterType } from '../../../components/sorter/HasuSongFilters';
import { Stack } from 'styled-system/jsx';
import { Metadata } from '~/components/layout/Metadata';
import { useHasuSongData } from '~/hooks/useHasuSongData';
import { Text } from '~/components/ui';
import { useToaster } from '~/context/ToasterContext';
import { useLocalStorage } from '~/hooks/useLocalStorage';
import { hasFilter } from '~/utils/filter';
import { matchSongFilter } from '~/utils/hasu-song-filter';
import { getAudioUrl } from '~/utils/assets';
import { detectSoundStart } from '~/utils/intro-don/detectSoundStart';

const randomInt = (max: number) => Math.round(Math.random() * max);

export function Page() {
  const songs = useHasuSongData();
  const { toast: _toast } = useToaster();
  const { t, i18n: _i18n } = useTranslation();

  const [songFilters] = useLocalStorage<HasuSongFilterType>('hasu-song-filters', undefined);

  const songList = useMemo(() => {
    return songs && songFilters && hasFilter(songFilters)
      ? songs.filter((s) => {
          return matchSongFilter(s, songFilters ?? {});
        })
      : songs;
  }, [songs, songFilters]);

  const [songIndex, setSongIndex] = useState(0);

  const initialize = () => {
    setSongIndex(randomInt(songList.length));
  };

  const currentSong = songList[songIndex];
  const songUrl = '/' + getAudioUrl(`${currentSong?.id}`);

  const title = t('intro-don');

  useEffect(() => {
    initialize();
    // oxlint-disable-next-line exhaustive-deps
  }, []);

  useEffect(() => {
    void detectSoundStart(window.location.origin + songUrl).then(console.log);
  }, [currentSong, songUrl]);
  console.log(songIndex, songUrl, currentSong);

  return (
    <>
      <Metadata title={title} helmet />
      <Stack alignItems="center" w="full">
        <Text fontSize="3xl" fontWeight="bold" textAlign="center">
          {title}
        </Text>
        <Text textAlign="center">{t('description')}</Text>
        {currentSong && (
          <>
            {currentSong?.title}
            {/* <audio src={'/' + getAudioUrl(`${currentSong?.id}`)} controls preload /> */}
          </>
        )}
      </Stack>
    </>
  );
}
