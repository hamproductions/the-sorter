import type characterData from '../../data/character-info.json';
import type songData from '../../data/song-info.json';
import type artistsData from '../../data/artists-info.json';

export type Character = (typeof characterData)[0];

export type Song = (typeof songData)[0];

export type Artist = (typeof artistsData)[0];

export type WithRank<T> = T & { rank: number };
