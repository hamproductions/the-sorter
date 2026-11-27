import type { Song } from '~/types/songs';
import { getSongAliases } from '~/utils/abbreviations';
import songData from '../../data/song-info.json';

const songs = (songData as Song[]).map((song) => ({
  ...song,
  aliases: getSongAliases(song.id, song.englishName)
}));

export const useSongData = (): Song[] => {
  return songs;
};
