import type songsData from '../../data/hasu-songs.json';

export type Song = (typeof songsData.data)[0];
