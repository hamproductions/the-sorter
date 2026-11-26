import type HasuSongsData from '../../data/hasu-songs.json';
import type SongsData from '../../data/song-info.json';

import type ArtistData from '../../data/artists-info.json';

export type HasuSong = (typeof HasuSongsData.data)[0] & {
  wikiAudioUrl?: string;
  unitLabel?: string;
};
export type Song = (typeof SongsData)[0] & { wikiAudioUrl?: string; aliases?: string[] };

export type Artist = (typeof ArtistData)[0] & { englishName?: string };
